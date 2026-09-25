#!/usr/bin/env node
/**
 * Envía el mail "1 hora antes" a todos los suscriptores vía Brevo.
 * Corre desde GitHub Actions (cron 1h antes de la apertura) o a mano.
 *
 * Env:
 *   BREVO_API_KEY  — api key de Brevo (secret del repo)
 *   GH_TOKEN       — token con contents:write (GITHUB_TOKEN sirve)
 *   GH_REPO        — usuario/repo
 *   SENDER_EMAIL   — remitente verificado en Brevo
 *   SENDER_NAME    — nombre del remitente (default: LA MATANZA)
 *   DRY_RUN        — "1" para probar sin enviar ni escribir el marker
 */
import { readFileSync } from 'node:fs'

const TOKEN = process.env.GH_TOKEN
const REPO = process.env.GH_REPO
const BRANCH = 'main'
const DATA_PATH = 'data/subscribers.json'
const MARKER_PATH = 'data/.announcement-sent.json'
const SITE = 'https://projectzomboid-matanza.vercel.app'

const API = 'https://api.github.com'
const gh = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'la-matanza-bot',
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  return { status: res.status, ok: res.ok, data }
}

const putFile = async (path, obj, message, sha) => {
  const r = await gh(`/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(obj, null, 2)).toString('base64'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  })
  if (!r.ok) throw new Error(`put ${path}: ${r.status} ${JSON.stringify(r.data).slice(0, 200)}`)
  return r.data
}

const getFile = async (path) => {
  const r = await gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}`)
  if (r.status === 404) return { data: null, sha: null }
  if (!r.ok) throw new Error(`get ${path}: ${r.status}`)
  return { data: JSON.parse(Buffer.from(r.data.content, 'base64').toString('utf8')), sha: r.data.sha }
}

/* ------------------------------- mail ------------------------------- */

const buildHtml = () => `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#0a0908;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0908;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding-bottom:22px;">
          <img src="${SITE}/logo.png" alt="LA MATANZA" width="320" style="display:block;max-width:320px;width:100%;height:auto;">
        </td></tr>
        <tr><td style="background:#16120f;border:1px solid #2a241d;border-radius:14px;padding:34px 30px;text-align:center;">
          <p style="margin:0 0 14px;color:#f0a03c;font-size:13px;letter-spacing:4px;text-transform:uppercase;">Falta 1 hora</p>
          <h1 style="margin:0 0 16px;color:#f2e6c9;font-size:28px;letter-spacing:1px;text-transform:uppercase;">¡El servidor abre!</h1>
          <p style="margin:0 0 22px;color:#b9ab8f;font-size:15px;line-height:1.6;">
            LA MATANZA abre sus puertas a las <strong style="color:#f2e6c9;">23:00 hs</strong> (Argentina).<br>
            Prepará tu equipo, revisá tus mods y entrá temprano para asegurar tu lugar.
          </p>
          <a href="${SITE}" style="display:inline-block;background:#c1121f;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 34px;border-radius:12px;">Ver el sitio</a>
          <p style="margin:22px 0 0;color:#8a7f6b;font-size:12px;line-height:1.6;">
            Comunidad, caos y supervivencia.<br>
            Recibís este mail porque te inscribiste en ${SITE}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

const buildText = () =>
  `FALTA 1 HORA — ¡LA MATANZA ABRE!\n\n` +
  `El servidor abre hoy a las 23:00 hs (Argentina).\n` +
  `Prepará tu equipo y entrá temprano.\n\n` +
  `${SITE}\n`

async function sendWithBrevo(recipients, apiKey, sender) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender,
      to: recipients,
      subject: '⏰ Falta 1 hora: LA MATANZA abre a las 23:00',
      htmlContent: buildHtml(),
      textContent: buildText(),
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${text.slice(0, 300)}`)
  return JSON.parse(text || '{}')
}

/* ------------------------------- main ------------------------------- */

const main = async () => {
  const DRY = process.env.DRY_RUN === '1'
  if (!TOKEN || !REPO) throw new Error('Faltan GH_TOKEN / GH_REPO')

  // marker anti-duplicado
  const marker = await getFile(MARKER_PATH)
  if (marker.data?.sent && !DRY) {
    console.log(`Aviso ya enviado el ${marker.data.sent} (${marker.data.count} destinos). Nada que hacer.`)
    return
  }

  const subs = await getFile(DATA_PATH)
  const list = subs.data || []
  if (!list.length) {
    console.log('No hay suscriptores; nada que enviar.')
    return
  }
  const recipients = list.map((s) => ({ email: s.email }))
  console.log(`Suscriptores: ${recipients.length}`)

  if (DRY) {
    console.log('DRY_RUN=1 → no se envía. Destinatarios que irían:')
    for (const r of recipients) console.log(`  - ${r.email}`)
    return
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('Falta BREVO_API_KEY')
  const sender = {
    email: process.env.SENDER_EMAIL || 'juampi.valastro88@gmail.com',
    name: process.env.SENDER_NAME || 'LA MATANZA',
  }

  // Brevo permite hasta 50 destinatarios por llamada; mandamos por tandas
  const batches = []
  for (let i = 0; i < recipients.length; i += 50) batches.push(recipients.slice(i, i + 50))

  let sent = 0
  for (const [i, batch] of batches.entries()) {
    const out = await sendWithBrevo(batch, apiKey, sender)
    sent += batch.length
    console.log(`  tanda ${i + 1}/${batches.length}: OK messageId=${out.messageId || '?'}`)
  }

  await putFile(
    MARKER_PATH,
    { sent: new Date().toISOString(), count: sent, batches: batches.length },
    'chore: marker de aviso enviado',
  )
  console.log(`✅ Enviado a ${sent} destinatarios. Marker guardado.`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
