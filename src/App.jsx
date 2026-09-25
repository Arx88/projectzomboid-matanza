import { useEffect, useState } from 'react'
import Hero from './components/Hero.jsx'
import Ticker from './components/Ticker.jsx'
import Features from './components/Features.jsx'
import SunsetSection from './components/SunsetSection.jsx'
import Footer from './components/Footer.jsx'
import SmokeLayer from './components/SmokeLayer.jsx'
import SoundToggle from './components/SoundToggle.jsx'
import useReveal from './hooks/useReveal.js'

export default function App() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(t)
  }, [])

  useReveal()

  return (
    <div className={`site ${loaded ? 'is-loaded' : ''}`}>
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
