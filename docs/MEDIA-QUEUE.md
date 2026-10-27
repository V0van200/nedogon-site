# Очередь видео

Сюда GPT и пользователь пишут, какие ролики нужны сайту; Claude берёт заказы по порядку.
Готовый ролик появляется в `content/media/library.json` со статусом `published`. Правила — `docs/COLLAB.md`.

Формат строки: `- [ ] <id> — <страница> — что нужно (источник, если известен)`.
Claude отмечает: `- [~]` в работе, `- [x]` готово (+ id в library.json), `- [!]` нет исходника — нужен файл.

## Партия 1 (из REDESIGN-SPEC, раздел 11)

- [ ] cooking-lyusya — cooking.html — совместная готовка с Люсей (t.me/NEDOGONPOLYAA/8844)
- [ ] cooking-danya — cooking.html — кукинг с Даней (t.me/NEDOGONPOLYAA/9813)
- [ ] cooking-chat-menu — cooking.html — чат выбирает еду (t.me/NEDOGONPOLYAA/9204), результат (/8848)
- [ ] collab-funny-1 — collabs.html — один самый смешной совместный момент, короткий и понятный без контекста
- [ ] music-new-star-camp — music.html / sport.html — из присланного `assets/video/music/new-star-camp.mp4`: постер, проверка, при необходимости субтитры (позже — по просьбе пользователя)

## Просьбы друг к другу

(Если нужно изменить файл из чужой зоны — пишите сюда.)
