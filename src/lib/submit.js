// Заявка уходит напрямую в Telegram-бота.
const BOT_TOKEN = '9190860583:AAF7k5X9t2UeQbqv5ELmw48B4MlBf38sLoo'
const CHAT_ID = '-5037685601'

// антиспам: не больше 3 заявок за 24 часа с одного браузера
const LIMIT = 3
const WINDOW = 24 * 60 * 60 * 1000
const KEY = 'leads_sent'

const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))

const recent = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]')
    return list.filter((t) => Date.now() - t < WINDOW)
  } catch {
    return []
  }
}

export function sendLead({ name, phone, website = '' }) {
  if (website) return Promise.resolve('sent') // ловушка для ботов
  const list = recent()
  if (list.length >= LIMIT) return Promise.resolve('limit')

  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      parse_mode: 'HTML',
      text: `🔥 <b>Новая заявка с портфолио</b>\n\n👤 ${esc(name)}\n📞 ${esc(phone)}`,
    }),
  })
    .then((r) => r.json())
    .then((d) => {
      if (!d.ok) return Promise.reject(new Error('fail'))
      try { localStorage.setItem(KEY, JSON.stringify([...list, Date.now()])) } catch {}
      return 'sent'
    })
}
