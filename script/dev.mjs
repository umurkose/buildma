// Dev orchestrator: boots core, gateway and web together. Stays quiet during
// startup and prints a clean host banner once everything is ready; runtime logs
// stream afterwards. Press `r` to reload all, Ctrl+C to stop. Cleans up the whole
// process tree (incl. workerd) on exit, so no orphans linger.

import { spawn, execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { networkInterfaces } from 'node:os'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const PORTS = [8788, 8787, 3000]

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m', white: '\x1b[97m',
  yellow: '\x1b[33m', magenta: '\x1b[35m', cyan: '\x1b[36m', green: '\x1b[32m', blue: '\x1b[94m',
}

// Wrangler lifecycle/binding chatter — reprinted on every service-binding
// (re)connect and not useful to a user. Runtime request logs and errors are kept.
const NOISE =
  /Connection status updated|Your Worker has access to|^\s*Binding\s+Resource|^\s*env\.\S+ \(|Service bindings, Durable Object|Starting local server|wrangler \d+\.\d+|^\s*─+\s*$|⛅/

// LAN IPv4 (e.g. 192.168.0.15) so the web app is reachable from a phone on the
// same wifi — `next dev` binds to 0.0.0.0, so its LAN URL works.
function lanIP() {
  for (const iface of Object.values(networkInterfaces())) {
    for (const net of iface ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address
    }
  }
  return null
}

const services = [
  { name: 'core',    color: C.yellow,  dir: 'core',    cmd: 'pnpm', args: ['dev'],        port: 8788, url: 'http://localhost:8788', readyRe: /Ready on/, docs: '/docs' },
  { name: 'gateway', color: C.magenta, dir: 'gateway', cmd: 'pnpm', args: ['dev'],        port: 8787, url: 'http://localhost:8787', readyRe: /Ready on/ },
  { name: 'web',     color: C.cyan,    dir: 'web',     cmd: 'npm',  args: ['run', 'dev'], port: 3000, url: 'http://localhost:3000', readyRe: /Ready in/, lan: true },
]

const width = Math.max(...services.map((s) => s.name.length))
const tag = (s) => `${s.color}${s.name.padEnd(width)}${C.reset} ${C.dim}│${C.reset} `

let bannerShown = false
let restarting = false
let stopping = false

// Color depth → FORCE_COLOR, so child tools keep their native colors through the pipe.
const colorDepth = process.stdout.isTTY ? process.stdout.getColorDepth() : 4
const FORCE_COLOR = colorDepth >= 24 ? '3' : colorDepth >= 8 ? '2' : '1'

function showBanner() {
  if (bannerShown || !services.every((s) => s.ready)) return
  bannerShown = true
  for (const s of services) s.boot = [] // drop buffered startup noise
  const ip = lanIP()
  const row = (name, color, url) =>
    `  ${color}${C.bold}${name.padEnd(width)}${C.reset}  ${C.dim}→${C.reset}  ${C.bold}${C.white}${url}${C.reset}`
  const rows = []
  for (const s of services) {
    rows.push(row(s.name, s.color, s.url))
    if (s.docs) rows.push(row('swagger', C.green, s.url + s.docs))
    if (s.lan && ip) rows.push(row('mobile', C.blue, `http://${ip}:${s.port}`))
  }
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H') // clear screen + scrollback
  process.stdout.write(
    [
      '',
      `  ${C.green}${C.bold}✓ all services ready${C.reset}`,
      '',
      ...rows,
      '',
      `  ${C.dim}${C.bold}r${C.reset}${C.dim} reload   ·   ${C.bold}Ctrl+C${C.reset}${C.dim} stop${C.reset}`,
      '',
      '',
    ].join('\n'),
  )
}

function pipe(s, stream) {
  let buf = ''
  stream.on('data', (chunk) => {
    buf += chunk
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) {
      if (!s.ready && s.readyRe.test(line)) {
        s.ready = true
        showBanner()
      }
      if (NOISE.test(line)) continue // drop wrangler lifecycle/binding chatter
      if (bannerShown) process.stdout.write(tag(s) + line + '\n')
      else s.boot.push(line) // quiet during startup; kept for crash diagnostics
    }
  })
}

const portsInUse = () =>
  PORTS.filter((port) => {
    try {
      return (
        execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .toString()
          .trim() !== ''
      )
    } catch {
      return false
    }
  })

// Kill whatever is listening on our ports (e.g. an orphaned workerd from a
// previous dirty exit) so startup never hits "address already in use".
function freePorts() {
  for (const port of PORTS) {
    try {
      const pids = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim()
      for (const pid of pids.split('\n').filter(Boolean)) {
        try {
          process.kill(Number(pid), 'SIGKILL')
        } catch {}
      }
    } catch {}
  }
}

function startService(s) {
  s.ready = false
  s.boot = []
  s.proc = spawn(s.cmd, s.args, {
    cwd: join(root, s.dir),
    env: { ...process.env, FORCE_COLOR, npm_config_color: 'always' },
    detached: true, // new process group → clean tree kill
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  pipe(s, s.proc.stdout)
  pipe(s, s.proc.stderr)
  s.proc.on('exit', (code) => {
    if (stopping || restarting) return
    // Crashed before the banner? Surface its buffered output so errors aren't hidden.
    if (!bannerShown) for (const line of s.boot) process.stdout.write(tag(s) + line + '\n')
    process.stdout.write(tag(s) + `${C.dim}exited (code ${code})${C.reset}\n`)
  })
}

function killAll(signal) {
  for (const s of services) {
    try {
      if (s.proc?.pid) process.kill(-s.proc.pid, signal)
    } catch {}
  }
}

// Spawn only once the ports are actually free — killing is async at the OS level,
// so we poll (with a settle delay) to avoid "address already in use" on reload.
function startWhenFree(attempt = 0) {
  freePorts()
  setTimeout(() => {
    if (portsInUse().length && attempt < 40) {
      startWhenFree(attempt + 1)
      return
    }
    bannerShown = false
    for (const s of services) startService(s)
    restarting = false
  }, 250)
}

function restartAll() {
  if (restarting || stopping) return
  restarting = true
  process.stdout.write('\x1b[2J\x1b[3J\x1b[H')
  process.stdout.write(`  ${C.dim}↻ reloading…${C.reset}\n`)
  killAll('SIGKILL')
  setTimeout(() => startWhenFree(), 200)
}


function shutdown() {
  if (stopping) return
  stopping = true
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false)
    } catch {}
  }
  killAll('SIGTERM')
  setTimeout(() => {
    killAll('SIGKILL') // escalate for anything ignoring SIGTERM
    freePorts() // reap any reparented straggler still holding a port
    process.exit(0)
  }, 400)
}

// --- launch ---
process.stdout.write(`  ${C.dim}starting core, gateway, web…${C.reset}\n`)
startWhenFree()

// Fallback: if the banner never appears (a service hangs without crashing), start
// streaming after 25s so the terminal isn't stuck on "starting…".
setTimeout(() => {
  if (bannerShown) return
  for (const s of services) {
    for (const line of s.boot) process.stdout.write(tag(s) + line + '\n')
    s.boot = []
  }
  bannerShown = true
}, 25000).unref()

// Keyboard: r = reload, Ctrl+C = stop.
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (key) => {
    if (key === 'r' || key === 'R') restartAll()
    else if (key === '') {
      process.stdout.write('\n')
      shutdown()
    }
  })
}

process.on('SIGINT', () => {
  process.stdout.write('\n')
  shutdown()
})
process.on('SIGTERM', shutdown)
process.on('SIGUSR2', restartAll) // reload via `kill -USR2 <pid>` (same as pressing r)
process.on('exit', () => killAll('SIGTERM'))
