#!/usr/bin/env python3
"""Сообщает Яндексу (и Bing) по протоколу IndexNow, что страницы обновились — переобход за минуты, а не за недели.
Запуск после публикации:  python3 tools/indexnow.py            — все страницы из sitemap.xml
                          python3 tools/indexnow.py /cooking.html  — только указанные"""
import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOST = 'nedogon-polya.ru'
KEY = 'a8f3519657649796b3d89d702c39bd51'  # тот же ключ лежит в корне сайта: /a8f3519657649796b3d89d702c39bd51.txt — так поисковик проверяет, что сайт наш


def main():
    if len(sys.argv) > 1:
        urls = [f'https://{HOST}{p}' for p in sys.argv[1:]]
    else:
        urls = re.findall(r'<loc>([^<]+)</loc>', (ROOT / 'sitemap.xml').read_text(encoding='utf-8'))
    body = json.dumps({'host': HOST, 'key': KEY, 'keyLocation': f'https://{HOST}/{KEY}.txt', 'urlList': urls}).encode()
    for endpoint in ['https://yandex.com/indexnow', 'https://api.indexnow.org/indexnow']:
        req = urllib.request.Request(endpoint, data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                print(endpoint, res.status, len(urls), 'адресов')
        except Exception as e:  # поисковик может ответить 4xx, если ключ ещё не виден — повторить через пару минут
            print(endpoint, 'ошибка:', e)


if __name__ == '__main__':
    main()
