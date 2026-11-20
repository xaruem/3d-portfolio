import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { hero } from '../data/content'
import { scrollToId } from '../lib/scroll'

export default function Hero({ revealed }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set('.hero .mask > span', { yPercent: 118 })
      gsap.set('.hero .fade-in', { autoAlpha: 0, y: 24 })
      gsap.set('.hero-rule', { scaleX: 0, transformOrigin: 'left center' })
      gsap.set('.hero-ul', { scaleX: 0, transformOrigin: 'left center' })
      gsap.set('.hero-rule-wrap', { autoAlpha: 0 })
      gsap.set('.hero .kicker i', { scaleX: 0 })
    }, root)
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!revealed) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const off = []

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.to('.hero .kicker i', { scaleX: 1, duration: 1.1 }, 0)
      tl.to('.hero .mask > span', { yPercent: 0, duration: 1.5, stagger: 0.13 }, 0.1)
      tl.to('.hero .fade-in', { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1 }, 0.55)
      // линия под заголовком прорисовывается слева направо, затем подчёркивание ключевого слова
      tl.to('.hero-rule-wrap', { autoAlpha: 1, duration: 0.4 }, 0.9)
      tl.to('.hero-rule', { scaleX: 1, duration: 1.8, ease: 'expo.inOut' }, 0.9)
      tl.to('.hero-ul', { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 1.5)

      // подсветка линии следует за курсором (только мышь)
      if (fine && !reduce) {
        const wrap = root.current.querySelector('.hero-rule-wrap')
        const spot = root.current.querySelector('.rule-spot')
        const moveX = gsap.quickTo(spot, 'x', { duration: 0.6, ease: 'power3.out' })
        const onMove = (e) => {
          const r = wrap.getBoundingClientRect()
          moveX(e.clientX - r.left - spot.offsetWidth / 2)
          gsap.to(spot, { opacity: 1, duration: 0.4, overwrite: 'auto' })
        }
        const onLeave = () => gsap.to(spot, { opacity: 0, duration: 0.8 })
        root.current.addEventListener('pointermove', onMove)
        root.current.addEventListener('pointerleave', onLeave)
        off.push(() => {
          root.current?.removeEventListener('pointermove', onMove)
          root.current?.removeEventListener('pointerleave', onLeave)
        })
      }
    }, root)
    // шапка находится вне секции героя — анимируем отдельно
    gsap.fromTo('.header', { yPercent: -120 }, { yPercent: 0, duration: 1, delay: 0.6, ease: 'power3.out' })
    return () => { off.forEach((f) => f()); ctx.revert() }
  }, [revealed])

  return (
    <section id="top" className="hero" ref={root}>
      <div className="hero-inner">
        <div className="hero-top">
          <div className="kicker fade-in"><i /> {hero.kicker}</div>
          <div className="hero-tags fade-in" aria-hidden="true">
            <span>Сайты</span><b /><span>3D</span><b /><span>Запуск</span>
          </div>
        </div>

        <h1 className="hero-title">
          {hero.titleLines.map((l, i) => (
            <span className={'mask' + (i === hero.titleLines.length - 1 ? ' mask-last' : '')} key={i}>
              <span>{l}</span>
              {i === hero.titleLines.length - 1 && <i className="hero-ul" aria-hidden="true" />}
            </span>
          ))}
        </h1>

        <div className="hero-rule-wrap" aria-hidden="true">
          <div className="hero-rule" />
          <i className="rule-sweep" />
          <i className="rule-spot" />
        </div>

        <div className="hero-bottom">
          <p className="hero-text fade-in">{hero.text}</p>
          <div className="hero-cta fade-in">
            <a href="#projects" className="btn" onClick={(e) => { e.preventDefault(); scrollToId('projects') }}>
              <span>Смотреть проекты</span>
            </a>
            <a href="#contact" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); scrollToId('contact') }}>
              <span>Оставить заявку</span>
            </a>
          </div>
        </div>
      </div>
      <div className="scroll-cue fade-in" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}
