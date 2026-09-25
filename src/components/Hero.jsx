import { useEffect, useRef, useState } from 'react'
import Countdown from './Countdown.jsx'
import SignupForm from './SignupForm.jsx'

const LOGO_URL = '/logo.png'

export default function Hero() {
  const artRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

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

  return (
    <header className={`hero ${scrollY > 40 ? 'is-scrolled' : ''}`} ref={artRef}>
      <div
        className="hero-art"
        style={{
          transform: `scale(1.08) translate3d(${mx * -14}px, ${my * -10 + scrollY * 0.22}px, 0)`,
        }}
      />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-content" style={{ transform: `translate3d(${mx * 8}px, ${my * 6}px, 0)` }}>
        <img
          className="hero-logo"
          src={LOGO_URL}
          alt="LA MATANZA"
          draggable="false"
          style={{ transform: `translate3d(${mx * 18}px, ${my * 14}px, 0) rotate(${mx * 0.8}deg)` }}
        />
        <p className="hero-tagline">Servidor de Project Zomboid</p>

        <Countdown />
        <SignupForm />
      </div>

      <div className="hero-scrollcue" aria-hidden="true">
        <span />
      </div>
    </header>
  )
}
