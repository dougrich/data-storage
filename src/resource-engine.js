class ResourceEngine {
  constructor (
    parsers = {
      '.yml': contents => require('js-yaml').safeLoad(contents),
      '.toml': contents => require('toml').parse(contents),
      '.json5': contents => require('json5').parse(contents),
      '.json': contents => JSON.parse(contents)
    },
    protocols = {
      'res:': async uri => {
        const filename = require('path').resolve(__dirname, '../examples/simple', '.' + uri.pathname)
        return require('fs-extra').readFile(filename, { encoding: 'utf8' })
      }
    },
    key = require('./urikey'),
    ResourceWrapper = require('./resource-wrapper'),
    path = require('path'),
    jsonpointer = require('jsonpointer')
  ) {
    this.resources = {}
    this.parsers = parsers
    this.protocols = protocols
    this.ResourceWrapper = ResourceWrapper
    this.path = path
    this.jsonpointer = jsonpointer
    this.key = key
  }

  async get (reference) {
    const uri = new URL(reference)
    const key = this.key(uri)

    if (!this.resources[key]) {
      if (!this.protocols[uri.protocol]) {
        throw new Error('Unknown protocol ' + uri.protocol)
      }

      const extension = this.path.extname(uri.pathname)

      if (!this.parsers[extension]) {
        throw new Error('Unknown extension ' + extension)
      }

      const rawContents = await this.protocols[uri.protocol](uri)

      const contents = this.parsers[extension](rawContents)

      this.resources[key] = new this.ResourceWrapper(this, contents, key)
    }

    const node = await this.resources[key].get()
    if (uri.hash == null) {
      return node
    } else {
      return this.jsonpointer.get(node, uri.hash.slice(1))
    }
  }
}

module.exports = ResourceEngine
