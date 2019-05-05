const { expect } = require('chai')
const sinon = require('sinon')

const ResourceWrapper = require('./resource-wrapper')

describe('ResourceWrapper', () => {
  describe('#get', () => {
    it('returns the node as-is when no references involved', async () => {
      const engine = {
        get: sinon.stub().resolves()
      }
      const node = {
        'abc': 'def'
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql(node)
      expect(engine.get).not.to.have.been.called()
    })

    it('resolves self-references', async () => {
      const engine = {
        get: sinon.stub().resolves('def')
      }
      const node = {
        'abc': 'def',
        'xyz': { '$ref': '#/abc' }
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': 'def',
        'xyz': 'def'
      })
      expect(engine.get).to.have.been.calledWith('#/abc', node)
    })

    it('resolves cross-reference', async () => {
      const engine = {
        get: sinon.stub().resolves({ 'def': '123' })
      }
      const node = {
        'abc': 'def',
        'xyz': { '$ref': 'res:///def.json' }
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': 'def',
        'xyz': {
          'def': '123'
        }
      })
      expect(engine.get).to.have.been.calledWith('res:///def.json', node)
    })

    it('resolves self-referential cross-reference', async () => {
      const engine = {
        get: sinon.stub().callsFake((ref, node) => {
          return node[ref.slice(2)]
        })
      }
      const node = {
        'abc': 'def',
        'xyz': { '$ref': '#/abc' },
        'xyz2': { '$ref': '#/xyz' }
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': 'def',
        'xyz': 'def',
        'xyz2': 'def'
      })
      expect(engine.get).to.have.been.calledWith('#/abc', node)
      expect(engine.get).to.have.been.calledWith('#/xyz', node)
    })

    it('resolves arrays', async () => {
      const engine = {
        get: sinon.stub().callsFake((ref, node) => {
          return node[ref.slice(2)]
        })
      }
      const node = {
        'abc': [1, 2],
        'def': { '$ref': '#/abc' }
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': [1, 2],
        'def': [1, 2]
      })
    })

    it('resolves array of references', async () => {
      const engine = {
        get: sinon.stub().callsFake((ref, node) => {
          return node[ref.slice(2)]
        })
      }
      const node = {
        'abc': [1, 2],
        'def': [{ '$ref': '#/abc' }, { '$ref': '#/abc'}]
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': [1, 2],
        'def': [[1, 2], [1,2]]
      })
    })

    it('resolves array of references', async () => {
      const engine = {
        get: sinon.stub().callsFake((ref, node) => {
          return node[ref.slice(2)]
        })
      }
      const node = {
        'abc': [1, 2],
        'def': { '$ref': ['#/abc', '#/abc'] }
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': [1, 2],
        'def': [1, 2, 1, 2]
      })
    })

    it('resolves array of references in mixed', async () => {
      const engine = {
        get: sinon.stub().callsFake((ref, node) => {
          return node[ref.slice(2)]
        })
      }
      const node = {
        'abc': [1, 2],
        'xyz': 4,
        'def': { '$ref': ['#/abc', '#/xyz'] }
      }
      const wrapper = new ResourceWrapper(engine, node, '')
      expect(await wrapper.get()).to.eql({
        'abc': [1, 2],
        'xyz': 4,
        'def': [1, 2, 4]
      })
    })
  })
})
