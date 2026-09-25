import { useEffect, useState } from 'react'
import Hero from './components/Hero.jsx'
import Ticker from './components/Ticker.jsx'
import Features from './components/Features.jsx'
import SunsetSection from './components/SunsetSection.jsx'
import Footer from './components/Footer.jsx'
import SmokeLayer from './components/SmokeLayer.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import ScrollProgress from './components/ScrollProgress.jsx'
import useReveal from './hooks/useReveal.js'
import { LAUNCH_DATE } from './config.js'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(t)
  }, [])

  // Título de pestaña vivo: al alejarse, muestra el tiempo restante
  useEffect(() => {
    const original = document.title
    const target = new Date(LAUNCH_DATE).getTime()
    const onVis = () => {
      if (document.hidden) {
        const ms = Math.max(0, target - Date.now())
        const d = Math.floor(ms / 86400000)
        const h = Math.floor(ms / 3600000) % 24
        document.title = d > 0 ? `⏰ Faltan ${d}d ${h}h — LA MATANZA` : `⏰ Faltan ${h}h — LA MATANZA`
      } else {
        document.title = original
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      document.title = original
    }
  }, [])

  useReveal()

  return (
    <div className={`site ${loaded ? 'is-loaded' : ''}`}>
      <ScrollProgress />
      <SmokeLayer />
      <SoundToggle />
      <Hero />
      <Ticker />
      <Features />
      <SunsetSection />
      <Footer />
    </div>
  )
}
