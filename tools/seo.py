#!/usr/bin/env python3
"""Поиск и индексация (зона Claude): вставляет в <head> каждой страницы блок между
<!-- seo:start --> и <!-- seo:end --> и пересобирает sitemap.xml.

В блоке: canonical, Open Graph с абсолютными адресами, картинка-превью JPG, иконки PNG,
микроразметка schema.org (кто такая Полина и где её каналы), подтверждения Яндекса и Google.
Заголовки и описания страниц — GPT, этот скрипт их не трогает.

Запуск после любой правки страниц:  python3 tools/seo.py
"""
import json
import re
import subprocess
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://nedogon-polya.ru'
# коды подтверждения из Яндекс Вебмастера и Google Search Console (пусто — тег не ставим)
VERIFY = {'yandex-verification': 'a65a26c646360cb8', 'google-site-verification': 'HrWOWDos6N7Z4bgDcoT11PyUf5WXKbtQWFe1nZRf7tg'}

PERSON = {
    '@type': 'Person',
    '@id': f'{SITE}/#person',
    'name': 'Полина Недогон',
    'alternateName': ['NEDOGONPOLYA', 'nedogonpolya', 'Поля Недогон', 'Недогон Поля', 'Nedogon Polya', 'Polina Nedogon'],
    'description': 'IRL-стример на Twitch: разговоры с чатом, кукинги, спорт и путешествия.',
    'jobTitle': 'Стример',
    'url': f'{SITE}/',
    'image': f'{SITE}/assets/og-image.jpg',
    'sameAs': [
        'https://www.twitch.tv/nedogonpolya',
        'https://t.me/NEDOGONPOLYAA',
        'https://www.youtube.com/@NEDOGONPOLYA2',
        'https://www.youtube.com/@NEDOGONPOLYAA',
        'https://www.instagram.com/_nedogon/',
    ],
}
WEBSITE = {
    '@type': 'WebSite',
    '@id': f'{SITE}/#site',
    'url': f'{SITE}/',
    'name': 'NEDOGONPOLYA',
    'alternateName': ['Полина Недогон', 'nedogonpolya', 'Недогон Поля'],
    'inLanguage': 'ru-RU',
    'about': {'@id': f'{SITE}/#person'},
}

# страницы для поиска: файл → (адрес, раздел для «хлебных крошек», приоритет в sitemap)
PAGES = {
    'index.html': ('/', None, '1.0'),
    'streams.html': ('/streams.html', 'Эфиры', '0.8'),
    'cooking.html': ('/cooking.html', 'Кукинги', '0.8'),
    'sport.html': ('/sport.html', 'Спорт', '0.7'),
    'collabs.html': ('/collabs.html', 'Гости и коллабы', '0.7'),
    'story.html': ('/story.html', 'Истории путешествий', '0.7'),
    'gallery.html': ('/gallery.html', 'Фотоальбом', '0.6'),
}
# прототипы магазина — не для поиска
HIDDEN = ['wardrobe.html', 'sneakers.html']

START, END = '<!-- seo:start -->', '<!-- seo:end -->'


def meta(html, name, attr='name'):
    m = re.search(rf'<meta {attr}="{re.escape(name)}" content="([^"]*)"', html)
    return m.group(1) if m else ''


def block(file, html):
    if file in HIDDEN:
        return f'{START}<meta name="robots" content="noindex, nofollow">{END}'
    path, crumb, _ = PAGES[file]
    url = SITE + path
    title = re.search(r'<title>([^<]*)</title>', html).group(1)
    desc = meta(html, 'description')
    page = {'@type': 'WebPage', '@id': f'{url}#page', 'url': url, 'name': title, 'description': desc,
            'inLanguage': 'ru-RU', 'isPartOf': {'@id': f'{SITE}/#site'}, 'about': {'@id': f'{SITE}/#person'}}
    graph = [WEBSITE, PERSON, page] if file == 'index.html' else [page]
    if crumb:
        graph.append({'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'NEDOGONPOLYA', 'item': f'{SITE}/'},
            {'@type': 'ListItem', 'position': 2, 'name': crumb, 'item': url},
        ]})
    tags = [
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:url" content="{url}">',
        '<meta property="og:site_name" content="NEDOGONPOLYA">',
        '<meta property="og:locale" content="ru_RU">',
        f'<meta property="og:image" content="{SITE}/assets/og-image.jpg">',
        '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="icon" href="assets/favicon-120.png" type="image/png" sizes="120x120">',
        '<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">',
        *[f'<meta name="{k}" content="{v}">' for k, v in VERIFY.items() if v],
        '<script type="application/ld+json">' + json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':')) + '</script>',
    ]
    return START + ''.join(tags) + END


def apply(file):
    p = ROOT / file
    html = p.read_text(encoding='utf-8')
    html = re.sub(re.escape(START) + '.*?' + re.escape(END), '', html, flags=re.S)
    # старая превьюшка webp — заменяем на JPG из блока (её понимают все мессенджеры и поисковики)
    html = re.sub(r'<meta property="og:image" content="[^"]*">', '', html)
    new = html.replace('</head>', block(file, html) + '</head>', 1)
    if new != p.read_text(encoding='utf-8'):
        p.write_text(new, encoding='utf-8')
        print('обновлён', file)


def lastmod(file):
    out = subprocess.run(['git', 'log', '-1', '--format=%cs', '--', file], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    return out or date.today().isoformat()


def sitemap():
    rows = [f'  <url><loc>{SITE}{path}</loc><lastmod>{lastmod(f)}</lastmod><priority>{prio}</priority></url>'
            for f, (path, _, prio) in PAGES.items()]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(rows) + '\n</urlset>\n'
    (ROOT / 'sitemap.xml').write_text(xml, encoding='utf-8')
    print('sitemap.xml:', len(rows), 'страниц')


if __name__ == '__main__':
    for f in [*PAGES, *HIDDEN]:
        apply(f)
    sitemap()
