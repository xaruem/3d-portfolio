import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { projects } from '../data/content'
import ProjectScene from './ProjectScene'

function Card({ p, flip }) {
  const frame = useRef(null)

  // лёгкий 3D-наклон рамки за курсором
  const onMove = (e) => {
    const r = frame.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    gsap.to(frame.current, { rotateY: x * 6, rotateX: -y * 5, duration: 0.6, ease: 'power3.out' })
  }
  const onLeave = () => gsap.to(frame.current, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'power3.out' })

  return (
    <article className={`project ${flip ? 'flip' : ''}`}>
      <div className="project-view" data-reveal-card>
        <div className="frame" ref={frame} onPointerMove={onMove} onPointerLeave={onLeave}>
          <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
          <div className="hud hud-l"><b>{p.hud[0]}</b></div>
          <div className="hud hud-r"><span className="dot" />{p.hud[1]}</div>
          <ProjectScene scene={p.scene} model={p.model} />
          <div className="hint">↻ Крутите модель</div>
        </div>
      </div>

      <div className="project-info">
        <div className="project-index" data-reveal>{p.id}<span>/ {String(projects.items.length).padStart(2, '0')}</span></div>
        <div className="project-kind" data-reveal>{p.kind}</div>
        <h3 className="project-title"><span className="mask"><span>{p.title}</span></span></h3>
        <p className="project-desc" data-reveal>{p.desc}</p>
        <ul className="tags" data-reveal>
          {p.tags.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <div data-reveal>
          {p.url ? (
            <a className="btn btn-lg" href={p.url} target="_blank" rel="noopener noreferrer">
              <span>Перейти на сайт</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
          ) : (
            <span className="btn btn-lg btn-disabled" aria-disabled="true"><span>Ссылка скоро появится</span></span>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Projects() {
  const root = useRef(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.projects-head .mask > span', {
        yPercent: 118, duration: 1.2, ease: 'power4.out',
        scrollTrigger: { trigger: '.projects-head', start: 'top 75%' },
      })
      gsap.from('.projects-head [data-reveal]', {
        autoAlpha: 0, y: 30, duration: 1, stagger: 0.1,
        scrollTrigger: { trigger: '.projects-head', start: 'top 70%' },
      })
      gsap.utils.toArray('.project').forEach((el) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 72%' } })
        tl.from(el.querySelector('.project-view'), { clipPath: 'inset(12% 8% 12% 8% round 28px)', autoAlpha: 0, scale: 0.94, duration: 1.3, ease: 'power4.out' })
          .from(el.querySelectorAll('.project-title .mask > span'), { yPercent: 118, duration: 1.1, ease: 'power4.out' }, 0.2)
          .from(el.querySelectorAll('.project-info [data-reveal]'), { autoAlpha: 0, y: 30, duration: 0.9, stagger: 0.09, ease: 'power3.out' }, 0.3)
        // параллакс самой модели относительно текста
        gsap.fromTo(el.querySelector('.project-view'), { y: 40 }, {
          y: -40, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section id="projects" className="section projects" ref={root}>
      <div className="wrap">
        <div className="projects-head">
          <div className="label" data-reveal><i />{projects.label}</div>
          <h2 className="h2"><span className="mask"><span>{projects.title}</span></span></h2>
        </div>
        {projects.items.map((p, i) => <Card key={p.id} p={p} flip={i % 2 === 1} />)}
      </div>
    </section>
  )
}
