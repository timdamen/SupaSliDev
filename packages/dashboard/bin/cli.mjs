#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageRoot = join(__dirname, '..')

function findProjectRoot() {
  let dir = process.cwd()

  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'presentations')) && existsSync(join(dir, 'package.json'))) {
      return dir
    }
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      return dir
    }
    dir = dirname(dir)
  }

  if (existsSync(join(process.cwd(), 'presentations'))) {
    return process.cwd()
  }

  return null
}

function main() {
  const projectRoot = findProjectRoot()

  if (!projectRoot) {
    console.error('Error: Could not find a supaSliDev project.')
    console.error('Make sure you are in a directory with a "presentations" folder.')
    process.exit(1)
  }

  const presentationsDir = join(projectRoot, 'presentations')

  if (!existsSync(presentationsDir)) {
    console.error(`Error: No "presentations" folder found at ${presentationsDir}`)
    process.exit(1)
  }

  console.log(`Starting dashboard for project: ${projectRoot}`)
  console.log(`Presentations directory: ${presentationsDir}`)

  process.env.SUPASLIDEV_PROJECT_ROOT = projectRoot
  process.env.SUPASLIDEV_PRESENTATIONS_DIR = presentationsDir

  const generateScript = join(packageRoot, 'scripts', 'generate-presentations.mjs')
  const apiServer = join(packageRoot, 'server', 'api.js')

  const generate = spawn('node', [generateScript], {
    stdio: 'inherit',
    env: process.env
  })

  generate.on('close', (code) => {
    if (code !== 0) {
      console.error('Failed to generate presentations data')
      process.exit(1)
    }

    const api = spawn('node', [apiServer], {
      stdio: 'inherit',
      env: process.env,
      detached: false
    })

    const vite = spawn('npx', ['vite', '--config', join(packageRoot, 'vite.config.ts')], {
      cwd: packageRoot,
      stdio: 'inherit',
      env: process.env,
      shell: true
    })

    process.on('SIGINT', () => {
      api.kill('SIGTERM')
      vite.kill('SIGTERM')
      process.exit(0)
    })

    process.on('SIGTERM', () => {
      api.kill('SIGTERM')
      vite.kill('SIGTERM')
      process.exit(0)
    })
  })
}

main()
