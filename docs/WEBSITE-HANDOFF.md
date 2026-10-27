# Сайт NEDOGONPOLYA — передача работы

Ветка: `main`. Статичный сайт без сборки и серверных зависимостей. `CNAME` сохранён. Пуш в `main` публикуется через существующий GitHub Pages. Перед работой выполнять `git pull origin main`, чтобы сохранить изменения другого агента.

## Что реализовано

Обновление знакомства с каналом: вместо повторяющейся бегущей строки — три быстрые ссылки на конкретные видео. Раздел «С чего начать» использует `assets/moments.js`, `moments-data.js`, `moments.css`: три тематические вкладки, шесть эпизодов с таймкодами, стрелки, свайп, случайный эпизод и переход к оригиналу. Переходы и наклон карточек выполнены через CSS 3D, без второго WebGL-рендера. Режим уменьшения движения сохраняется. Наклейка о фамилии стала ссылкой на её исходную публикацию.

Обновление атласа: `assets/atlas.js`, `atlas-globe.js`, `atlas-math.js`, `atlas-data.js`, `atlas.css`. Восемь стран, выбор по контуру или метке, плавное приближение и возврат камеры, диалоговая панель справа с каруселью фотографий. Шесть историй Claude подключены через `content/countries/cards.json`. Договор данных: `docs/COUNTRY-CARD-CONTRACT.md`. Старые `assets/globe.js` и `travel-data.js` остаются историческими файлами, но главная их больше не импортирует.

- Первый экран по референсу комнаты: художественный фон, крупная надпись NEDOGONPOLYA, приглашение на Twitch и Telegram.
- Знакомство с Полиной, её реальные фотографии из Telegram, спорт и форматы эфиров.
- Три видео с локально сохранёнными обложками и ссылками на оригиналы.
- Карта на Three.js: 14 географических точек, фильтр по годам, выбор меток и список, карточки историй, ссылки на первоисточники, вращение и перетаскивание.
- Совместные эфиры с LEVA2K, ENZZAI, Аней, Хетагом Хугаевым; отдельная карточка клипа Buster. Раздел не утверждает личную дружбу.
- Хронология, соцсети, диалог источников, мобильное меню.
- Анимации появления, движение фона, бегущая строка, подсветки и переходы. Поддержаны `prefers-reduced-motion` и кнопка отключения анимаций. Рендер глобуса приостановлен вне области просмотра; Three.js и текстуры подгружаются только перед появлением карты.

## Структура

- `index.html`, `assets/site.css`, `assets/app.js` — страница и её поведение.
- `assets/travel-data.js` — редакционные карточки и условные координаты центров городов/островов/стран. Это не адреса и не текущая геолокация. Дуги вымышленных маршрутов не рисуются.
- `assets/globe.js` — Three.js. Библиотека закреплена на версии 0.160.1 и сохранена локально.
- `assets/photos/sources.json` — источники фотографий и превью. Реальные фотографии не заменены сгенерированным лицом.
- `assets/images/room.webp` — сгенерированный фон комнаты, около 140 КБ.
- `docs/research/` — исследование и источники.

## Локальный запуск в PowerShell

Из корня проекта, с доступным Node.js:

```powershell
Get-Content tools/serve.cjs -Raw | node
```

Открыть `http://127.0.0.1:4173`. Можно использовать любой статический HTTP-сервер. Запуск через `file://` не подходит для ES-модулей.

Проверка данных, ссылок и файлов:

```powershell
Get-Content tools/check-site.mjs -Raw | node --input-type=module
```

С работающим локальным сервером можно добавить HTTP-проверку:

```powershell
$env:CHECK_HTTP='1'
Get-Content tools/check-site.mjs -Raw | node --input-type=module
```

Браузерный контроль был отклонён политикой инструмента: разрешение на локальный origin не выдано. Поэтому нет настоящих скриншотов страницы и подтверждения визуального вида/работы WebGL в браузере. Требуется визуально посмотреть desktop/mobile, вращение, выбор меток, меню и диалог источников перед слиянием. Концепт изображения не выдаётся за скриншот реализации.

## Материалы и лицензии

Фотографии и видео связаны с открытыми публикациями автора; пользователь сообщил о разрешении Полины на материалы и прямо попросил использовать её фотографии. Сайт обозначен как фан-проект. Окончательный показ и согласование с Полиной — до запуска.

