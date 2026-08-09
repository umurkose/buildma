// Setup orchestrator: wipes and reinstalls node_modules for every workspace,
// one at a time. Renders a live checklist — pending services are dim/gray, the
// one installing is white with a spinner, finished ones turn into a green ✓.

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { rm } from 'node:fs/promises'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', white: '\x1b[97m',
  gray: '\x1b[90m', green: '\x1b[32m', cyan: '\x1b[36m',
}

const services = [
  { name: 'web',      dir: 'web',     cmd: 'npm',  args: ['install'] },
  { name: 'core',     dir: 'core',    cmd: 'pnpm', args: ['install'] },
  { name: 'gateway',  dir: 'gateway', cmd: 'pnpm', args: ['install'] },
  // After deps: generate (no-op if unchanged) + apply migrations to local D1.
  { name: 'database', dir: 'core',    db: true },
]

const width = Math.max(...services.map((s) => s.name.length))
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

// status: 'pending' | 'installing' | 'done'
for (const s of services) s.status = 'pending'

let frame = 0
let rendered = 0

function render() {
  const lines = []
  for (const s of services) {
    let icon, color
    if (s.status === 'done') {
      icon = `${C.green}✓${C.reset}`
      color = C.green
    } else if (s.status === 'installing') {
      icon = `${C.white}${SPINNER[frame % SPINNER.length]}${C.reset}`
      color = `${C.white}${C.bold}`
    } else {
      icon = `${C.gray}○${C.reset}`
      color = C.gray
    }
    lines.push(`  ${icon}  ${color}${s.name.padEnd(width)}${C.reset}`)
  }
  // Move cursor back up over the previously drawn block, then repaint.
  if (rendered) process.stdout.write(`\x1b[${rendered}A`)
  process.stdout.write(lines.map((l) => l + '\x1b[K').join('\n') + '\n')
  rendered = lines.length
}

function step(dir, cmd, args, name) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      cwd: join(root, dir),
      stdio: ['ignore', 'ignore', 'ignore'], // keep the checklist clean
    })
    proc.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${name} failed (exit ${code})`)),
    )
    proc.on('error', reject)
  })
}

async function run(s) {
  s.status = 'installing'
  render()
  if (s.db) {
    // `db migrate` = generate + apply + seed. wrangler's migrate prompt
    // auto-answers "yes" with no TTY (stdio ignored).
    await step(s.dir, 'node', [join(root, 'script', 'db.mjs'), 'migrate'], s.name)
  } else {
    await rm(join(root, s.dir, 'node_modules'), { recursive: true, force: true })
    await step(s.dir, s.cmd, s.args, s.name)
  }
  s.status = 'done'
  render()
}

async function main() {
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H') // reset terminal + scrollback
  process.stdout.write(`\n  ${C.cyan}${C.bold}Setting up the project${C.reset}\n\n`)
  render()

  // Animate the spinner while installs run.
  const timer = setInterval(() => {
    frame++
    render()
  }, 80)

  try {
    for (const s of services) await run(s) // one at a time, in order
  } finally {
    clearInterval(timer)
  }

  render()
  process.stdout.write(
    `\n  ${C.green}${C.bold}✓ ready${C.reset}  ${C.dim}— run ${C.reset}${C.bold}pnpm dev${C.reset}\n\n`,
  )
}

main().catch((err) => {
  process.stdout.write(`\n  ${C.bold}\x1b[31m✗ ${err.message}${C.reset}\n\n`)
  process.exit(1)
})
