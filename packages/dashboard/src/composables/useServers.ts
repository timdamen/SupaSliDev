import { ref, readonly } from 'vue'

interface ServerInfo {
  port: number
}

const servers = ref<Record<string, ServerInfo>>({})

async function fetchStatus() {
  try {
    const response = await fetch('/api/servers')
    if (response.ok) {
      servers.value = await response.json()
    }
  } catch {
    // API server not running
  }
}

async function startServer(presentationId: string): Promise<{ success: boolean; port?: number }> {
  try {
    const response = await fetch(`/api/servers/${presentationId}`, { method: 'POST' })
    const result = await response.json()
    if (result.success) {
      servers.value = { ...servers.value, [presentationId]: { port: result.port } }
      return { success: true, port: result.port }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}

async function stopServer(presentationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/servers/${presentationId}`, { method: 'DELETE' })
    const result = await response.json()
    if (result.success) {
      const newServers = { ...servers.value }
      delete newServers[presentationId]
      servers.value = newServers
      return true
    }
    return false
  } catch {
    return false
  }
}

function isRunning(presentationId: string): boolean {
  return presentationId in servers.value
}

function getPort(presentationId: string): number | undefined {
  return servers.value[presentationId]?.port
}

let pollingInterval: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollingInterval) return
  fetchStatus()
  pollingInterval = setInterval(fetchStatus, 2000)
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

export function useServers() {
  return {
    servers: readonly(servers),
    fetchStatus,
    startServer,
    stopServer,
    isRunning,
    getPort,
    startPolling,
    stopPolling
  }
}
