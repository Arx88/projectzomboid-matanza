import { useEffect, useRef } from 'react'

/** Capa ambiental fija: humo tibio + brasas que suben. Coste fijo, muy sutil. */
export default function SmokeLayer() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let raf = 0
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    const rand = (a, b) => a + Math.random() * (b - a)

    const blobs = Array.from({ length: 7 }, (_, i) => ({
      x: rand(0, 1),
      y: rand(0, 1),
      r: rand(200, 420),
      vx: rand(-0.12, 0.12),
      vy: rand(-0.28, -0.08),
      a: rand(0.035, 0.075),
      hue: i % 2 ? 14 : 352,
    }))

    const embers = Array.from({ length: 28 }, () => ({
      x: rand(0, 1),
      y: rand(0, 1),
      r: rand(0.6, 2.2),
      vx: rand(-0.06, 0.06),
      vy: rand(0.2, 0.6),
      tw: rand(0, Math.PI * 2),
      tws: rand(0.02, 0.06),
      a: rand(0.3, 0.75),
    }))

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * DPR)
      canvas.height = Math.floor(h * DPR)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const drawEmbers = (staticPass = false) => {
      for (const e of embers) {
        const alpha = staticPass ? e.a * 0.5 : e.a * (0.55 + 0.45 * Math.sin(e.tw))
        ctx.fillStyle = `rgba(255, 138, 56, ${alpha})`
        ctx.beginPath()
        ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const frame = () => {
      ctx.clearRect(0, 0, w, h)

      for (const b of blobs) {
        b.x += b.vx / w
        b.y += b.vy / h
        if (b.y < -0.3) { b.y = 1.25; b.x = Math.random() }
        if (b.x < -0.3) b.x = 1.25
        if (b.x > 1.3) b.x = -0.25
        const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r)
        g.addColorStop(0, `hsla(${b.hue}, 70%, 45%, ${b.a})`)
        g.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x * w, b.y * h, b.r, 0, Math.PI * 2)
        ctx.fill()
      }

      for (const e of embers) {
        e.x += e.vx / w
        e.y -= e.vy / h
        e.tw += e.tws
        if (e.y < -0.05) { e.y = 1.05; e.x = Math.random() }
        if (e.x < -0.05) e.x = 1.05
        if (e.x > 1.05) e.x = -0.05
      }
      drawEmbers(false)

      raf = requestAnimationFrame(frame)
    }

    if (reduce) {
      drawEmbers(true)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} className="smoke-layer" aria-hidden="true" />
}
