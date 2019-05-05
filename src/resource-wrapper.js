const REF_PROPERTY = '$ref'

async function evaluateNode (engine, node, root) {
  if (typeof (node) === 'object') {
    if (Array.isArray(node)) {
      return Promise.all(node.map(n => evaluateNode(engine, n, root)))
    } else if (node[REF_PROPERTY] != null) {
      const ref = node[REF_PROPERTY]
      let referencedValue
      if (Array.isArray(ref)) {
        const results = await Promise.all(ref.map(ref => engine.get(ref, root)))
        referencedValue = []
        for (const result of results) {
          if (Array.isArray(result)) {
            referencedValue.push(...result)
          } else {
            referencedValue.push(result)
          }
        }
      } else {
        referencedValue = await engine.get(ref, root)
      }
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
