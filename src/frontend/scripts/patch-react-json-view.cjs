const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const source = path.join(repoRoot, 'libs', 'react-json-view', 'dist', 'main.js')
const target = path.join(repoRoot, 'node_modules', 'react-json-view', 'dist', 'main.js')

if (!fs.existsSync(source)) {
  console.error(`[patch-react-json-view] source not found: ${source}`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(target), { recursive: true })
fs.copyFileSync(source, target)
console.log(`[patch-react-json-view] copied ${path.relative(repoRoot, source)} -> ${path.relative(repoRoot, target)}`)
