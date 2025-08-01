# csv2j

> CLI to convert CSV to JSON with number and boolean coercion.

## Install

From npm

```sh
npm install -g csv2j
```

or, run without installing

```sh
npx csv2j -i employees.csv
```

## Usage

```sh
csv2j -i employees.csv
```

### Options

- -i, --input CSV input path

- -o, --output JSON output path (defaults to input basename .json)

- -d, --delim delimiter (default ",")

- --version print the version

- --help review help documentation
