import { site } from '../data/content'
import { scrollToId } from '../lib/scroll'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-in">
        <span>© {site.since}–{new Date().getFullYear()} {site.name}</span>
        <button type="button" className="to-top" onClick={() => scrollToId('top')}>Наверх ↑</button>
      </div>
    </footer>
  )
}
