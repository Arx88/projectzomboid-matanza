import { useState } from 'react'
import { sound } from '../audio/soundEngine.js'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [hp, setHp] = useState('') // honeypot anti-bots
  const [state, setState] = useState('idle') // idle | sending | error | ok
  const [errorMsg, setErrorMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    sound.click()

    // bots que rellenan el campo trampa: fingimos éxito y no guardamos nada
    if (hp) {
      setState('ok')
      return
    }

    const clean = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErrorMsg('Ingresá un correo válido para poder avisarte.')
      setState('error')
      return
    }

    setState('sending')
    try {
      if (import.meta.env.DEV) {
        // En dev no hay backend: simulamos el alta para probar la UI
        await new Promise((r) => setTimeout(r, 450))
      } else {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: clean, website: hp }),
        })
        if (!res.ok) throw new Error(`status ${res.status}`)
      }
      setState('ok')
    } catch {
      setErrorMsg('No pudimos registrar tu correo. Probá de nuevo en un rato.')
      setState('error')
    }
  }

  if (state === 'ok') {
    return (
      <div className="form-wrap" data-reveal>
        <div className="form-success" role="status">
          <span className="success-check" aria-hidden="true">✓</span>
          <p>
            ¡Listo! Te avisamos <strong>1 hora antes</strong> de que <strong>LA MATANZA</strong> abra
            sus puertas.
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
        {/* honeypot: invisible para humanos, irresistible para bots */}
        <input
          type="text"
          className="hp-field"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button
          type="submit"
          className="btn-subscribe"
          onMouseEnter={() => sound.hover()}
          disabled={state === 'sending'}
        >
          <span>{state === 'sending' ? 'Enviando…' : 'Inscribirme'}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M4 12h14m-5-6 6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>
      <p className={`form-hint ${state === 'error' ? 'visible' : ''}`} role="alert">
        {errorMsg}
      </p>
    </div>
  )
}
