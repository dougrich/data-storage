# Efficient Linked Data Storage

## Getting Started

Assuming that you have a file called `abc.yml` next to your script, containing:

```yaml
title: this is a test
subtitle: this is really a subtitle
description:
- $ref: '#/title'
- $ref: '#/subtitle'
```

```javascript
// verbose
const { ResourceEngine, StandardParsers, FileResolver } = require('@dougrich/data-storage')
const engine = new Resourceengine(StandardParsers, new FileResolver(__dirname))
const node = await engine.get('file:///abc.yml')

// file standard
const { FileEngine } = require('@dougrich/data-storage)
const engine = new FileEngine(__dirname)
const node = await engine.get('file:///abc.yml')
```

In both cases, the resulting `node` will look like this:
```json
{
  "title": "this is a test",
  "subtitle": "this is really a subtitle",
  "description": [
    "this is a test",
    "this is really a subtitle"
  ]
}
```

References can be across files as well.

## Examples

See `./examples` for detailed examples. Each example includes a `index.js` that includes the same client code.