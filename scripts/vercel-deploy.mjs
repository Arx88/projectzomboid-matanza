#!/usr/bin/env node
/**
 * Deploy a Vercel vía API (flujo oficial): /v2/files → /v13/deployments.
 * Uso: npm run build && node scripts/vercel-deploy.mjs
 */
import { readFileSync, statSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'

// Usá tu token con: VERCEL_TOKEN=xxxx node scripts/vercel-deploy.mjs
// (nunca hardcodear el token acá — este archivo va a GitHub)
const TOKEN = process.env.VERCEL_TOKEN
const PROJECT = 'projectzomboid-matanza'
const TEAM = 'team_sUref35BpyC5rZ9yo0WF6bhH'
const ROOT = process.cwd()
const API = 'https://api.vercel.com'
const TQ = `teamId=${TEAM}`

async function api(path, opts = {}) {
  const sep0 = path.includes('?') ? '&' : '?'
  const res = await fetch(`${API}${path}${sep0}${TQ}`, {
    ...opts,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(opts.headers || {}) },
  })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 300)}`)
  return json
}

/* 1. recolectar archivos fuente (los que van a la build) */
const SKIP_DIRS = new Set(['.git', 'node_modules', '.freebuff', '.vercel', 'dist'])
const SKIP_FILES = (name) => name.endsWith('.log') || name === '.gitignore' || name.endsWith('.log.err')

const files = []
;(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name))
      continue
    }
    if (SKIP_FILES(entry.name)) continue
    const abs = join(dir, entry.name)
    const rel = relative(ROOT, abs).split(sep).join('/')
    files.push({ abs, rel })
  }
})(ROOT)

/* 2. subir cada archivo a /v2/files con su digest sha1 */
console.log(`Subiendo ${files.length} archivos…`)
for (const f of files) {
  const buf = readFileSync(f.abs)
  const sha = createHash('sha1').update(buf).digest('hex')
  f.sha = sha
  f.size = buf.length
  const res = await fetch(`${API}/v2/files?${TQ}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(buf.length),
      'x-vercel-digest': sha,
    },
    body: buf,
  })
  if (!res.ok && res.status !== 409) {
    throw new Error(`upload ${f.rel}: ${res.status} ${await res.text()}`)
  }
  process.stdout.write(`  ✓ ${f.rel}\n`)
}

/* 3. crear deployment de producción */
const deploy = await api('/v13/deployments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: PROJECT,
    project: PROJECT,
    target: 'production',
    files: files.map(({ rel, sha, size }) => ({ file: rel, sha, size })),
    projectSettings: { framework: 'vite', buildCommand: 'npm run build', outputDirectory: 'dist', installCommand: 'npm install' },
  }),
})
console.log(`\nDeployment: ${deploy.id} → https://${deploy.url}`)

/* 4. esperar a que esté READY */
console.log('Compilando en Vercel…')
let ready = null
for (let i = 0; i < 80; i++) {
  await new Promise((r) => setTimeout(r, 3000))
  const d = await api(`/v13/deployments/${deploy.id}`)
  if (d.readyState === 'READY') { ready = d; break }
  if (d.readyState === 'ERROR' || d.readyState === 'CANCELED') {
    throw new Error(`Deployment ${d.readyState}: ${(d.errorMessage || '')} ${(d.builds || []).map(b => b.status).join(',')} ${JSON.stringify(d.logs || '').slice(0, 600)}`)
  }
  process.stdout.write(`  [${i * 3}s] ${d.readyState} (${d.readyState === 'BUILDING' ? 'build' : 'upload'})\n`)
}
if (!ready) throw new Error('Timeout: el deployment no terminó')

/* 5. alias de producción */
const prodDomain = `${PROJECT}.vercel.app`
try {
  await api(`/v2/deployments/${deploy.id}/aliases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  console.log(`Alias aplicado → ${prodDomain}`)
} catch (e) {
  console.log(`Alias explícito no disponible (${String(e).slice(0, 100)}) — Vercel asigna el dominio al primer deploy prod.`)
}

console.log('\n✅ DEPLOY LISTO')
console.log(`   Deployment:  https://${deploy.url}`)
console.log(`   Producción:  https://${prodDomain}`)
