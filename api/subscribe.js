/**
 * POST /api/subscribe  { email }
 *
 * Guarda el email en data/subscribers.json del repo de GitHub (el repo actúa de DB).
 * Variables de entorno (configuradas en Vercel):
 *   GH_TOKEN    — token de GitHub con permiso contents:write sobre el repo
 *   GH_REPO     — "usuario/repo" (ej: Arx88/projectzomboid-matanza)
 *   DATA_BRANCH — rama (ej: main)
 *   DATA_PATH   — ruta del archivo (ej: data/subscribers.json)
 */
import { createHmac } from 'node:crypto'

const GH_TOKEN = process.env.GH_TOKEN
const GH_REPO = process.env.GH_REPO || 'Arx88/projectzomboid-matanza'
const BRANCH = process.env.DATA_BRANCH || 'main'
const DATA_PATH = process.env.DATA_PATH || 'data/subscribers.json'

const json = (res, status, body) => {
  res.status = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

// commit firma anti-abuso: si Vercel no la inyecta, al menos validamos origen básico
function sha256(s) {
  return createHmac('sha256', GH_TOKEN || 'lm').update(s).digest('hex')
}

const cleanEmail = (raw) => {
  const email = String(raw || '').trim().toLowerCase()
  if (email.length > 254) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null
}

async function gh(path, opts = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'la-matanza-landing',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  return { status: res.status, ok: res.ok, data }
}

async function readSubscribers() {
  const r = await gh(`/repos/${GH_REPO}/contents/${DATA_PATH}?ref=${BRANCH}`)
  if (r.status === 404) return { list: [], sha: null }
  if (!r.ok) throw new Error(`GitHub read ${r.status}`)
  const list = JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8'))
  return { list, sha: r.data.sha }
}

// Vercel puede entregar req.body como objeto, string, o nada (stream) — cubrir los 3 casos
function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'string') {
      try { return JSON.parse(req.body) } catch { return null }
    }
    return req.body
  }
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')) } catch { resolve(null) }
    })
    req.on('error', () => resolve(null))
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'method' })
  if (!GH_TOKEN) return json(res, 500, { error: 'server_not_configured' })

  const body = await parseBody(req)
  if (!body) return json(res, 400, { error: 'bad_json' })

  const email = cleanEmail(body.email)
  if (!email) return json(res, 400, { error: 'invalid_email' })
  if (body.website) return json(res, 200, { ok: true }) // honeypot: éxito falso

  let entry
  let currentSha
  try {
    const { list, sha } = await readSubscribers()
    currentSha = sha

    // idempotente: si ya existe, no duplicamos
    if (list.some((s) => s.email === email)) {
      const known = list.find((s) => s.email === email)
      return json(res, 200, { ok: true, already: true, subscribedAt: known?.ts })
    }

    entry = {
      email,
      ts: new Date().toISOString(),
      ip: sha256(String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '')).slice(0, 12),
    }
    const next = [...list, entry].slice(-5000) // tope duro de seguridad

    const payload = {
      message: `subscribe: ${email}`,
      content: Buffer.from(JSON.stringify(next, null, 2)).toString('base64'),
      branch: BRANCH,
      ...(currentSha ? { sha: currentSha } : {}),
    }
    const put = await gh(`/repos/${GH_REPO}/contents/${DATA_PATH}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    if (!put.ok) throw new Error(`GitHub write ${put.status}: ${JSON.stringify(put.data).slice(0, 200)}`)
  } catch (e) {
    return json(res, 500, { error: 'storage_failed' })
  }

  return json(res, 200, { ok: true })
}
