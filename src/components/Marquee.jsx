import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { marquee } from '../data/content'
import { signals } from '../lib/signals'

// Бегущая строка: скорость и наклон зависят от скорости скролла.
export default function Marquee() {
  const track = useRef(null)
  const wrap = useRef(null)

  useEffect(() => {
    let x = 0
    let skew = 0
    const tick = (_, dt) => {
      const el = track.current
      if (!el) return
      const half = el.scrollWidth / 2
      const v = signals.velocity
      x -= (0.06 + Math.abs(v) * 0.012) * dt
      if (x <= -half) x += half
      skew += (Math.max(-9, Math.min(9, v * 0.18)) - skew) * 0.1
      el.style.transform = `translate3d(${x}px,0,0)`
      wrap.current.style.transform = `skewX(${-skew}deg)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  const row = marquee.map((t, i) => (
    <span key={i} className={i % 2 ? 'mq-out' : ''}>{t}<b>✦</b></span>
  ))
  return (
    <div className="marquee" aria-hidden="true">
      <div ref={wrap}>
        <div ref={track} className="mq-track">{row}{row}{row}{row}</div>
      </div>
    </div>
  )
}
