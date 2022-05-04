# yarn-plugin-leaf

Yarn has a powerful workspace feature which installs all workspace modules together.

`yarn-plugin-leaf` adds `leaf` modules which are not installed by default.

Each leaf has to be activated by hand.  
All active leafs will be updated automatically on ever `yarn` run.

## Installation

```shell
yarn plugin import https://raw.githubusercontent.com/jantimon/yarn-plugin-leaf/main/bundles/%40yarnpkg/plugin-leaf.js
```

## Example

```json
{
  "name": "my project",
  "leafModules": [
    "local-modules/*"
  ]
}
```

## Usage

list all available leaf modules:

```
yarn leaf
```

```
yarn leaf activate my-special-package
```

```
yarn leaf disable my-special-package
```