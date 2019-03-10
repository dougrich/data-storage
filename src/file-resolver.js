class FileResolver {
  constructor (
    root,
    path = require('path'),
    fs = require('fs-extra')
  ) {
    return {
      'file:': async uri => {
        const filename = path.resolve(root, '.' + uri.pathname)
        const relative = path.relative(root, filename)
        if (relative.includes('..')) {
          throw new Error('Reaching out of the root folder')
        }
        return fs.readFile(filename, { encoding: 'utf8' })
      }
    }
  }
}

module.exports = FileResolver
