# Как GPT и Claude работают над сайтом одновременно

Цель: GPT развивает функционал сайта, Claude параллельно готовит видео. Никто не ждёт другого
и не правит чужие файлы. Общаемся через файлы в репозитории — после `git pull` оба видят, что изменилось.

## 1. Кто за что отвечает

| Зона | Хозяин | Файлы |
| --- | --- | --- |
| Интерфейс и страницы | **GPT** | `index.html`, `gallery.html`, новые `*.html` (cooking, sport, cosplay…), `assets/*.css`, `assets/*.js`, кроме `story*` |
| Плеер и шаблоны страниц | **GPT** | общий модуль плеера, читает `content/media/library.json` |
| Готовые ролики | **Claude** | `assets/video/<topic>/<id>.mp4`, `<id>-poster.webp`, `<id>.ru.vtt` |
| Реестр готовых роликов | **Claude** | `content/media/library.json` |
| Истории стран | **Claude** | `story.html`, `assets/story.js`, `assets/story.css`, `assets/story-data.js`, `content/countries/` |
| Присланные исходники | общий | `content/media/uploads.json` — кто получил файл, тот и записывает |
| Очередь заказов | общий | `docs/MEDIA-QUEUE.md` |
| Правила | общий | `AGENTS.md`, этот файл |

Нужно изменить чужой файл — не правь молча: оставь строку в `docs/MEDIA-QUEUE.md` (раздел «Просьбы»).
Мелкая правка, без которой ломается сайт, допустима — с пояснением в сообщении коммита.

## 2. Как ролик попадает на сайт (без участия GPT)

1. GPT (или пользователь) пишет заказ в `docs/MEDIA-QUEUE.md`: какая страница, какой момент нужен.
2. Claude находит исходник, монтирует, делает постер и субтитры, проверяет воспроизведение.
3. Claude кладёт файлы в `assets/video/<topic>/` и добавляет запись в `content/media/library.json`.
4. Плеер GPT сам показывает записи с `"status": "published"` нужной темы. Никаких правок HTML не требуется.

Запись без файла или без проверки на сайте не показывается — никаких кнопок «Смотреть», которые не работают.

## 3. Формат `content/media/library.json`

```json
{
  "items": [
    {
      "id": "cooking-lyusya",
      "topic": "cooking",
      "title": "Кукинг с Люсей",
      "summary": "Одна фраза: что происходит и почему смешно.",
      "kind": "clip",
      "src": "assets/video/cooking/cooking-lyusya.mp4",
      "poster": "assets/video/cooking/cooking-lyusya-poster.webp",
      "captions": "assets/video/cooking/cooking-lyusya.ru.vtt",
      "durationSeconds": 38,
      "width": 1080, "height": 1920,
      "people": ["Люся"],
      "sourceUrl": "https://t.me/NEDOGONPOLYAA/8844",
      "sourceIn": "00:01:12", "sourceOut": "00:01:50",
      "music": "HoliznaCC0 — название трека (CC0)",
      "status": "published",
      "playbackCheckedOn": "2026-10-27"
    }
  ]
}
```

- `topic`: `cooking | editing | sport | snowboard | games | talks | cosplay | collabs | music | travel`.
- `kind`: `clip` (момент 10–45 с), `story` (смонтированная история 45–90 с), `loop` (беззвучный фон).
- `captions` и `music` — необязательны. Вертикальные ролики (`height > width`) показывать целиком, не обрезая лицо.
- `status`: `candidate → edited → published`. Плеер берёт только `published`.
- Пример выше — образец формата, не настоящая запись.

## 4. Технические правила для видео

- MP4: H.264 + AAC, `faststart`. Клип — до ~6 МБ, история — до ~12 МБ. Постер WebP до ~150 КБ.
- Музыка — только свободная (CC0 и подобные), без популярных песен.
- Большие исходники в Git не кладём: они на сервере de в `/root/private/nedogon-media/`.
- Только то, что Полина публиковала сама; без семьи, жилья и свежих мест (см. AGENTS.md).

## 5. Git

- Перед каждым пушем: `git pull --rebase origin main`. Коммиты маленькие, `[GPT]` / `[Claude]` в начале.
- Конфликт в общем файле — сохранить изменения обоих, не затирать.
- `push --force` запрещён.
