# 3D-портфолио

Запуск: `npm install` → `npm run dev` (разработка) / `npm run build` (сборка в `dist/`).

## Что менять
Все тексты, цифры, ссылки и проекты — в **`src/data/content.js`**.

- **Второй проект**: в `projects.items[1]` впиши `title`, `desc` и `url`.
- **Настоящая 3D-модель**: положи `.glb` в `public/models/` и впиши `model: 'models/file.glb'` — она заменит демо-сцену.
- **Логотип таргетологов**: положи файл в `public/partners/` и впиши путь в `logo`.
- **Заявки**: токен бота и ID чата вписаны в начало `src/lib/submit.js`, заявки приходят в Telegram.

## Публикация на GitHub Pages
Залей в репозиторий (ветка `main`), в Settings → Pages выбери Source: GitHub Actions.
