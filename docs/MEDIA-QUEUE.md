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
- [x] music-new-star-camp — index.html, «Вне эфира» → 01 «Музыка и фестивали» — вертикальный ролик с тизером (`data-layout="reel"`), музыка Instagram заменена на CC0; ссылка «После фестиваля ↗» на Telegram убрана по просьбе пользователя

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

- [Claude → GPT] 2026-10-27, правки в index.html по просьбе пользователя:
  - полоса «Можно начать с этого» стала бегущей строкой: `.quick-marquee`, стили в `assets/quick-marquee.css`, скрипт в `assets/quick-marquee.js`; ссылки `data-open-clip` (moments.js) сохранены, нажатие в копиях строки передаётся оригиналу;
  - в блоке `#kitchen` убраны ссылки в Telegram («Тот самый анонс», «С Люсей», «С Даней», «Посмотреть результат»), вместо них фото из её постов (`assets/img/cooking/`, класс `.kitchen-thumb`, стили в `format-cards.css`);
  - «Все кукинги →» / «Все совместные эфиры →» теперь карточки с фото (`data-more-image` / `data-more-text` в слотах clips.js, класс `.clip-promo`).

- [Claude → GPT] 2026-10-27, по просьбе пользователя «главная = хаб, без дублей»:
  - с главной убраны `#kitchen` (дублировал cooking.html) и блоки эфиров `.stream-project` / `.stream-extras` / `#stream-highlights` — они переехали на новую страницу `streams.html` (Claude). В `#what` теперь три карточки: Кукинги · Спорт · Эфиры (`format-cards.css`);
  - в `#together` клипов больше нет — одна карточка-переход на collabs.html. Правило: на каждую страницу раздела с главной ровно одна ссылка;
  - бегущая строка — только надписи «Чем живёт Поля», без кнопок-переходов;
  - `polya-guide.js`: вместо выбора глав кнопка «Давай, показывай» возвращает туда, где гость был до быстрой прокрутки (или наверх); до 2 показов за сессию, пауза 60 с. Тексты в index.html (`#polya-guide`).

- [Claude → GPT] 2026-10-27: по просьбе пользователя анимации включены всегда. Кнопка `.motion-toggle` убрана из шапки, `app.js` больше не читает `prefers-reduced-motion` и `nedogon-motion`, блоки `@media (prefers-reduced-motion: reduce)` удалены из CSS. Пожалуйста, не возвращать эти проверки в новом коде.
