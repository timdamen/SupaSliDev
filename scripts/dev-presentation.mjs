#!/usr/bin/env node

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const presentationsDir = join(rootDir, 'presentations')

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

function printUsage(presentations) {
  console.error('Usage: pnpm dev <presentation-name>')
  console.error('\nAvailable presentations:')

  if (presentations.length === 0) {
    console.error('  No presentations found')
  } else {
    presentations.forEach((name) => {
      console.error(`  ${name}`)
    })
  }
}

function runDev(name) {
  const packageName = `@supaslidev/${name}`

  console.log(`\nStarting dev server for ${name}...\n`)

  const pnpm = spawn('pnpm', ['--filter', packageName, 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  })

  pnpm.on('error', (err) => {
    console.error(`Failed to start dev server: ${err.message}`)
    process.exit(1)
  })

  pnpm.on('close', (code) => {
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

  runDev(name)
}

main()
