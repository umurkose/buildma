// Pre-flight check, rendered like `pnpm setup`: a live, grouped checklist. Each
// workspace shows its steps (types / build) while it runs, then collapses to a
// single ✓ when they all pass. The endpoints group smoke-tests the live API — if
// the dev server isn't running it boots core + gateway in the background, checks
// them, and tears them down. Nothing is uploaded; each tool's noisy output is
// captured and shown only if that step fails.

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', white: '\x1b[97m',
  gray: '\x1b[90m', green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m',
}
const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

// Each group is one workspace (or the endpoints smoke test); each step runs a
// command (or, for endpoints, checks a URL). status: pending|running|done|fail
const groups = [
  {
    name: 'core',
    steps: [
      { name: 'types', dir: 'core', args: ['tsc', '--noEmit'] },
      { name: 'build', dir: 'core', args: ['wrangler', 'deploy', '--dry-run'] },
    ],
  },
  {
    name: 'gateway',
    steps: [{ name: 'build', dir: 'gateway', args: ['wrangler', 'deploy', '--dry-run'] }],
  },
  {
    name: 'web',
    steps: [
      { name: 'types', dir: 'web', args: ['tsc', '--noEmit'] },
      { name: 'build', dir: 'web', args: ['next', 'build'] },
    ],
  },
  {
    name: 'endpoints',
    endpoints: true,
    steps: [
      { name: 'core · GET /doc', url: 'http://localhost:8788/doc' },
      { name: 'gateway · GET /doc', url: 'http://localhost:8787/doc' },
    ],
  },
]
for (const g of groups) for (const s of g.steps) s.status = 'pending'

const iconFor = (status, dimDone) =>
  status === 'done'
    ? `${C.green}✓${C.reset}`
    : status === 'fail'
      ? `${C.red}✗${C.reset}`
      : status === 'running'
        ? `${C.white}${SPINNER[frame % SPINNER.length]}${C.reset}`
        : `${C.gray}○${C.reset}`

const groupStatus = (g) => {
  const st = g.steps.map((s) => s.status)
  if (st.every((s) => s === 'pending')) return 'pending'
  if (st.every((s) => s === 'done')) return 'done'
  if (st.includes('fail')) return 'fail'
  return 'running'
}

let frame = 0
let rendered = 0

function render() {
  const lines = []
  for (const g of groups) {
    const gs = groupStatus(g)
    // Collapsed while pending or once fully done — expanded only while active/failed.
    if (gs === 'pending' || gs === 'done') {
      const color = gs === 'done' ? C.green : C.gray
      lines.push(`  ${iconFor(gs)}  ${color}${g.name}${C.reset}`)
    } else {
      const color = gs === 'fail' ? `${C.red}${C.bold}` : `${C.white}${C.bold}`
      const note = g.note ? `  ${C.dim}${g.note}${C.reset}` : ''
      lines.push(`  ${iconFor(gs)}  ${color}${g.name}${C.reset}${note}`)
      for (const s of g.steps) {
        const sc = s.status === 'done' ? C.dim : s.status === 'fail' ? C.red : s.status === 'running' ? C.white : C.gray
        lines.push(`       ${iconFor(s.status)}  ${sc}${s.name}${C.reset}`)
      }
    }
  }
  if (rendered) process.stdout.write(`\x1b[${rendered}A`)
  process.stdout.write('\x1b[J') // clear from cursor down, so collapsing shrinks cleanly
  process.stdout.write(lines.join('\n') + '\n')
  rendered = lines.length
}

// --- Build / type-check steps ---

function runStep(step) {
  return new Promise((resolve) => {
    step.status = 'running'
    render()
    const proc = spawn('npx', step.args, { cwd: join(root, step.dir), stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    proc.stdout.on('data', (d) => (out += d))
    proc.stderr.on('data', (d) => (out += d))
    proc.on('exit', (code) => {
      step.status = code === 0 ? 'done' : 'fail'
      step.output = out
      render()
      resolve(code === 0)
    })
    proc.on('error', (err) => {
      step.status = 'fail'
      step.output = String(err)
      render()
      resolve(false)
    })
  })
}

// --- Endpoints: boot the API if needed, check it, tear it down ---

const spawned = []
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function ping(url, ok = (s) => s < 500) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 3000)
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'manual' })
    return ok(res.status)
  } catch {
    return null // unreachable
  } finally {
    clearTimeout(t)
  }
}

function bootWorker(dir) {
  const proc = spawn('pnpm', ['dev'], { cwd: join(root, dir), detached: true, stdio: 'ignore' })
  spawned.push(proc)
}

function killSpawned() {
  for (const p of spawned) {
    try {
      if (p.pid) process.kill(-p.pid, 'SIGKILL')
    } catch {}
  }
  spawned.length = 0
}

async function waitReady(urls, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const up = await Promise.all(urls.map((u) => ping(u)))
    if (up.every((r) => r !== null)) return true
    await sleep(500)
  }
  return false
}

async function runEndpoints(g) {
  const alreadyUp = (await ping('http://localhost:8788/')) !== null
  if (alreadyUp) {
    g.note = 'using running dev'
  } else {
    g.note = 'starting core + gateway…'
    render()
    bootWorker('core')
    bootWorker('gateway')
    const ready = await waitReady(['http://localhost:8788/', 'http://localhost:8787/'], 45000)
    if (!ready) {
      g.note = 'could not start services'
      for (const s of g.steps) s.status = 'fail'
      render()
      return false
    }
    g.note = 'started for the test'
  }

  let ok = true
  for (const step of g.steps) {
    step.status = 'running'
    render()
    const pass = (await ping(step.url, (s) => s === 200)) === true
    step.status = pass ? 'done' : 'fail'
    render()
    if (!pass) ok = false
  }
  return ok
}

// --- Run ---

async function main() {
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
  process.stdout.write(`\n  ${C.cyan}${C.bold}Checking the project${C.reset}\n\n`)
  render()
  const timer = setInterval(() => {
    frame++
    render()
  }, 80)

  let ok = true
  try {
    for (const g of groups) {
      if (g.endpoints) {
        if (!(await runEndpoints(g))) ok = false
      } else {
        for (const step of g.steps) if (!(await runStep(step))) ok = false
      }
    }
  } finally {
    clearInterval(timer)
    killSpawned()
  }
  render()

  // Show captured output for any failed build/type-check step.
  for (const g of groups) {
    for (const s of g.steps) {
      if (s.status === 'fail' && s.output) {
        process.stdout.write(`\n  ${C.red}${C.bold}${g.name} · ${s.name}${C.reset}\n`)
        process.stdout.write(s.output.trim().split('\n').map((l) => `    ${C.dim}${l}${C.reset}`).join('\n') + '\n')
      }
    }
  }

  process.stdout.write(
    ok
      ? `\n  ${C.green}${C.bold}✓ all checks passed${C.reset}\n\n`
      : `\n  ${C.red}${C.bold}✗ some checks failed${C.reset}\n\n`,
  )
  process.exit(ok ? 0 : 1)
}

// Make sure background workers never outlive the check.
for (const sig of ['exit', 'SIGINT', 'SIGTERM']) process.on(sig, killSpawned)

main().catch((err) => {
  killSpawned()
  process.stdout.write(`\n  ${C.red}${C.bold}✗ ${err.message}${C.reset}\n\n`)
  process.exit(1)
})
