# The artifact host wraps the published page in its own doctype/html/head/body,
# so turn each packaged index.html into body content: a <title> first, then
# <html>/<body> start tags (a parser merges their attributes onto the host's
# elements), the original head's children, then the original body's children.
# Also writes skeleton-test.html, the same content inside a stand-in skeleton,
# to test locally.  usage: python3 -I wrap.py <publishDir>
import re, sys, os
TITLES = {'a': 'Tactile Portfolio', 'b': 'Editorial Portfolio', 'c': 'Stage Portfolio'}
SKELETON = ('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style>'
            '</head><body>{}</body></html>')
pub = sys.argv[1]
for x, title in TITLES.items():
    t = open(os.path.join(pub, x, 'index.html'), encoding='utf-8').read()
    html_tag = re.search(r'<html([^>]*)>', t).group(1)
    head = re.search(r'<head[^>]*>(.*?)</head>', t, re.S).group(1)
    body_m = re.search(r'<body([^>]*)>(.*)</body>', t, re.S)
    head = re.sub(r'<title>.*?</title>', '', head, flags=re.S)
    head = re.sub(r'<meta charset="[^"]*"/?>', '', head)
    page = f'<title>{title}</title><html{html_tag}><body{body_m.group(1)}>{head}{body_m.group(2)}'
    open(os.path.join(pub, x, 'page.html'), 'w', encoding='utf-8').write(page)
    open(os.path.join(pub, x, 'skeleton-test.html'), 'w', encoding='utf-8').write(SKELETON.replace('{}', page, 1))
    print(x, len(page), page[:160].replace('\n', ' '))