Manrope взят из google/fonts, лицензия `assets/fonts/OFL.txt`. Three.js MIT — `assets/vendor/THREE-LICENSE.txt`. Текстуры Земли взяты из публичных примеров Three.js: `https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg` и `https://threejs.org/examples/textures/planets/earth_lights_2048.png`; библиотека — `https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.min.js`.

## Промпт сгенерированного фона

Инструмент: встроенный ImageGen. Использован предоставленный пользователем референс комнаты. Смысл промпта: широкая фотореалистичная вечерняя стримерская, справа большое окно с вымышленным ночным городом и тёмное кресло, кремовые шторы, цветы и фигурки, белая лампа-сердце с локальным сиреневым светом; слева тёмное пространство для заголовка. Без людей, текста, логотипов, рекламы, донатов, интерфейса плеера и общего фиолетового градиента. Это художественное изображение по референсу.


## Streaming formats — 27 October 2026
Replaced #what with audience snapshot, cooking/sports editorial image cards, Isolation project poster, and source-linked cosplay/guest entries. Header now links to Эфиры. All source/provenance and image prompts are in assets/img/formats/sources.json. Cooking and sports illustrations are generated from user-approved Polina portraits; they describe formats, not specific past events. Per user instruction, no visible AI labels on these cards. Isolation image is user-supplied staged project art. Audience figures are a rounded dated snapshot, not live counters. Images are local lazy-loaded WebP. CSS hover/reveal motion respects the existing pause control and reduced motion. No new WebGL contexts or embeds. Browser visual QA unavailable because earlier browser-origin access was declined; source and HTTP checks only.


## Interests — 27 October 2026
Added #interests after streaming formats: music/festivals, self-edited videos and a personal blog, snowboard progress. Native details/summary keeps stories compact and keyboard accessible; no new JS/media. Primary creator sources: Telegram /9353 (festival response), /4461 (concert), /9245 (editing), /9249 (blog), /3574 (India edit), /8900 (first snowboard jump), /8897 (snowboard day). Only hobbies and public creative work; no routes or residence information added.

## Cooking and Twitch highlights — 27 October 2026
Expanded cooking into a source-linked three-part story: audience chooses food (/9204), guests Lyusya and Dania (/8844, /9813), result post (/8848). No invented recipe or funny incident. Added three Twitch clips selected from creator's own Telegram collections /7186 (yoga with Kris) and /8681 (snow IRL). Captions use source labels; playback content could not be reviewed via web tooling.
New stream-player.js loads official Twitch clip/channel iframe only after clicking a source anchor. parent is current hostname, autoplay=false. Native dialog supplies Escape/focus behavior; iframe is removed on close. Permanent external link fallback and external-only viewing below Twitch minimum 400px width. Live channel button does not claim channel is online. No third-party scripts or iframe requests at initial page load. URL-building tests cover clips, live channel, parent and invalid identifiers; no browser playback QA due earlier declined browser permission. Embed reference: https://dev.twitch.tv/docs/embed/video-and-clips/ .

## Redesign specification — 27 October 2026
See docs/REDESIGN-SPEC.md for the user-requested staged plan: guided chapters, redesigned navigation, local media, topic pages, cosplay/album collections, visual motion rules, dependencies and acceptance. Planning-only change; no interface or media changed in this commit. First implementation priority: unavailable clip audit and visitor route, then local player and cooking template. Existing country stories remain intact.

## Playful scroll guide — 27 October 2026
Added assets/polya-guide.js/css and #polya-guide. Trigger: actual wheel/touch/scroll-key input, net scroll >=2.4 viewports crossing >=2 chapter boundaries in <=2.6s; opens 700ms after scrolling stops. Initial-load and anchor/menu navigation cooldowns, no interruption during open dialogs/menu or playing HTML5 video. Once per tab session via sessionStorage; graceful in-memory fallback. Full-screen portrait, edge fog and slow non-strobing SVG lightning, typed headline then action reveal. Native dialog Escape and immediate close remain available while text animates. Reduced motion skips typing/effects. Show chapters opens illustrated internal links; dismiss restores scroll, chapter choice navigates without restoring old scroll. No claim that a section has been read.
Preview URL: https://nedogon-polya.ru/?polya=preview (explicitly bypasses once-per-session gate; no need to scroll). Portrait loads only when dialog opens; preview images when chapters open. Logic threshold checks and resource/HTTP checks performed; browser animation/focus/touch QA remains pending because earlier browser-origin access was declined. No changes to Claude-owned country story/media files.
