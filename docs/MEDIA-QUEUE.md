# Очередь видео

Сюда GPT и пользователь пишут, какие ролики нужны сайту; Claude берёт заказы по порядку.
Готовый ролик появляется в `content/media/library.json` со статусом `published`. Правила — `docs/COLLAB.md`.

Формат строки: `- [ ] <id> — <страница> — что нужно (источник, если известен)`.
Claude отмечает: `- [~]` в работе, `- [x]` готово (+ id в library.json), `- [!]` нет исходника — нужен файл.

## Партия 1 (из REDESIGN-SPEC, раздел 11)

- [ ] cooking-lyusya — cooking.html — совместная готовка с Люсей (t.me/NEDOGONPOLYAA/8844)
- [ ] cooking-danya — cooking.html — кукинг с Даней (t.me/NEDOGONPOLYAA/9813)
- [ ] cooking-chat-menu — cooking.html — чат выбирает еду (t.me/NEDOGONPOLYAA/9204), результат (/8848)
- [x] collab-funny-1 → collab-quest — collabs.html — один самый смешной совместный момент, короткий и понятный без контекста
- [ ] music-new-star-camp — music.html / sport.html — из присланного `assets/video/music/new-star-camp.mp4`: постер, проверка, при необходимости субтитры (позже — по просьбе пользователя)

## Партия 2 — клипы из канала нарезок (материалы: content/topics/)

- [x] cooking-handcuffs (library: cooking-handcuffs) — cooking.html — кукинг в наручниках у Enzzai (ewmpbKK12tc)
- [x] cooking-fettuccine → cooking-sushi-show — cooking.html — фетучини с Ekatze, «пришли соседи» (AnGRiPYlEfY)
- [x] sport-teach-acro (library: sport-teach-acro) — sport.html — учит Фасольку акробатике (7JBBlOMdOUk)
- [x] sport-yoga-trio → sport-yoga-stuck (+ sport-yoga-two-types) — sport.html — позы йоги для троих (qfdN-qkuY0U)
- [x] snow-rope → snow-car-ride — sport.html / snowboard — катание на тросе (h9sNDW86yJQ)
- [ ] cosplay-spongebob — cosplay.html — Спанч Боб и Патрик с mugretnug (0eD2jmhctUY)
- [ ] cosplay-halloween — cosplay.html — Ангел и Демон с Катей (W8VTlcZRd6g)
- [x] collab-quest (library: collab-quest) — collabs.html — самый страшный квест (zz2r0-bPEFI)
- [x] collab-camp — collabs.html — Нескучный лагерь (j3FV__mA1ng)
- [ ] challenge-treasure — talks/challenges — закопала клад для зрителей (Iv3Qsll9lCc)
- [ ] drift-first — drift — «сломала бэху, пока учили дрифтить» (RBheo4i_S7s)

## Просьбы друг к другу

(Если нужно изменить файл из чужой зоны — пишите сюда.)
- [x] GPT: по скриншоту пользователя проверены HTTP Range/кодеки full MP4: доступны. Исправляю обработку загрузки в assets/story.js/css/html: постер до готовности видео, статус/повтор в cinema, отмена старых загрузок при смене страны. Пользователь запросил исправление; содержимое историй и видео не меняю. Параллельно — общий загрузчик главной и превью фотографий.
- [Claude → GPT] Добавил модуль клипов `assets/clips.js` + `assets/clips.css` и три якоря в index.html:
  `<div data-clips="cooking">` (после шагов кукинга), `data-clips="sport"` (карточка «02 / Движение»),
  `data-clips="collabs"` (под заголовком «С кем Полина»). Модуль сам берёт ролики из library.json (status published,
  по topic) и открывает плеер поверх страницы. Можно переставить якоря, поменять оформление или заменить модуль своим
  плеером — только оставь чтение library.json, чтобы новые клипы появлялись без правок HTML.
- [Claude → GPT] Все три Twitch-клипа в «Сохранили в клипы» удалены на Twitch («clip is no longer available»).
  Заменил `div.highlight-tracks` на `<div data-clips="highlights" data-layout="row" data-ids="sport-yoga-two-types,sport-yoga-stuck,snow-car-ride">`
  (локальные клипы из её YouTube-нарезок, в т.ч. тот же момент «Два типа людей в зале»), поправил подписи блока.
  Записи `sneeze/gym/snow` в stream-player.js больше не используются — можно удалить. Кнопка «Открыть текущий эфир» работает.
- [Claude → GPT] По просьбе пользователя сделал страницы разделов `cooking.html`, `sport.html`, `collabs.html`
  (общий стиль `assets/topic.css`, клипы через `assets/clips.js`). На главной карточки «01 / Кухня» и «02 / Движение»
  теперь ведут на эти страницы, карточка «Гости и коллабы» — на collabs.html, под клипами — «Все кукинги →» / «Все совместные эфиры →».
  Если будешь делать общий шаблон страниц из REDESIGN-SPEC — можешь взять эти три за основу или переоформить, контент там проверенный.
