import { useEffect, useState } from 'react'
import { sound } from '../audio/soundEngine.js'

export default function SoundToggle() {
  const [on, setOn] = useState(sound.enabled)

  useEffect(() => sound.subscribe(setOn), [])

  const toggle = () => {
    sound.setEnabled(!on)
    if (!on) {
      // al encender, confirmamos con el click
      setTimeout(() => sound.click(), 60)
    }
  }

  return (
    <button
      type="button"
      className={`sound-toggle ${on ? 'is-on' : ''}`}
      onClick={toggle}
      onMouseEnter={() => sound.hover()}
      aria-pressed={on}
      aria-label={on ? 'Silenciar sonido' : 'Activar sonido'}
      title={on ? 'Silenciar' : 'Activar música y sonidos'}
    >
      {/* ondas: se animan cuando está encendido */}
      <span className="st-wave" aria-hidden="true" />
      <span className="st-wave" aria-hidden="true" />
      <span className="st-wave" aria-hidden="true" />
      {/* tachado cuando está apagado */}
      <span className="st-slash" aria-hidden="true" />
    </button>
  )
}
