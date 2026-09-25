import { useEffect, useRef, useState } from 'react'
import Countdown from './Countdown.jsx'
import SignupForm from './SignupForm.jsx'
import { sound } from '../audio/soundEngine.js'

const LOGO_URL = '/logo.png'

export default function Hero() {
  const rootRef = useRef(null)
  const artRef = useRef(null)
  const contentRef = useRef(null)
  const logoRef = useRef(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [copied, setCopied] = useState(false)

  // Parallax con el mouse + scroll: escritura DIRECTA sobre el DOM (refs),
  // sin setState → cero re-renders → cero parpadeo.
  useEffect(() => {
    const fine = !window.matchMedia('(pointer: coarse)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined

    const root = rootRef.current
    const art = artRef.current
    const content = contentRef.current
    const logo = logoRef.current
    if (!root || !art || !content || !logo) return undefined

    let mx = 0
    let my = 0
    let scrollY = window.scrollY
    let raf = 0

    const apply = () => {
      raf = 0
      // fondo: contramovimiento + parallax de scroll
      art.style.transform = `scale(1.08) translate3d(${mx * -14}px, ${my * -10 + scrollY * 0.22}px, 0)`
      // contenido: movimiento leve opuesto (profundidad)
      content.style.transform = `translate3d(${mx * 8}px, ${my * 6}px, 0)`
      // logo: el más pronunciado
      logo.style.transform = `translate3d(${mx * 18}px, ${my * 14}px, 0) rotate(${mx * 0.8}deg)`
      // clase scrolled para el header
      root.classList.toggle('is-scrolled', scrollY > 40)
    }

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply)
    }

    const onMove = (e) => {
      if (!fine) return
      const r = root.getBoundingClientRect()
      mx = (e.clientX - r.left) / r.width - 0.5
      my = (e.clientY - r.top) / r.height - 0.5
      schedule()
    }
    const onLeave = () => {
      mx = 0
      my = 0
      schedule()
    }
    const onScroll = () => {
      scrollY = window.scrollY
      schedule()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    root.addEventListener('mouseleave', onLeave)
    apply()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
      root.removeEventListener('mouseleave', onLeave)
    }
  }, [])

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
    <header className="hero" ref={rootRef}>
      <div className="hero-art" ref={artRef}>
        <div className="hero-art-zoom" aria-hidden="true" />
      </div>
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-content" ref={contentRef}>
        <span className="hero-logo-wrap">
          <img
            className="hero-logo"
            src={LOGO_URL}
            alt="LA MATANZA"
            draggable="false"
            ref={logoRef}
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
