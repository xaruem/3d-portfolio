import { site } from '../data/content'
import { scrollToId } from '../lib/scroll'

const links = [
  ['about', 'Обо мне'],
  ['projects', 'Проекты'],
  ['partners', 'Партнёры'],
]

export default function Header() {
  const go = (id) => (e) => { e.preventDefault(); scrollToId(id) }
  return (
    <header className="header">
      <a href="#top" className="brand" onClick={go('top')} aria-label="Наверх">
        <svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true">
          <path d="M32 6 54 19v26L32 58 10 45V19z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
          <path d="M10 19 32 32 54 19M32 32v26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" opacity=".6" />
        </svg>
        <span>{site.shortName}</span>
      </a>
      <nav className="nav" aria-label="Разделы">
        {links.map(([id, t]) => (
          <a key={id} href={`#${id}`} onClick={go(id)}>{t}</a>
        ))}
      </nav>
      <a href="#contact" className="btn btn-sm" onClick={go('contact')}>
        <span>Заявка</span>
      </a>
    </header>
  )
}
