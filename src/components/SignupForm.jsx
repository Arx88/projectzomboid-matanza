import { useState } from 'react'
import { sound } from '../audio/soundEngine.js'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | error | ok

  const submit = (e) => {
    e.preventDefault()
    sound.click()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    if (!valid) {
      setState('error')
      return
    }
    // 🔧 Conectá acá tu backend / Google Form / Discord webhook
    setState('ok')
  }

  if (state === 'ok') {
    return (
      <div className="form-wrap" data-reveal>
        <div className="form-success" role="status">
          <span className="success-check" aria-hidden="true">✓</span>
          <p>
            ¡Listo! Te avisamos cuando <strong>LA MATANZA</strong> abra sus puertas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="form-wrap" data-reveal>
      <p className="form-title">Recibí el acceso y novedades</p>
      <form className={`signup ${state === 'error' ? 'is-error' : ''}`} onSubmit={submit} noValidate>
        <label className="email-field">
          <svg className="mail-ico" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="email"
            placeholder="Tu correo electrónico"
            value={email}
            autoComplete="email"
            onChange={(e) => {
              setEmail(e.target.value)
              if (state === 'error') setState('idle')
            }}
            onMouseEnter={() => sound.hover()}
            aria-label="Correo electrónico"
          />
        </label>
        <button type="submit" className="btn-subscribe" onMouseEnter={() => sound.hover()}>
          <span>Inscribirme</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M4 12h14m-5-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
      <p className={`form-hint ${state === 'error' ? 'visible' : ''}`} role="alert">
        Ingresá un correo válido para poder avisarte.
      </p>
    </div>
  )
}
