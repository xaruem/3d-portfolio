import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { signals } from './lib/signals'
import { setLenis, getLenis } from './lib/scroll'
import Background from './components/Background'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Header from './components/Header'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Stats from './components/Stats'
import Projects from './components/Projects'
import Partners from './components/Partners'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Motion from './components/Motion'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // плавный скролл (Lenis) + связка с ScrollTrigger
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lenis = new Lenis({ lerp: reduce ? 1 : 0.095, smoothWheel: !reduce })
    lenis.stop() // пока идёт прелоадер, скролл заблокирован
    setLenis(lenis)
    lenis.on('scroll', (l) => {
      ScrollTrigger.update()
      signals.velocity = l.velocity
      signals.scroll = l.limit > 0 ? Math.min(1, Math.max(0, l.scroll / l.limit)) : 0
      document.documentElement.style.setProperty('--progress', signals.scroll.toFixed(4))
    })
    const raf = (t) => lenis.raf(t * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const onPointer = (e) => {
      signals.mtx = (e.clientX / window.innerWidth) * 2 - 1
      signals.mty = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer)
    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)

    return () => {
      gsap.ticker.remove(raf)
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('load', onLoad)
      setLenis(null)
      lenis.destroy()
    }
  }, [])

  const onReveal = () => {
    setRevealed(true)
    // setTimeout — чтобы твин не попал в gsap.context прелоадера (его revert() сбросил бы значение)
    setTimeout(() => gsap.to(signals, { reveal: 1, duration: 2.4, ease: 'power2.out' }), 0)
  }
  const onComplete = () => {
    setLoaded(true)
    getLenis()?.start()
    ScrollTrigger.refresh()
  }

  return (
    <>
      <Background />
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <div className="progress" aria-hidden="true"><i /></div>
      <Cursor />
      <Header />
      <main>
        <Hero revealed={revealed} />
        <Marquee />
        <Stats />
        <Projects />
        <Partners />
        <Contact />
      </main>
      <Footer />
      <Motion ready={loaded} />
      {!loaded && <Preloader onReveal={onReveal} onComplete={onComplete} />}
    </>
  )
}
