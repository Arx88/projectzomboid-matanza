import { useEffect, useMemo, useRef, useState } from 'react'
import { sound } from '../audio/soundEngine.js'
import { LAUNCH_DATE } from '../config.js'

/** Objetivo de apertura — definido en src/config.js */
const TARGET = new Date(LAUNCH_DATE)

function pad(n) {
  return String(n).padStart(2, '0')
}

function calc(target) {
  const diff = Math.max(0, target - Date.now())
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000) % 24
  const m = Math.floor(diff / 60000) % 60
  const s = Math.floor(diff / 1000) % 60
  return { d, h, m, s, done: diff === 0 }
}

export default function Countdown() {
  const [time, setTime] = useState(() => calc(TARGET))
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTime(calc(TARGET)), 1000)
    return () => clearInterval(id)
  }, [])

  // micro-glow visual en cada segundo (sin sonido)
  useEffect(() => {
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 320)
    return () => clearTimeout(t)
  }, [time.s])

  // sonido bien bajito: solo al cambiar el MINUTO (tic) o la HORA (tic doble)
  const prevRef = useRef(null)
  useEffect(() => {
    if (prevRef.current) {
      if (time.h !== prevRef.current.h) sound.tick(true)
      else if (time.m !== prevRef.current.m) sound.tick()
    }
    prevRef.current = { m: time.m, h: time.h }
  }, [time.m, time.h])

  const units = useMemo(
    () => [
      { key: 'd', label: 'días', value: pad(time.d) },
      { key: 'h', label: 'horas', value: pad(time.h) },
      { key: 'm', label: 'min', value: pad(time.m) },
      { key: 's', label: 'seg', value: pad(time.s) },
    ],
    [time],
  )

  const isSoon = time.d === 0

  if (time.done) {
    return (
      <div className="countdown" data-reveal>
        <p className="countdown-open">
          ¡EL SERVIDOR ESTÁ <span className="text-fire">ABIERTO!</span>
        </p>
      </div>
    )
  }

  return (
    <div className="countdown" data-reveal>
      <p className="countdown-title">{isSoon ? '¡La apertura es hoy!' : 'Cuenta regresiva para la apertura'}</p>
      <p className="countdown-date">
        Sábado 26/09 · 23:00 hs AR
        <span className="cd-live-dot" aria-hidden="true" />
      </p>
      <div className={`countdown-grid ${isSoon ? 'is-soon' : ''}`} role="timer" aria-live="off">
        {units.map((u) => (
          <div className={`cd-cell ${u.key === 's' && pulse ? 'is-tick' : ''}`} key={u.key}>
            <span className="cd-value">
              {/* key={u.value} remonta el dígito al cambiar → la animación corre una vez, sin parpadeo */}
              <span className="cd-digit" key={u.value}>
                {u.value}
              </span>
            </span>
            <span className="cd-label">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
