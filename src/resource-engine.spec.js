const { expect } = require('chai')
const sinon = require('sinon')

const key = require('./urikey')
const ResourceEngine = require('./resource-engine')

describe('ResourceEngine', () => {
  describe('#get', () => {
    it('returns self reference', async () => {
      const engine = new ResourceEngine({}, {})
      expect(await engine.get('#/def', { def: '1234' })).to.equal('1234')
    })
    it('returns a cached node', async () => {
      const engine = new ResourceEngine({}, {})
      const node = {}
      const wrapper = { get: sinon.stub().resolves(node) }
      const uri = 'res:///def.json'
      engine.resources[key(uri)] = wrapper
      const result = await engine.get(uri)
      expect(result).to.equal(node)
    })

    it('returns a subset of a cached node', async () => {
      const engine = new ResourceEngine({}, {})
      const node = { 'def': 'abc' }
      const wrapper = { get: sinon.stub().resolves(node) }
      const uri = 'res:///def.json#/def'
      engine.resources[key(uri)] = wrapper
      const result = await engine.get(uri)
      expect(result).to.equal('abc')
    })

    it('throws an error when the protocol is non-existant', async () => {
      const engine = new ResourceEngine({}, {})
      const uri = 'res:///def.json#/def'
      expect(engine.get(uri)).to.be.rejected('Unknown protocol res:')
    })

    it('throws an error when the extension is non-existant', async () => {
      const protocols = {
        'res:': sinon.stub().resolves()
      }
      const engine = new ResourceEngine({}, protocols)
      const uri = 'res:///def.json#/def'
      expect(engine.get(uri)).to.be.rejected('Unknown extension .json')
      expect(protocols['res:']).not.to.have.been.called()
    })

    it('moves data through protocol reader and extension parser correctly', async () => {
      const value = { abc: 'def' }
      const protocols = {
        'res:': sinon.stub().resolves(JSON.stringify(value))
      }
      const parsers = {
        '.json': sinon.stub().returns(value)
      }
      const engine = new ResourceEngine(parsers, protocols)
      const uri = 'res:///def.json'
      await expect(engine.get(uri)).to.eventually.eql(value)
      expect(protocols['res:']).to.have.been.calledWith(new URL(uri))
      expect(parsers['.json']).to.have.been.calledWith(JSON.stringify(value))
    })

    it('moves data through protocol reader and extension parser correctly, keeping cached copy independent of hash references', async () => {
      const value = { abc: 'def', xyz: '123' }
      const protocols = {
        'res:': sinon.stub().resolves(JSON.stringify(value))
      }
      const parsers = {
        '.json': sinon.stub().returns(value)
      }
      const engine = new ResourceEngine(parsers, protocols)
      const uri = 'res:///def.json#/abc'
      const uri2 = 'res:///def.json#/xyz'
      await expect(engine.get(uri)).to.eventually.eql('def')
      expect(protocols['res:']).to.have.been.calledWith(new URL(uri))
      expect(parsers['.json']).to.have.been.calledWith(JSON.stringify(value))
      expect(engine.resources[key(uri)]).to.exist()
      expect(engine.resources[key(uri)].uri).to.equal(key(uri))
      protocols['res:'].reset()
      parsers['.json'].reset()
      await expect(engine.get(uri2)).to.eventually.eql('123')
      expect(protocols['res:']).not.to.have.been.called()
      expect(parsers['.json']).not.to.have.been.called()
    })
  })
})
