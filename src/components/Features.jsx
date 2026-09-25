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
  // Estela de luz que sigue al mouse dentro de cada card (via CSS vars --mx/--my)
  const onCardMove = (e) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
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
