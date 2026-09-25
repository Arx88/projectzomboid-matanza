// Motor de audio minimalista — todo sintetizado con Web Audio API, sin archivos.
// - tick()      : tic-tac sutil del reloj (alterna dos tonos)
// - hover()     : blip cortito al pasar el mouse
// - click()     : "thock" grave al presionar
// - música      : drone ambiental + melodía esparcida en La menor, estilo PZ

// v2: la clave vieja guardaba '0' de cuando el default era apagado — la ignoramos
const STORE_KEY = 'lamatanza-sound-v2'

let ctx = null
let master = null
let sfxBus = null
let musicBus = null
let wet = null
let noiseBuf = null
let droneStarted = false
let melodyTimer = 0
let tickAlt = false
let lastHover = 0
let enabled = false
const listeners = new Set()

const notify = () => listeners.forEach((fn) => fn(enabled))

function ensureCtx() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume()
    return true
  }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()

  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)

  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.9
  sfxBus.connect(master)

  musicBus = ctx.createGain()
  musicBus.gain.value = 0
  musicBus.connect(master)

  // "reverb" barata: delay con feedback filtrado, para la música
  const delay = ctx.createDelay(1)
  delay.delayTime.value = 0.42
  const fbFilter = ctx.createBiquadFilter()
  fbFilter.type = 'lowpass'
  fbFilter.frequency.value = 1600
  const fb = ctx.createGain()
  fb.gain.value = 0.38
  delay.connect(fbFilter)
  fbFilter.connect(fb)
  fb.connect(delay)
  wet = ctx.createGain()
  wet.gain.value = 0.35
  wet.connect(delay)
  delay.connect(musicBus)

  // buffer de ruido para los clicks
  noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.2), ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1

  return true
}

/* ------------------------------ música ------------------------------ */

function startDrone() {
  if (droneStarted) return
  droneStarted = true

  const mk = (freq, type, g, lp) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    const fl = ctx.createBiquadFilter()
    fl.type = 'lowpass'
    fl.frequency.value = lp
    const gn = ctx.createGain()
    gn.gain.value = g
    o.connect(fl)
    fl.connect(gn)
    gn.connect(musicBus)
    o.start()
    return gn
  }

  const droneLow = mk(55, 'sine', 0.05, 260) // A1
  mk(55.4, 'sine', 0.04, 240) // desafinación leve = movimiento
  mk(82.41, 'triangle', 0.02, 420) // E2
  mk(220, 'sine', 0.012, 900) // A3, brillo mínimo

  // respiración lentísima del drone grave
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoG = ctx.createGain()
  lfoG.gain.value = 0.02
  lfo.connect(lfoG)
  lfoG.connect(droneLow.gain)
  lfo.start()
}

// La menor natural, registro medio: melancólico y esparcido
const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25]

function note(freq, t) {
  const o = ctx.createOscillator()
  o.type = 'triangle'
  o.frequency.value = freq
  const fl = ctx.createBiquadFilter()
  fl.type = 'lowpass'
  fl.frequency.value = 1400
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.055, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6)
  o.connect(fl)
  fl.connect(g)
  g.connect(musicBus)
  g.connect(wet)
  o.start(t)
  o.stop(t + 2.8)
}

function playPhrase() {
  const t0 = ctx.currentTime + 0.05
  const count = 1 + (Math.random() < 0.35 ? 1 : 0)
  let idx = 2 + Math.floor(Math.random() * 4)
  for (let i = 0; i < count; i++) {
    const clamped = Math.max(0, Math.min(SCALE.length - 1, idx))
    note(SCALE[clamped], t0 + i * (0.9 + Math.random() * 0.7))
    idx += Math.random() < 0.5 ? -1 : 1
    if (Math.random() < 0.2) idx -= 2
  }
}

function scheduleMelody() {
  if (!enabled) return
  playPhrase()
  melodyTimer = setTimeout(scheduleMelody, 3800 + Math.random() * 5200)
}

function rampMusic(to) {
  const g = musicBus.gain
  g.cancelScheduledValues(ctx.currentTime)
  g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime)
  g.linearRampToValueAtTime(to, ctx.currentTime + (to > 0 ? 2.2 : 0.6))
}

/* ------------------------------- SFX -------------------------------- */

// tic del reloj: opcionalmente doble (al cambiar la hora)
function tick(isHour) {
  if (!enabled || !ctx) return
  tickAlt = !tickAlt
  const t = ctx.currentTime
  const playOne = (when, freq) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    o.frequency.value = freq
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = 3200
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(isHour ? 0.016 : 0.011, when + 0.006)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07)
    o.connect(f)
    f.connect(g)
    g.connect(sfxBus)
    o.start(when)
    o.stop(when + 0.09)
  }
  playOne(t, tickAlt ? 1750 : 1480)
  if (isHour) playOne(t + 0.12, 2100)
}

function hover() {
  if (!enabled || !ctx) return
  const now = performance.now()
  if (now - lastHover < 110) return
  lastHover = now
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(660, t)
  o.frequency.exponentialRampToValueAtTime(920, t + 0.07)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.022, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
  o.connect(g)
  g.connect(sfxBus)
  o.start(t)
  o.stop(t + 0.1)
}

function click() {
  if (!enabled || !ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(240, t)
  o.frequency.exponentialRampToValueAtTime(140, t + 0.1)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.07, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
  o.connect(g)
  g.connect(sfxBus)
  o.start(t)
  o.stop(t + 0.14)

  const n = ctx.createBufferSource()
  n.buffer = noiseBuf
  const nf = ctx.createBiquadFilter()
  nf.type = 'highpass'
  nf.frequency.value = 2500
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(0.03, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  n.connect(nf)
  nf.connect(ng)
  ng.connect(sfxBus)
  n.start(t)
  n.stop(t + 0.06)
}

/* ---------------------------- control ------------------------------- */

function setEnabled(v) {
  if (v) {
    if (!ensureCtx()) return
    enabled = true
    try { localStorage.setItem(STORE_KEY, '1') } catch { /* ignore */ }
    startDrone()
    rampMusic(0.55)
    if (!melodyTimer) scheduleMelody()
  } else {
    enabled = false
    try { localStorage.setItem(STORE_KEY, '0') } catch { /* ignore */ }
    if (ctx) rampMusic(0)
    clearTimeout(melodyTimer)
    melodyTimer = 0
  }
  notify()
}

// SONIDO ENCENDIDO POR DEFAULT.
// - Intenta arrancar ya mismo (algunos navegadores lo permiten sin gesto previo).
// - Si el contexto queda suspendido, el primer gesto del usuario (click, tecla o
//   touch en cualquier lado) lo enciende.
// - Solo se respeta el silencio si el usuario apagó el sonido explícitamente ('0').
let wantsSound = true
try {
  wantsSound = localStorage.getItem(STORE_KEY) !== '0'
} catch { /* ignore */ }
if (wantsSound) {
  setEnabled(true)
  const kick = () => {
    if (!enabled) setEnabled(true)
    document.removeEventListener('pointerdown', kick, true)
    document.removeEventListener('keydown', kick, true)
    document.removeEventListener('touchstart', kick, true)
  }
  document.addEventListener('pointerdown', kick, true)
  document.addEventListener('keydown', kick, true)
  document.addEventListener('touchstart', kick, true)
}

export const sound = {
  get enabled() {
    return enabled
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
  setEnabled,
  tick,
  hover,
  click,
  state: () => (ctx ? ctx.state : 'uninitialized'),
}

// handle de debug (útil para pruebas automatizadas)
if (typeof window !== 'undefined') window.__lmSound = sound
