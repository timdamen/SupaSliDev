#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const presentationsDir = join(rootDir, 'presentations')

const BASE_PORT = 3030

function getPresentations() {
  if (!existsSync(presentationsDir)) {
    return []
  }

  return readdirSync(presentationsDir)
    .filter((name) => {
      const fullPath = join(presentationsDir, name)
      return statSync(fullPath).isDirectory() && existsSync(join(fullPath, 'slides.md'))
    })
    .sort()
}

function startDevServer(name, port) {
  const presentationDir = join(presentationsDir, name)

  const slidev = spawn('npx', ['slidev', '--port', String(port)], {
    cwd: presentationDir,
    stdio: 'pipe',
    shell: true
  })

  slidev.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean)
    lines.forEach((line) => {
      console.log(`[${name}] ${line}`)
    })
  })

  slidev.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean)
    lines.forEach((line) => {
      console.error(`[${name}] ${line}`)
    })
  })

  slidev.on('error', (err) => {
    console.error(`[${name}] Failed to start: ${err.message}`)
  })

  slidev.on('close', (code) => {
    if (code !== 0) {
      console.error(`[${name}] Exited with code ${code}`)
    }
  })

  return slidev
}

function main() {
  const presentations = getPresentations()

  if (presentations.length === 0) {
    console.error('No presentations found in presentations/ directory')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('  Starting all presentations')
  console.log('='.repeat(60))
  console.log('\n  Running presentations:\n')

  presentations.forEach((name, index) => {
    const port = BASE_PORT + index
    console.log(`    ${name.padEnd(20)} http://localhost:${port}`)
  })

  console.log('\n' + '='.repeat(60) + '\n')

  const processes = presentations.map((name, index) => {
    const port = BASE_PORT + index
    return startDevServer(name, port)
  })

  function cleanup() {
    console.log('\nShutting down all presentations...')
    processes.forEach((proc) => {
      proc.kill('SIGTERM')
    })
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main()
