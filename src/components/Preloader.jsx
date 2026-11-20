import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { site } from '../data/content'

// Прелоадер: тонкая линия-«шов» посередине экрана заполняется по мере загрузки,
// имя проявляется по буквам, крупный счётчик справа внизу.
// В конце экран раскрывается по шву на две половины и открывает героя.
export default function Preloader({ onReveal, onComplete }) {
  const root = useRef(null)
  const fill = useRef(null)
  const count = useRef(null)
  const cb = useRef({ onReveal, onComplete })
  cb.current = { onReveal, onComplete }

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      const p = { v: 0 }
      const paint = () => {
        count.current.textContent = String(Math.round(p.v)).padStart(2, '0')
        fill.current.style.transform = `scaleX(${p.v / 100})`
      }

      const tl = gsap.timeline({ onComplete: () => cb.current.onComplete() })

      // свечение медленно «дышит» за именем
      gsap.to('.pl-glow', { scale: 1.18, opacity: 0.9, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 })

      // имя проявляется по буквам из-под маски
      tl.from('.pl-char', { yPercent: 118, rotate: 4, duration: 1.2, stagger: 0.045, ease: 'expo.out' }, 0.15)
      tl.from('.pl-sub', { autoAlpha: 0, y: 14, duration: 1.1, ease: 'power3.out' }, 0.9)
      tl.from('.pl-side', { autoAlpha: 0, duration: 1, ease: 'power2.out' }, 0.6)
      tl.from('.pl-count-wrap', { autoAlpha: 0, y: 30, duration: 1.2, ease: 'expo.out' }, 0.4)

      // загрузка: плавный счёт 0 → 100
      tl.to(p, { v: 100, duration: reduce ? 1.4 : 3.1, ease: 'power2.inOut', onUpdate: paint }, 0)

      // уход текста вверх/вниз, каждая половина уносит свой контент
      tl.to('.pl-char', { yPercent: -118, duration: 0.8, stagger: 0.025, ease: 'expo.in' }, '+=0.3')
      tl.to(['.pl-sub', '.pl-side', '.pl-count-wrap'], { autoAlpha: 0, duration: 0.5, ease: 'power2.in' }, '<')
      tl.to('.pl-glow', { autoAlpha: 0, duration: 0.6 }, '<')

      // линия-шов гаснет, экран раскрывается по ней
      tl.to('.pl-line', { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '>-0.15')
      tl.to('.pl-panel-t', { yPercent: -100, duration: 1.35, ease: 'expo.inOut', onStart: () => cb.current.onReveal() }, '<0.1')
      tl.to('.pl-panel-b', { yPercent: 100, duration: 1.35, ease: 'expo.inOut' }, '<')
    }, root)
    return () => ctx.revert()
  }, [])

  const chars = Array.from(site.name)

  return (
    <div ref={root} className="preloader" role="progressbar" aria-label="Загрузка">
      <div className="pl-panel pl-panel-t">
        <div className="pl-glow" aria-hidden="true" />
        <h2 className="pl-name" aria-label={site.name}>
          {chars.map((c, i) => (
            <span className="pl-mask" key={i} aria-hidden="true">
              <span className="pl-char">{c === ' ' ? '\u00A0' : c}</span>
            </span>
          ))}
        </h2>
      </div>

      <div className="pl-line" aria-hidden="true">
        <i ref={fill} />
      </div>

      <div className="pl-panel pl-panel-b">
        <p className="pl-sub">Сайты и 3D-портфолио</p>
        <p className="pl-side">Работаю с 2021 года</p>
        <div className="pl-count-wrap" aria-hidden="true">
          <span ref={count} className="pl-count">00</span>
          <span className="pl-pct">%</span>
        </div>
      </div>
    </div>
  )
}
