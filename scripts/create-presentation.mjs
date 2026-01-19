#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const presentationsDir = join(rootDir, 'presentations')
const templatesDir = join(__dirname, 'templates')

const TEMPLATES = ['blank', 'default']

function parseArgs(args) {
  const result = { name: null, template: null }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--template=')) {
      result.template = arg.split('=')[1]
    } else if (arg === '--template' && args[i + 1]) {
      result.template = args[++i]
    } else if (!arg.startsWith('-') && !result.name) {
      result.name = arg
    }
  }

  return result
}

async function promptTemplate() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    console.log('\nAvailable templates:')
    console.log('  1. blank   - Minimal presentation with a single slide')
    console.log('  2. default - Presentation with sample slides demonstrating features\n')

    rl.question('Select template (1-2) or name [default]: ', (answer) => {
      rl.close()
      const trimmed = answer.trim().toLowerCase()

      if (trimmed === '1' || trimmed === 'blank') {
        resolve('blank')
      } else if (trimmed === '2' || trimmed === 'default' || trimmed === '') {
        resolve('default')
      } else {
        console.error(`Unknown template: ${trimmed}`)
        process.exit(1)
      }
    })
  })
}

function validateName(name) {
  if (!name) {
    console.error('Error: Presentation name is required')
    console.error('Usage: pnpm create:presentation <name> [--template=blank|default]')
    process.exit(1)
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    console.error('Error: Presentation name must contain only lowercase letters, numbers, and hyphens')
    process.exit(1)
  }

  const targetDir = join(presentationsDir, name)
  if (existsSync(targetDir)) {
    console.error(`Error: Presentation "${name}" already exists at ${targetDir}`)
    process.exit(1)
  }

  return name
}

function validateTemplate(template) {
  if (!TEMPLATES.includes(template)) {
    console.error(`Error: Unknown template "${template}"`)
    console.error(`Available templates: ${TEMPLATES.join(', ')}`)
    process.exit(1)
  }
  return template
}

function createPresentation(name, template) {
  const targetDir = join(presentationsDir, name)
  const templateDir = join(templatesDir, template)

  console.log(`\nCreating presentation "${name}" with "${template}" template...`)

  mkdirSync(targetDir, { recursive: true })

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
      '@slidev/cli': '^52.11.3',
      '@slidev/theme-default': 'latest',
      '@slidev/theme-seriph': 'latest',
      '@supaslidev/shared': 'workspace:*',
      vue: '^3.5.26'
    },
    devDependencies: {
      '@vue/compiler-sfc': '^3.5.27'
    }
  }

  writeFileSync(
    join(targetDir, 'package.json'),
    JSON.stringify(packageJson, null, 2) + '\n'
  )

  const slidesTemplate = readFileSync(join(templateDir, 'slides.md'), 'utf-8')
  const slides = slidesTemplate.replace(/\{\{name\}\}/g, name)
  writeFileSync(join(targetDir, 'slides.md'), slides)

  console.log(`\nPresentation created at: presentations/${name}/`)
  console.log('\nNext steps:')
  console.log('  1. Run: pnpm install')
  console.log(`  2. Run: pnpm --filter @supaslidev/${name} dev`)
  console.log('\nOr run all presentations with: pnpm dev')
}

async function main() {
  const args = process.argv.slice(2)
  const { name, template: templateArg } = parseArgs(args)

  const validName = validateName(name)

  let template = templateArg
  if (!template) {
    template = await promptTemplate()
  }

  const validTemplate = validateTemplate(template)

  createPresentation(validName, validTemplate)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
