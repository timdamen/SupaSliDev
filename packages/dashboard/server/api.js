import { createServer } from 'http'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(__dirname, '..', '..', '..')

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

function getStatus() {
  const servers = {}
  for (const [id, server] of runningServers) {
    servers[id] = { port: server.port }
  }
  return servers
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
