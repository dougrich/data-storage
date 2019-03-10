module.exports = {
  '.yml': contents => require('js-yaml').safeLoad(contents),
  '.toml': contents => require('toml').parse(contents),
  '.json5': contents => require('json5').parse(contents),
  '.json': contents => JSON.parse(contents)
}
