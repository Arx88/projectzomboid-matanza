import { useEffect, useState } from 'react'

const ITEMS = [
  'MUCHOS MODS',
  'ARMAS',
  'NPC',
  'PvP',
  'COMUNIDAD, CAOS Y SUPERVIVENCIA',
  'UNITE A LA MATANZA',
]

export default function Ticker() {
  const [paused, setPaused] = useState(false)

  // Pausa cuando la pestaña está oculta (ahorro mínimo, detalle prolijo)
  useEffect(() => {
    const onVis = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const row = [...ITEMS, ...ITEMS]

  return (
    <div className={`ticker ${paused ? 'is-paused' : ''}`} aria-hidden="true">
      <div className="ticker-track">
        {row.map((t, i) => (
          <span className="ticker-item" key={`${t}-${i}`}>
            <span className="ticker-bullet">✦</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}
