import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { stats } from '../data/content'
import Words from './Words'

export default function Stats() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.about .mask > span', {
        yPercent: 118, duration: 1.2, ease: 'power4.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      })
      gsap.from('.about [data-reveal]', {
        autoAlpha: 0, y: 40, duration: 1, ease: 'power3.out', stagger: 0.12, clearProps: 'transform',
        scrollTrigger: { trigger: root.current, start: 'top 60%' },
      })
      // счётчики
      gsap.utils.toArray('.stat-num').forEach((el) => {
        const end = Number(el.dataset.value)
        const o = { v: 0 }
        ScrollTrigger.create({
          trigger: el, start: 'top 88%', once: true,
          onEnter: () => gsap.to(o, {
            v: end, duration: 2.2, ease: 'power3.out',
            onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('ru-RU').replace(/ /g, ' ') },
          }),
        })
      })
      // линия-прогресс у карточки стартапа
      gsap.fromTo('.startup-line', { scaleX: 0 }, {
        scaleX: 1, ease: 'none', transformOrigin: 'left center',
        scrollTrigger: { trigger: '.startup', start: 'top 85%', end: 'bottom 55%', scrub: true },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const s = stats
  return (
    <section id="about" className="section about" ref={root}>
      <div className="wrap">
        <div className="label" data-reveal><i />{s.label}</div>
        <h2 className="h2">
          <span className="mask"><span>{s.title}</span></span>
        </h2>
        <Words text={s.text} />

        <div className="stat-grid">
          {s.items.map((it) => (
            <div className="stat" key={it.label} data-reveal>
              <div className="stat-top">
                <span className="stat-num" data-value={it.value}>0</span>
                <em>{it.suffix}</em>
              </div>
              <div className="stat-label">{it.label}</div>
              <div className="stat-note">{it.note}</div>
            </div>
          ))}
        </div>

        <a className="startup" href={s.startup.url} target="_blank" rel="noopener noreferrer" data-reveal>
          <div className="startup-line" />
          <div className="startup-tag">{s.startup.tag}</div>
          <div className="startup-body">
            <h3>{s.startup.name}</h3>
            <p>{s.startup.text}</p>
          </div>
          <div className="startup-go">
            <span>{s.startup.urlLabel}</span>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7M8 7h9v9" /></svg>
          </div>
        </a>
      </div>
    </section>
  )
}
