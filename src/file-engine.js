const ResourceEngine = require('./resource-engine')
const FileResolver = require('./file-resolver')
const StandardParsers = require('./standard-parsers')

class FileEngine extends ResourceEngine {
  constructor (pathname) {
    super(StandardParsers, new FileResolver(pathname))
  }
}

module.exports = FileEngine
