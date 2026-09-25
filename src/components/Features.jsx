const FEATURES = [
  {
    id: 'mods',
    title: 'Muchos mods',
    desc: 'Una experiencia ampliada con contenido único.',
    img: '/card-mods.png',
    accent: '#e04a3a',
  },
  {
    id: 'armas',
    title: 'Armas',
    desc: 'Gran variedad de armas y equipamiento.',
    img: '/card-armas.png',
    accent: '#f0a03c',
  },
  {
    id: 'npc',
    title: 'NPC',
    desc: 'El mundo se siente más vivo con supervivientes y facciones.',
    img: '/card-npc.png',
    accent: '#5a8fd8',
  },
  {
    id: 'pvp',
    title: 'PvP',
    desc: 'Supervivencia real. Confiá, formá alianzas o dominá.',
    img: '/card-pvp.png',
    accent: '#b564e0',
  },
]

export default function Features() {
  // Estela de luz + tilt 3D sutil que sigue al mouse en cada card
  const onCardMove = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const nx = (e.clientX - r.left) / r.width
    const ny = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${nx * 100}%`)
    el.style.setProperty('--my', `${ny * 100}%`)
    el.style.setProperty('--rx', `${(0.5 - ny) * 5}deg`)
    el.style.setProperty('--ry', `${(nx - 0.5) * 7}deg`)
  }

  const onCardLeave = (e) => {
    const el = e.currentTarget
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <section className="features" id="features">
      <div className="features-head" data-reveal>
        <span className="rule" aria-hidden="true" />
        <h2>Servidor cuidadozamente balanceado</h2>
        <span className="rule" aria-hidden="true" />
      </div>

      <div className="features-grid">
        {FEATURES.map((f, i) => (
          <article
            className="feature-card"
            key={f.id}
            data-reveal
            onMouseMove={onCardMove}
            onMouseLeave={onCardLeave}
            style={{ '--d': `${i * 90}ms`, '--accent': f.accent }}
          >
            <div className="feature-img-wrap">
              <img src={f.img} alt="" loading="lazy" draggable="false" />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className="feature-bar" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  )
}
