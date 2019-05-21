class ResourceEngine {
  constructor (
    parsers,
    protocols,
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

  async get (reference, root) {
    if (reference[0] === '#') {
      // specialcase: this is a root node
      return this.jsonpointer.get(root, reference.slice(1))
    }
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
