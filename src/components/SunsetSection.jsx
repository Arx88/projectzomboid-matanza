import { useEffect, useRef, useState } from 'react'
import { DISCORD_URL } from '../config.js'
import { sound } from '../audio/soundEngine.js'

export default function SunsetSection() {
  const ref = useRef(null)
  const [shift, setShift] = useState(0)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const progress = 1 - (r.top + r.height) / (window.innerHeight + r.height)
        setShift(Math.max(0, Math.min(1, progress)))
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section className="sunset" ref={ref}>
      <div
        className="sunset-art"
        style={{ transform: `scale(1.12) translate3d(0, ${(shift - 0.5) * -48}px, 0)` }}
      />
      <div className="sunset-fade" aria-hidden="true" />

      <div className="sunset-content" data-reveal>
        <p className="sunset-kicker">Comunidad, caos y supervivencia</p>
        <h2 className="sunset-title">
          Unite a <span className="text-fire">LA MATANZA</span>
        </h2>
        <a
          className="btn-discord"
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer noopener"
          onMouseEnter={() => sound.hover()}
          onClick={() => sound.click()}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              fill="currentColor"
              d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.8 13.8 0 0 0-.64 1.28 18.3 18.3 0 0 0-5.5 0 13.8 13.8 0 0 0-.64-1.28c-1.71.29-3.37.8-4.93 1.51A20.3 20.3 0 0 0 .1 18.06a19.9 19.9 0 0 0 6.07 3.03c.49-.66.93-1.37 1.3-2.1a12.9 12.9 0 0 1-2.05-.98c.17-.12.34-.25.5-.38a14.2 14.2 0 0 0 12.16 0c.16.13.33.26.5.38-.65.38-1.34.7-2.05.98.37.73.81 1.44 1.3 2.1a19.9 19.9 0 0 0 6.07-3.03 20.3 20.3 0 0 0-3.58-13.69ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.95 2.42-2.16 2.42Zm7.96 0c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42 2.18 1.09 2.16 2.42c0 1.34-.95 2.42-2.16 2.42Z"
            />
          </svg>
          <span>Unirse al Discord</span>
        </a>
      </div>
    </section>
  )
}
