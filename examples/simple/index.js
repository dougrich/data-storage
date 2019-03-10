// data dependency tree indicates data dependencies
const path = require('path')
const { ResourceEngine, StandardParsers, FileResolver } = require('../../');

(async function () {
  const engine = new ResourceEngine(StandardParsers, new FileResolver(path.join(__dirname, 'data')))
  const node = await engine.get('file:///abc.yml')
  console.log(node)
})().catch(err => console.error(err))
