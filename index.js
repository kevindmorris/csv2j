#!/usr/bin/env node

import { parse } from "csv-parse";
import { createReadStream, writeFileSync } from "fs";
import { parse as _parse, join } from "path";
import { pipeline } from "stream";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";

const argv = yargs(hideBin(process.argv))
  .usage(
    "Usage: $0 -i <input.csv> [-o output.json] [--delim <char>] [--pretty]"
  )
  .option("input", {
    alias: "i",
    type: "string",
    describe: "Path to input CSV file",
    demandOption: true,
  })
  .option("output", {
    alias: "o",
    type: "string",
    describe: "Path to output JSON file (default: base name of the input with .json)",
  })
  .option("delim", {
    alias: "d",
    type: "string",
    describe: "CSV delimiter",
    default: ",",
  })
  .help()
  .parse();

const inputStream = createReadStream(argv.input);

const records = [];
const parser = parse({
  columns: true,
  delimiter: argv.delim,
  skip_empty_lines: true,
  trim: true,
});

function coerce(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (s === "") return null;

  // Boolean
  const lower = s.toLowerCase();
  if (lower === "true") return true;
  if (lower === "false") return false;

  // Integer
  if (/^[+-]?\d+$/.test(s)) {
    const n = Number(s);
    if (!Number.isNaN(n)) return n;
  }

  // Float
  if (
    /^[+-]?(\d*\.\d+|\d+\.\d*)([eE][+-]?\d+)?$/.test(s) ||
    /^[+-]?\d+[eE][+-]?\d+$/.test(s)
  ) {
    const f = Number(s);
    if (!Number.isNaN(f)) return f;
  }

  return raw;
}

pipeline(inputStream, parser, (err) => {
  if (err) {
    console.error("Error parsing CSV:", err.message);
    process.exit(1);
  } else {
    const coerced = records.map((rec) => {
      const out = {};
      for (const [k, v] of Object.entries(rec)) {
        out[k] = coerce(v);
      }
      return out;
    });

    const jsonStr = JSON.stringify(coerced, null, 2);

    let outPath = argv.output;
    if (!outPath) {
      const parsed = _parse(argv.input);
      outPath = join(parsed.dir, parsed.name + ".json");
    }

    try {
      writeFileSync(outPath, jsonStr);
      console.log(`Wrote JSON to ${outPath}`);
    } catch (e) {
      console.error("Failed to write output:", e.message);
      process.exit(1);
    }
  }
});

parser.on("readable", () => {
  let record;
  while ((record = parser.read())) {
    records.push(record);
  }
});
