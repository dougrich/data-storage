// data dependency tree indicates data dependencies
const { FileEngine } = require('../../');

(async function () {
  const engine = new FileEngine(__dirname)
  const node = await engine.get('file:///data.yml')
  console.log(node)
})().catch(err => console.error(err))
