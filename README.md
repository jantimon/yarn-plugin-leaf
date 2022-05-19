# yarn-plugin-leaf

Yarn has a powerful workspace feature which installs all workspace modules together.

The `yarn-plugin-leaf` plugin adds `leaf` modules. Leaf modules are standalone
modules with a standalone package.json and yarn.lock file.

In contrast to workspace modules leaf modules and all of their dependencies are only 
installed on demand.

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

Activate a leaf module and install all it's dependencies:

```
  yarn leaf activate my-special-package
```

Disable a leaf module and uninstall all it's dependencies:

```
  yarn leaf disable my-special-package
```

Updates of all active leaf modules will run automatically
during your normal yarn install run

```
  yarn
```


Update the `yarn leaf` module:
```
  yarn plugin import https://raw.githubusercontent.com/jantimon/yarn-plugin-leaf/main/bundles/%40yarnpkg/plugin-leaf.js
```