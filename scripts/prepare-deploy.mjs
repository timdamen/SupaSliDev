#!/usr/bin/env node

import { existsSync, readdirSync, statSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const presentationsDir = join(rootDir, 'presentations')
const deployDir = join(rootDir, 'deploy')

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
  console.error('Usage: pnpm prepare:deploy <presentation-name>')
  console.error('\nAvailable presentations:')

  if (presentations.length === 0) {
    console.error('  No presentations found')
  } else {
    presentations.forEach((name) => {
      console.error(`  ${name}`)
    })
  }
}

function createVercelConfig() {
  return JSON.stringify({
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    rewrites: [
      { source: '/(.*)', destination: '/index.html' }
    ]
  }, null, 2) + '\n'
}

function createNetlifyConfig() {
  return `[build]
publish = "dist"
command = "npm run build"

[build.environment]
NODE_VERSION = "20"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
`
}

function createPackageJson(name) {
  return JSON.stringify({
    name: `${name}-deploy`,
    version: '1.0.0',
    private: true,
    scripts: {
      build: 'echo "Already built - static files ready in dist/"',
      start: 'npx serve dist'
    }
  }, null, 2) + '\n'
}

function prepareDeployment(name) {
  const presentationDir = join(presentationsDir, name)
  const presentationDistDir = join(presentationDir, 'dist')
  const outputDir = join(deployDir, name)
  const outputDistDir = join(outputDir, 'dist')

  console.log('\n' + '='.repeat(50))
  console.log(`  Preparing deployment: ${name}`)
  console.log('='.repeat(50) + '\n')

  console.log('Step 1/3: Building presentation...')

  const slidev = spawn('npx', ['slidev', 'build'], {
    cwd: presentationDir,
    stdio: 'inherit',
    shell: true
  })

  slidev.on('error', (err) => {
    console.error(`Failed to build presentation: ${err.message}`)
    process.exit(1)
  })

  slidev.on('close', (code) => {
    if (code !== 0) {
      console.error(`\nBuild failed with exit code ${code}`)
      process.exit(code ?? 1)
    }

    console.log('\nStep 2/3: Creating deploy package...')

    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true })
    }
    mkdirSync(outputDir, { recursive: true })

    cpSync(presentationDistDir, outputDistDir, { recursive: true })

    console.log('Step 3/3: Adding deployment configurations...')

    writeFileSync(join(outputDir, 'vercel.json'), createVercelConfig())
    writeFileSync(join(outputDir, 'netlify.toml'), createNetlifyConfig())
    writeFileSync(join(outputDir, 'package.json'), createPackageJson(name))

    console.log('\n' + '='.repeat(50))
    console.log('  Deployment package ready!')
    console.log('='.repeat(50))
    console.log(`\n  Output: deploy/${name}/`)
    console.log('\n  Deploy with Vercel:')
    console.log(`    cd deploy/${name} && vercel`)
    console.log('\n  Deploy with Netlify:')
    console.log(`    cd deploy/${name} && netlify deploy --prod`)
    console.log('\n  Or push to Git and import in Vercel/Netlify dashboard.')
    console.log('')

    process.exit(0)
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

  prepareDeployment(name)
}

main()
