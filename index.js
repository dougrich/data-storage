// data dependency tree indicates data dependencies
const url = require('url')
const path = require('path')
const fs = require('fs-extra')
const jsyaml = require('js-yaml')
const toml = require('toml')
const json5 = require('json5')
const jsonpointer = require('jsonpointer')

const REF_PROPERTY = '$ref'

function referenceResource(ref) {
  const { protocol, host, pathname } = url.parse(ref)
  return `${protocol}/${host}/${pathname}`
}

function listDependencies(dependencies, node) {
  if (Array.isArray(node)) {
    for (const entry of node) {
      listDependencies(dependencies, entry)
    }
  } else if (typeof (node) === 'object' && node[REF_PROPERTY] != null) {
    // it is a reference
    const uri = referenceResource(node[REF_PROPERTY])
    if (dependencies.indexOf(uri) === -1) {
      dependencies.push(uri)
    }
  } else if (typeof (node) === 'object') {
    for (const k in node) {
      listDependencies(dependencies, node[k])
    }
  }
}

async function evaluateNode(engine, node) {
  if (typeof (node) === 'object') {
    if (Array.isArray(node)) {
      return Promise.all(node.map(n => evaluateNode(engine, n)))
    } else if (node[REF_PROPERTY] != null) {
      return await engine.get(node[REF_PROPERTY])
    } else {
      const fieldValues = await Promise.all(Object.keys(node).map(async field => {
        const value = await evaluateNode(engine, node[field])
        return {
          field,
          value
        }
      }))
      const container = {}
      for (const { field, value } of fieldValues) {
        container[field] = value
      }
      return container
    }
  } else {
    return node
  }
}

class ResourceWrapper {
  constructor(
    engine,
    node,
    uri
  ) {
    // calculate any dependencies
    this.engine = engine
    this.node = node
    this.uri = uri
    this.dependencies = []
    this.resolved = null
    listDependencies(this.dependencies, this.node)
  }

  async get() {
    if (!this.resolved) {
      this.resolved = await evaluateNode(this.engine, this.node)
    }
    return this.resolved
  }
}

class ResourceEngine {
  constructor(
  ) {
    this.resources = {}
    this.parsers = {
      '.yml': contents => jsyaml.safeLoad(contents),
      '.toml': contents => toml.parse(contents),
      '.json5': contents => json5.parse(contents),
      '.json': contents => JSON.parse(contents)
    }
    this.protocols = {
      'res:': async uri => {
        const filename = path.resolve(__dirname, 'examples/simple', '.' + uri.pathname)
        return await fs.readFile(filename, { encoding: 'utf8' })
      }
    }
  }

  async get(reference) {
    const uri = url.parse(reference)
    const key = uri.href
      .replace(uri.hash, '')
    
    if (!this.resources[key]) {

      if (!this.protocols[uri.protocol]) {
        throw new Error('Unknown protocol ' + uri.protocol)
      }

      const rawContents = await this.protocols[uri.protocol](uri)
  
      const extension = path.extname(uri.pathname)
      
      if (!this.parsers[extension]) {
        throw new Error('Unknown extension ' + extension)
      }

      const contents = this.parsers[extension](rawContents)
  
      this.resources[key] = new ResourceWrapper(this, contents, uri)
    }

    const node = await this.resources[key].get()
    if (uri.hash == null) {
      return node
    } else {
      return jsonpointer.get(node, uri.hash.slice(1))
    }
  }
}

(async function () {
  const engine = new ResourceEngine()
  const node = await engine.get("res:///abc.yml")
  console.log(node)
})().catch(err => console.error(err))