#!/usr/bin/env node

import { existsSync, readdirSync, statSync, mkdirSync, cpSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const presentationsDir = join(rootDir, 'presentations')
const distDir = join(rootDir, 'dist')

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

function buildPresentation(name) {
  return new Promise((resolve, reject) => {
    const presentationDir = join(presentationsDir, name)
    const presentationDistDir = join(presentationDir, 'dist')
    const outputDir = join(distDir, name)

    console.log(`\n  Building: ${name}`)

    const slidev = spawn('npx', ['slidev', 'build'], {
      cwd: presentationDir,
      stdio: 'pipe',
      shell: true
    })

    slidev.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach((line) => {
        console.log(`    [${name}] ${line}`)
      })
    })

    slidev.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean)
      lines.forEach((line) => {
        console.error(`    [${name}] ${line}`)
      })
    })

    slidev.on('error', (err) => {
      reject(new Error(`Failed to build ${name}: ${err.message}`))
    })

    slidev.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Build failed for ${name} with exit code ${code}`))
        return
      }

      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true })
      }

      if (existsSync(outputDir)) {
        rmSync(outputDir, { recursive: true })
      }

      cpSync(presentationDistDir, outputDir, { recursive: true })

      console.log(`  Completed: ${name} -> dist/${name}/`)
      resolve()
    })
  })
}

async function main() {
  const presentations = getPresentations()

  if (presentations.length === 0) {
    console.error('No presentations found in presentations/ directory')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('  Building all presentations')
  console.log('='.repeat(60))
  console.log(`\n  Found ${presentations.length} presentation(s): ${presentations.join(', ')}`)

  const failed = []
  const succeeded = []

  for (const name of presentations) {
    try {
      await buildPresentation(name)
      succeeded.push(name)
    } catch (err) {
      console.error(`\n  Error: ${err.message}`)
      failed.push(name)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('  Build Summary')
  console.log('='.repeat(60))
  console.log(`\n  Succeeded: ${succeeded.length}`)
  succeeded.forEach((name) => console.log(`    - ${name} -> dist/${name}/`))

  if (failed.length > 0) {
    console.log(`\n  Failed: ${failed.length}`)
    failed.forEach((name) => console.log(`    - ${name}`))
    console.log('')
    process.exit(1)
  }

  console.log('\n  All presentations built successfully!\n')
  process.exit(0)
}

main()
