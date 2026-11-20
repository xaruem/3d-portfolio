// Единственный экземпляр Lenis живёт здесь — чтобы любой компонент мог скроллить к якорю.
let lenis = null
export const setLenis = (l) => { lenis = l }
export const getLenis = () => lenis

export function scrollToId(id) {
  const el = id === 'top' ? 0 : document.getElementById(id)
  if (lenis) lenis.scrollTo(el, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) })
  else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' })
  else el?.scrollIntoView({ behavior: 'smooth' })
}
