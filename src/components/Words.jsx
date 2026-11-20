// Абзац, разбитый на слова: при скролле слова по очереди «загораются» (см. Motion.jsx).
export default function Words({ text, className = 'lead' }) {
  return (
    <p className={`${className} words`}>
      {text.split(' ').map((w, i) => (
        <span className="w" key={i}>{w} </span>
      ))}
    </p>
  )
}
