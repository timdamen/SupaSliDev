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

function getPortForPresentation(name, presentations) {
  const index = presentations.indexOf(name)
  if (index === -1) {
    return null
  }
  return BASE_PORT + index
}

function printUsage(presentations) {
  console.error('Usage: pnpm dev <presentation-name>')
  console.error('\nAvailable presentations:')

  if (presentations.length === 0) {
    console.error('  No presentations found')
  } else {
    presentations.forEach((name, index) => {
      console.error(`  ${name} (port ${BASE_PORT + index})`)
    })
  }
}

function startDevServer(name, port) {
  const presentationDir = join(presentationsDir, name)

  console.log('\n' + '='.repeat(50))
  console.log(`  Presentation: ${name}`)
  console.log(`  Port: ${port}`)
  console.log(`  URL: http://localhost:${port}`)
  console.log('='.repeat(50) + '\n')

  const slidev = spawn('npx', ['slidev', '--port', String(port), '--open'], {
    cwd: presentationDir,
    stdio: 'inherit',
    shell: true
  })

  slidev.on('error', (err) => {
    console.error(`Failed to start dev server: ${err.message}`)
    process.exit(1)
  })

  slidev.on('close', (code) => {
    process.exit(code ?? 0)
  })
}

function main() {
  const args = process.argv.slice(2)
  const name = args[0]
  const presentations = getPresentations()

  if (!name) {
    console.error('Error: Presentation name is required')
    printUsage(presentations)
    process.exit(1)
  }

  if (!presentations.includes(name)) {
    console.error(`Error: Presentation "${name}" not found`)
    printUsage(presentations)
    process.exit(1)
  }

  const port = getPortForPresentation(name, presentations)
  startDevServer(name, port)
}

main()
