// data dependency tree indicates data dependencies
const ResourceEngine = require('./src/resource-engine');

(async function () {
  const engine = new ResourceEngine()
  const node = await engine.get('res:///abc.yml')
  console.log(node)
})().catch(err => console.error(err))
