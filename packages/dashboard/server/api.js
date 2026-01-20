import { createServer } from 'http'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..', '..', '..')
const presentationsDir = join(projectRoot, 'presentations')

const runningServers = new Map()

function getNextPort() {
  const usedPorts = new Set([...runningServers.values()].map(s => s.port))
  let port = 3030
  while (usedPorts.has(port)) {
    port++
  }
  return port
}

function startServer(presentationId) {
  if (runningServers.has(presentationId)) {
    return { success: true, port: runningServers.get(presentationId).port, alreadyRunning: true }
  }

  const port = getNextPort()
  const presentationPath = join(projectRoot, 'presentations', presentationId)

  const process = spawn('pnpm', ['slidev', '--port', String(port), '--open', 'false'], {
    cwd: presentationPath,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  })

  runningServers.set(presentationId, { process, port })

  process.on('close', () => {
    runningServers.delete(presentationId)
  })

  process.on('error', (err) => {
    console.error(`Failed to start server for ${presentationId}:`, err)
    runningServers.delete(presentationId)
  })

  return { success: true, port, alreadyRunning: false }
}

function stopServer(presentationId) {
  const server = runningServers.get(presentationId)
  if (!server) {
    return { success: false, error: 'Server not running' }
  }

  server.process.kill('SIGTERM')
  runningServers.delete(presentationId)
  return { success: true }
}

function stopAllServers() {
  const stopped = []
  for (const [id] of runningServers) {
    const result = stopServer(id)
    if (result.success) {
      stopped.push(id)
    }
  }
  return { success: true, stopped }
}

function getStatus() {
  const servers = {}
  for (const [id, server] of runningServers) {
    servers[id] = { port: server.port }
  }
  return servers
}

function createPresentation({ name, title, description, theme }) {
  const presentationPath = join(presentationsDir, name)

  if (existsSync(presentationPath)) {
    return { success: false, field: 'name', message: 'A presentation with this name already exists' }
  }

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  if (!slugRegex.test(name)) {
    return { success: false, field: 'name', message: 'Name must be a valid slug (lowercase letters, numbers, hyphens only)' }
  }

  mkdirSync(presentationPath, { recursive: true })

  const displayTitle = title || name
  const slidesContent = `---
theme: ${theme}
background: https://cover.sli.dev
title: ${displayTitle}
${description ? `info: |\n  ${description.split('\n').join('\n  ')}` : ''}
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
css: unocss
---

<style>
@import '@supaslidev/shared/themes/default.css';
@import '@supaslidev/shared/styles/index.css';
</style>

# ${displayTitle}

${description || 'Welcome to your new presentation'}

<div class="pt-12">
  <span @click="$slidev.nav.next" class="px-2 py-1 rounded cursor-pointer" hover="bg-white bg-opacity-10">
    Press Space to continue <carbon:arrow-right class="inline"/>
  </span>
</div>

---

# Slide 2

Start building your presentation!

---
layout: center
class: text-center
---

# Thank You

[Documentation](https://sli.dev)
`

  const packageJson = {
    name: `@supaslidev/${name}`,
    type: 'module',
    private: true,
    scripts: {
      build: 'slidev build',
      dev: 'slidev --open',
      export: 'slidev export'
    },
    dependencies: {
      '@slidev/cli': 'catalog:',
      '@slidev/theme-default': 'catalog:',
      '@slidev/theme-seriph': 'catalog:',
      '@supaslidev/shared': 'workspace:*',
      vue: 'catalog:'
    },
    devDependencies: {
      '@vue/compiler-sfc': 'catalog:'
    }
  }

  writeFileSync(join(presentationPath, 'slides.md'), slidesContent)
  writeFileSync(join(presentationPath, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n')

  return {
    success: true,
    presentation: {
      id: name,
      title: displayTitle,
      description: description || '',
      theme,
      background: 'https://cover.sli.dev',
      duration: ''
    }
  }
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname

  if (path === '/api/servers' && req.method === 'GET') {
    res.writeHead(200)
    res.end(JSON.stringify(getStatus()))
    return
  }

  if (path === '/api/servers' && req.method === 'DELETE') {
    const result = stopAllServers()
    res.writeHead(200)
    res.end(JSON.stringify(result))
    return
  }

  if (path === '/api/servers/stop-all' && req.method === 'POST') {
    const result = stopAllServers()
    res.writeHead(200)
    res.end(JSON.stringify(result))
    return
  }

  if (path.startsWith('/api/servers/') && req.method === 'POST') {
    const presentationId = path.split('/api/servers/')[1]
    const result = startServer(presentationId)
    res.writeHead(result.success ? 200 : 500)
    res.end(JSON.stringify(result))
    return
  }

  if (path.startsWith('/api/servers/') && req.method === 'DELETE') {
    const presentationId = path.split('/api/servers/')[1]
    const result = stopServer(presentationId)
    res.writeHead(result.success ? 200 : 404)
    res.end(JSON.stringify(result))
    return
  }

  if (path === '/api/presentations' && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const data = JSON.parse(body)
        const result = createPresentation(data)
        if (result.success) {
          res.writeHead(201)
          res.end(JSON.stringify(result.presentation))
        } else {
          res.writeHead(400)
          res.end(JSON.stringify({ field: result.field, message: result.message }))
        }
      } catch {
        res.writeHead(400)
        res.end(JSON.stringify({ message: 'Invalid JSON' }))
      }
    })
    return
  }

  res.writeHead(404)
  res.end(JSON.stringify({ error: 'Not found' }))
})

const API_PORT = 3001

server.listen(API_PORT, () => {
  console.log(`API server running on http://localhost:${API_PORT}`)
})

process.on('SIGINT', () => {
  console.log('\nShutting down servers...')
  for (const [id] of runningServers) {
    stopServer(id)
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  for (const [id] of runningServers) {
    stopServer(id)
  }
  process.exit(0)
})
