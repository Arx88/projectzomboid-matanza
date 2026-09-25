import { useEffect, useRef, useState } from 'react'
import Countdown from './Countdown.jsx'
import SignupForm from './SignupForm.jsx'
import { sound } from '../audio/soundEngine.js'

const LOGO_URL = '/logo.png'

export default function Hero() {
  const artRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [copied, setCopied] = useState(false)

  // Parallax con el mouse (solo dispositivos con puntero fino)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return undefined
    const el = artRef.current
    if (!el) return undefined
    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const nx = (e.clientX - r.left) / r.width - 0.5
        const ny = (e.clientY - r.top) / r.height - 0.5
        setTilt({ x: nx, y: ny })
      })
    }
    const onLeave = () => setTilt({ x: 0, y: 0 })
    window.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Parallax de scroll + fade del hero
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const mx = tilt.x
  const my = tilt.y

  // Botón compartir: API nativa en mobile, copia al portapapeles en desktop
  const share = async () => {
    sound.click()
    const data = {
      title: 'LA MATANZA — Servidor de Project Zomboid',
      text: 'Cuenta regresiva para la apertura. Unite a LA MATANZA 🧟',
      url: window.location.origin,
    }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(data.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2200)
      }
    } catch {
      /* cancelado por el usuario */
    }
  }

  return (
    <header className={`hero ${scrollY > 40 ? 'is-scrolled' : ''}`} ref={artRef}>
      <div
        className="hero-art"
        style={{
          transform: `scale(1.08) translate3d(${mx * -14}px, ${my * -10 + scrollY * 0.22}px, 0)`,
        }}
      >
        <div className="hero-art-zoom" aria-hidden="true" />
      </div>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-content" style={{ transform: `translate3d(${mx * 8}px, ${my * 6}px, 0)` }}>
        <span className="hero-logo-wrap">
          <img
            className="hero-logo"
            src={LOGO_URL}
            alt="LA MATANZA"
            draggable="false"
            style={{ transform: `translate3d(${mx * 18}px, ${my * 14}px, 0) rotate(${mx * 0.8}deg)` }}
          />
          <span className="logo-sweep" aria-hidden="true" />
        </span>
        <p className="hero-tagline">Servidor de Project Zomboid</p>

        <Countdown />
        <SignupForm />
        <button type="button" className="share-btn" onClick={share} onMouseEnter={() => sound.hover()}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="17.5" cy="5.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="17.5" cy="18.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8.4 10.8 15.2 7M8.4 13.2 15.2 17" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <span>Compartir el sitio</span>
        </button>
        <span className={`copy-toast ${copied ? 'show' : ''}`} role="status">Link copiado ✓</span>
      </div>

      <div className="hero-scrollcue" aria-hidden="true">
        <span />
      </div>
    </header>
  )
}
