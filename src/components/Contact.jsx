import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { contact } from '../data/content'
import { sendLead } from '../lib/submit'
import Words from './Words'

// Любой международный номер: +7 (РФ), +998 (УЗ) и другие
function formatPhone(raw) {
  let d = raw.replace(/\D/g, '').slice(0, 15)
  if (!d) return raw.includes('+') ? '+' : ''
  if (d.startsWith('8') && d.length > 1 && !raw.trim().startsWith('+')) d = '7' + d.slice(1) // 8 999… → +7 999…
  const groups = (cc, sizes) => {
    const rest = d.slice(cc.length)
    const out = []
    let i = 0
    for (const n of sizes) { if (rest.slice(i, i + n)) out.push(rest.slice(i, i + n)); i += n }
    if (rest.slice(i)) out.push(rest.slice(i))
    return '+' + cc + (out.length ? ' ' + out.join(' ') : '')
  }
  if (d.startsWith('7')) return groups('7', [3, 3, 2, 2])
  if (d.startsWith('998')) return groups('998', [2, 3, 2, 2])
  if (d.startsWith('375') || d.startsWith('380') || d.startsWith('996') || d.startsWith('992') || d.startsWith('993') || d.startsWith('994') || d.startsWith('995'))
    return groups(d.slice(0, 3), [2, 3, 2, 2])
  return '+' + d.replace(/(\d{3})(?=\d)/g, '$1 ')
}
const phoneOk = (v) => { const n = v.replace(/\D/g, '').length; return n >= 10 && n <= 15 }

const IgIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
)
const TgIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M21.4 3.6 2.9 10.7c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8L22.9 5c.3-1.2-.5-1.7-1.5-1.4Zm-3.1 3.6-8.7 7.9-.3 3.6-1.4-4.6 10.4-6.9Z" />
  </svg>
)

export default function Contact() {
  const root = useRef(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [state, setState] = useState('idle') // idle | sending | sent | telegram | error
  const [touched, setTouched] = useState(false)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.contact .mask > span', {
        yPercent: 118, duration: 1.2, ease: 'power4.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 72%' },
      })
      gsap.from('.contact [data-reveal]', {
        autoAlpha: 0, y: 40, duration: 1, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 62%' },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const nameErr = touched && name.trim().length < 2
  const phoneErr = touched && !phoneOk(phone)

  const submit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (name.trim().length < 2 || !phoneOk(phone)) {
      gsap.fromTo(root.current.querySelector('.form'), { x: -12 }, { x: 0, duration: 0.8, ease: 'elastic.out(1, 0.25)', clearProps: 'transform' })
      return
    }
    setState('sending')
    sendLead({ name: name.trim(), phone, website: e.currentTarget.elements.website?.value || '' })
      .then((r) => setState(r))
      .catch(() => setState('error'))
  }

  const done = state === 'sent' || state === 'telegram'
  useEffect(() => {
    if (done || state === 'error' || state === 'limit') gsap.fromTo(root.current.querySelector('.form-msg'), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' })
  }, [done, state])

  return (
    <section id="contact" className="section contact" ref={root}>
      <div className="wrap">
        <div className="label" data-reveal><i />{contact.label}</div>
        <h2 className="h2 h2-xl">
          {contact.title.split(' ').reduce((acc, w, i, arr) => {
            // две строки заголовка
            const mid = Math.ceil(arr.length / 2)
            const k = i < mid ? 0 : 1
            acc[k] = (acc[k] ? acc[k] + ' ' : '') + w
            return acc
          }, []).map((l, i) => <span className="mask" key={i}><span>{l}</span></span>)}
        </h2>
        <Words text={contact.text} />

        <div className="contact-grid">
          <form className={`form ${done ? 'is-done' : ''}`} onSubmit={submit} noValidate data-reveal>
            <label className={`field ${nameErr ? 'has-err' : ''}`}>
              <span>Ваше имя</span>
              <input
                type="text" name="name" autoComplete="name" placeholder="Как к вам обращаться"
                value={name} onChange={(e) => setName(e.target.value)} disabled={state === 'sending' || done}
              />
              {nameErr && <em>Введите имя</em>}
            </label>
            <label className={`field ${phoneErr ? 'has-err' : ''}`}>
              <span>Номер телефона</span>
              <input
                type="tel" name="phone" inputMode="tel" autoComplete="tel" placeholder="+7 999 123 45 67"
                value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))}
                onBlur={() => phone === '+' && setPhone('')}
                onFocus={() => !phone && setPhone('+')} disabled={state === 'sending' || done}
              />
              {phoneErr && <em>Введите номер с кодом страны</em>}
            </label>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
            <button className="btn btn-lg btn-block" type="submit" disabled={state === 'sending' || done}>
              <span>{state === 'sending' ? 'Отправляю…' : 'Отправить заявку'}</span>
            </button>
            <div className={`form-msg ${done ? 'ok' : ''} ${state === 'error' || state === 'limit' ? 'bad' : ''}`} role="status" aria-live="polite">
              {state === 'sent' && '✓ Заявка отправлена. Скоро свяжусь с вами.'}
              {state === 'telegram' && '✓ Открыл Telegram с готовым текстом: осталось нажать «Отправить».'}
              {state === 'limit' && 'Вы уже отправили несколько заявок. Напишите в Telegram или Instagram ниже.'}
              {state === 'error' && 'Не получилось отправить. Напишите в Telegram или Instagram ниже.'}
            </div>
          </form>

          <div className="socials" data-reveal>
            <div className="socials-title">Или напишите в личку</div>
            <a className="social" href={`https://ig.me/m/${contact.instagram}`} target="_blank" rel="noopener noreferrer">
              <span className="social-ico"><IgIcon /></span>
              <span className="social-txt"><b>Instagram</b><small>@{contact.instagram}</small></span>
              <svg className="social-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
            <a className="social" href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer">
              <span className="social-ico"><TgIcon /></span>
              <span className="social-txt"><b>Telegram</b><small>@{contact.telegram}</small></span>
              <svg className="social-arrow" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
