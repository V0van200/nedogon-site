# Магазин и гардеробная Поли

Отдельный сохранённый прототип. Основной сайт продолжаем развивать независимо.

- [Фотопримерочная](https://nedogon-polya.ru/wardrobe.html)
- [3D-кроссовки](https://nedogon-polya.ru/sneakers.html)
- [Скачать исходники магазина ZIP](nedogon-shop-source-v1.zip)

## Где исходники в репозитории

| Часть | Файлы |
| --- | --- |
| Гардеробная | `wardrobe.html`, `assets/wardrobe.css`, `assets/wardrobe.js`, `assets/wardrobe-data.js` |
| 3D-витрина | `sneakers.html`, `assets/sneakers.css`, `assets/sneaker-viewer.js`, `assets/sneaker-data.js` |
| Геометрия и экспорт | `assets/shoe-model.js`, `assets/shoe-profile.js`, `assets/shoe-glb.js` |
| Подготовленные модели | `assets/models/*.glb` |
| Фото и образы | `assets/img/wardrobe/`, `assets/img/sneakers/` |
| Сборка и проверки моделей | `tools/build-shoe-models.mjs`, `tools/check-shoes.mjs` |
| Библиотека и шрифт | `assets/vendor/`, `assets/fonts/` с лицензиями |

ZIP — самостоятельный снимок версии от 27 октября 2026. Внутри сохранены структура каталогов, код, изображения, модели, локальные зависимости и сервер предпросмотра. Последующие изменения живых страниц не обновляют этот архив автоматически.

После распаковки запустить HTTP-сервер из корня папки (нужен Node.js): `node tools/serve.cjs`, затем открыть `http://127.0.0.1:4173/wardrobe.html`.

Фотопримерочная переключает подготовленные образы. 3D-витрина использует процедурные модели обуви и нейтральный манекен ног; 3D-модели Поли и расчёта посадки здесь нет. Модели по фото приблизительные. Размеры, наличие и цены уточняются в магазине.
