const REF_PROPERTY = '$ref'

async function evaluateNode (engine, node, root) {
  if (typeof (node) === 'object') {
    if (Array.isArray(node)) {
      return Promise.all(node.map(n => evaluateNode(engine, n, root)))
    } else if (node[REF_PROPERTY] != null) {
      const referencedValue = await engine.get(node[REF_PROPERTY], root)
      return evaluateNode(engine, referencedValue, root)
    } else {
      const fieldValues = await Promise.all(Object.keys(node).map(async field => {
        const value = await evaluateNode(engine, node[field], root)
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
  constructor (
    engine,
    node,
    uri
  ) {
    // calculate any dependencies
    this.engine = engine
    this.node = node
    this.uri = uri
    this.resolved = null
  }

  async get () {
    if (!this.resolved) {
      this.resolved = await evaluateNode(this.engine, this.node, this.node)
    }
    return this.resolved
  }
}

module.exports = ResourceWrapper
