#!/usr/bin/env node

import { existsSync, readdirSync, statSync, mkdirSync } from 'node:fs'
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

function printUsage(presentations) {
  console.error('Usage: pnpm export:pdf <presentation-name>')
  console.error('\nAvailable presentations:')

  if (presentations.length === 0) {
    console.error('  No presentations found')
  } else {
    presentations.forEach((name) => {
      console.error(`  ${name}`)
    })
  }
}

function exportPdf(name) {
  const presentationDir = join(presentationsDir, name)
  const outputPath = join(distDir, `${name}.pdf`)

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true })
  }

  console.log('\n' + '='.repeat(50))
  console.log(`  Exporting PDF: ${name}`)
  console.log(`  Output: dist/${name}.pdf`)
  console.log('='.repeat(50) + '\n')

  const slidev = spawn('npx', ['slidev', 'export', '--output', outputPath], {
    cwd: presentationDir,
    stdio: 'inherit',
    shell: true
  })

  slidev.on('error', (err) => {
    console.error(`Failed to export presentation: ${err.message}`)
    process.exit(1)
  })

  slidev.on('close', (code) => {
    if (code !== 0) {
      console.error(`\nExport failed with exit code ${code}`)
      process.exit(code ?? 1)
    }

    console.log('\n' + '='.repeat(50))
    console.log(`  Export complete!`)
    console.log(`  Output: dist/${name}.pdf`)
    console.log('='.repeat(50) + '\n')

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

  exportPdf(name)
}

main()
