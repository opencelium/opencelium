const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')
const distDir = path.join(repoRoot, 'dist')
const target = path.join(distDir, 'config.json')

// `vite build` copies public/config.json into dist/ verbatim, which carries the
// dev default (direct :9090, no prefix). Production deploys sit behind a
// reverse proxy that routes /api and /ws to the backend instead, so overwrite
// dist/config.json with those values as the last build step.
const productionConfig = {
  server: {
    protocol: '',
    hostname: '',
    port: '',
    prefix: '/api',
  },
  socket: {
    protocol: '',
    hostname: '',
    port: '',
    prefix: '/ws',
  },
}

if (!fs.existsSync(distDir)) {
  console.error(`[write-production-config] dist/ not found — run vite build first`)
  process.exit(1)
}

fs.writeFileSync(target, `${JSON.stringify(productionConfig, null, 2)}\n`)
console.log(`[write-production-config] wrote production config -> ${path.relative(repoRoot, target)}`)
