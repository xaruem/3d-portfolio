import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { partners } from '../data/content'
import { asset } from '../lib/signals'

// Если у партнёра нет логотипа — аккуратная иконка-прицел того же размера, чтобы ряд выглядел цельным.
function TargetMark() {
  return (
    <svg viewBox="0 0 120 120" className="target-mark" aria-hidden="true">
      <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" strokeWidth="2" opacity=".35" />
      <circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" strokeWidth="2" opacity=".6" />
      <circle cx="60" cy="60" r="8" fill="var(--accent)" />
      <path d="M60 6v26M60 88v26M6 60h26M88 60h26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Partners() {
  const root = useRef(null)
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.partners .mask > span', {
        yPercent: 118, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: root.current, start: 'top 72%' },
      })
      gsap.from('.partners [data-reveal]', {
        autoAlpha: 0, y: 40, duration: 1, stagger: 0.14, ease: 'power3.out', clearProps: 'transform',
        scrollTrigger: { trigger: root.current, start: 'top 62%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="partners" className="section partners" ref={root}>
      <div className="wrap">
        <div className="label" data-reveal><i />{partners.label}</div>
        <h2 className="h2"><span className="mask"><span>{partners.title}</span></span></h2>
        <div className="partner-grid">
          {partners.items.map((p) => (
            <div className="partner" key={p.name} data-reveal>
              <div className="partner-logo">
                {p.logo ? (
                  <>
                    <img className="logo-white" src={asset(p.logo)} alt={p.name} loading="lazy" />
                    {p.logoOriginal && <img className="logo-color" src={asset(p.logoOriginal)} alt="" loading="lazy" aria-hidden="true" />}
                  </>
                ) : (
                  <TargetMark />
                )}
              </div>
              <div className="partner-name">{p.name}</div>
              <div className="partner-role">{p.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
