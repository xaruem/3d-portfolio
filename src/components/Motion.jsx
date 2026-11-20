import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Общий слой анимаций: шапка, герой, подсветка карточек, магнитные кнопки,
// пословное проявление текста, линии у подписей, появление футера и деталей проектов.
// Запускается после прелоадера. При prefers-reduced-motion включается только состояние шапки.
export default function Motion({ ready }) {
  useEffect(() => {
    if (!ready) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const header = document.querySelector('.header')
    const off = []

    const ctx = gsap.context(() => {
      // ── шапка: стекло после скролла, прячется при прокрутке вниз, возвращается вверх
      let hidden = false
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const y = self.scroll()
          header.classList.toggle('is-scrolled', y > 40)
          if (reduce) return
          if (self.direction === 1 && y > 500 && !hidden) {
            hidden = true
            gsap.to(header, { yPercent: -110, duration: 0.6, ease: 'power3.inOut', overwrite: 'auto' })
          } else if ((self.direction === -1 || y <= 500) && hidden) {
            hidden = false
            gsap.to(header, { yPercent: 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' })
          }
        },
      })

      // ── активный пункт меню по текущему разделу
      const setActive = (id) =>
        document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`))
      ;['about', 'projects', 'partners', 'contact'].forEach((id) => {
        ScrollTrigger.create({
          trigger: `#${id}`, start: 'top 55%', end: 'bottom 55%',
          onToggle: (self) => self.isActive && setActive(id),
          onLeaveBack: () => id === 'about' && setActive(''),
        })
      })

      if (reduce) return

      // ── герой: при скролле уходит вверх и растворяется
      gsap.to('.hero-inner', {
        yPercent: -14, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true },
      })

      // ── линии у подписей разделов прорисовываются
      gsap.utils.toArray('.label i').forEach((el) => {
        gsap.from(el, {
          scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
        })
      })

      // ── длинные абзацы: слова проявляются по мере прокрутки
      gsap.utils.toArray('.words').forEach((p) => {
        gsap.fromTo(p.querySelectorAll('.w'), { opacity: 0.16 }, {
          opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: p, start: 'top 88%', end: 'bottom 58%', scrub: 0.6 },
        })
      })

      // ── проекты: уголки рамки «защёлкиваются», теги всплывают по очереди
      gsap.utils.toArray('.project').forEach((el) => {
        gsap.from(el.querySelectorAll('.corner'), {
          scale: 0, duration: 0.9, stagger: 0.08, ease: 'back.out(2.4)',
          scrollTrigger: { trigger: el, start: 'top 68%' },
        })
        gsap.from(el.querySelectorAll('.tags li'), {
          y: 16, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: el.querySelector('.tags'), start: 'top 90%' },
        })
      })

      // ── соцсети влетают справа по очереди
      gsap.from('.social', {
        x: 60, opacity: 0, duration: 1, stagger: 0.14, ease: 'power3.out', clearProps: 'all',
        scrollTrigger: { trigger: '.socials', start: 'top 85%' },
      })

      // ── футер
      gsap.from('.footer-in > *', {
        y: 20, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: '.footer', start: 'top 96%' },
      })

      // ── только для мыши: лёгкое смещение заголовка героя за курсором, магнитные кнопки, подсветка карточек
      if (!fine) return

      const tx = gsap.quickTo('.hero-title', 'x', { duration: 1.2, ease: 'power3.out' })
      const ty = gsap.quickTo('.hero-title', 'y', { duration: 1.2, ease: 'power3.out' })
      const onHero = (e) => {
        tx(-(e.clientX / window.innerWidth - 0.5) * 28)
        ty(-(e.clientY / window.innerHeight - 0.5) * 16)
      }
      window.addEventListener('pointermove', onHero)
      off.push(() => window.removeEventListener('pointermove', onHero))

      document.querySelectorAll('.btn:not(.btn-disabled), .to-top').forEach((el) => {
        const inner = el.classList.contains('btn') ? el.querySelector(':scope > span') : el
        if (!inner) return
        const mx = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'power3.out' })
        const my = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'power3.out' })
        const move = (e) => {
          const r = el.getBoundingClientRect()
          mx((e.clientX - (r.left + r.width / 2)) * 0.28)
          my((e.clientY - (r.top + r.height / 2)) * 0.4)
        }
        const leave = () => { mx(0); my(0) }
        el.addEventListener('pointermove', move)
        el.addEventListener('pointerleave', leave)
        off.push(() => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) })
      })

      const spot = (e) => {
        const el = e.target.closest && e.target.closest('.partner, .startup, .form, .social')
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
      }
      document.addEventListener('pointermove', spot, { passive: true })
      off.push(() => document.removeEventListener('pointermove', spot))
    })

    ScrollTrigger.refresh()
    return () => {
      off.forEach((f) => f())
      ctx.revert()
    }
  }, [ready])

  return null
}
