function key (uri) {
  if (typeof uri === 'string') {
    uri = new URL(uri)
  }
  return uri.href
    .replace(uri.hash, '')
}

module.exports = key
