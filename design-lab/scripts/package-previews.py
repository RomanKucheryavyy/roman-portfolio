# Turn the lab's static export into three self-contained preview folders whose
# every URL is relative, so each runs from whatever path it is hosted at.
# usage: python3 -I package.py <exportDir> <outDir>
import os, re, shutil, sys
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
ASSETS = 'nx'  # the artifact host reserves top-level names starting with "_"

def rewrite_js(text):
    # Next finds its own prefix from the script URL (the path before /_next/);
    # with the folder renamed, every /_next/ in the runtime becomes /nx/.
    text = text.replace('/_next/', '/nx/')
    # The host refuses a literal U+FFFD; inside a JS string the escape is the same character.
    text = text.replace('\ufffd', '\\uFFFD')
    text = re.sub(r'(["\'(\s,])/images/projects/([a-z0-9-]+)\.png', r'\1./images/projects/\2.jpg', text)
    return re.sub(r'(["\'(\s,])/images/', r'\1./images/', text)

def rewrite(text):
    # Every /_next/ URL becomes ./nx/, and the Turbopack base below must
    # match, or chunks never register and the page silently never hydrates.
    text = re.sub(r'((?:src|href)=")/_next/', r'\1./nx/', text)
    # The inline React payload names chunks and stylesheets too (React
    # preloads them); point those at the same relative base.
    text = text.replace('\\"/_next/', '\\"./nx/').replace('"/_next/', '"./nx/')
    # Turbopack registers each chunk by its raw src attribute minus this base
    # (default "/_next/"); with relative srcs the base has to match them.
    text = re.sub(r'(<head[^>]*>)', r'\1<script>self.TURBOPACK_CHUNK_BASE_PATH="./nx/"</script>', text, count=1)
    text = re.sub(r'(["\'(\s,])/images/projects/([a-z0-9-]+)\.png', r'\1./images/projects/\2.jpg', text)
    text = re.sub(r'(\\")/images/projects/([a-z0-9-]+)\.png', r'\1./images/projects/\2.jpg', text)
    text = re.sub(r'(["\'(\s,])/images/', r'\1./images/', text)
    text = re.sub(r'(\\")/images/', r'\1./images/', text)
    return text

for x in 'abc':
    d = os.path.join(out, x)
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)
    html = open(os.path.join(src, f'{x}.html'), encoding='utf-8').read()
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(rewrite(html))
    for root, _, files in os.walk(os.path.join(src, '_next')):
        for f in files:
            p = os.path.join(root, f)
            rel = os.path.relpath(p, os.path.join(src, '_next'))
            q = os.path.join(d, ASSETS, rel)
            os.makedirs(os.path.dirname(q), exist_ok=True)
            if f.endswith(('.js', '.css')):
                open(q, 'w', encoding='utf-8').write((rewrite_js if f.endswith('.js') else rewrite)(open(p, encoding='utf-8').read()))
            else:
                shutil.copy(p, q)
    os.makedirs(os.path.join(d, 'images', 'projects'))
    shutil.copy(os.path.join(src, 'images', 'roman.jpg'), os.path.join(d, 'images', 'roman.jpg'))
    for f in os.listdir(os.path.join(src, 'images', 'projects')):
        im = Image.open(os.path.join(src, 'images', 'projects', f)).convert('RGB')
        im.save(os.path.join(d, 'images', 'projects', f.replace('.png', '.jpg')), quality=84, optimize=True, progressive=True)
    # Next's prefetch payloads (__next.*.txt) can't be published: their names
    # start with "_". A prefetch that misses only logs a 404.
    # C's globe fetches its map from jsDelivr; ship that file with the page.
    if x == 'c':
        shutil.copy(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'countries-110m.json'), d)
        for root, _, files in os.walk(os.path.join(d, ASSETS)):
            for f in files:
                if f.endswith('.js'):
                    q = os.path.join(root, f); t = open(q, encoding='utf-8').read()
                    if 'world-atlas@2/countries-110m.json' in t:
                        open(q, 'w', encoding='utf-8').write(t.replace('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json', './countries-110m.json'))
    left = [m for m in re.findall(r'(?:src|href)="/(?:_next|images)/[^"\']{0,40}', open(os.path.join(d, 'index.html'), encoding='utf-8').read())]
    n = sum(len(fs) for _, _, fs in os.walk(d))
    size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(d) for f in fs)
    print(x, 'files', n, 'size %.1fMB' % (size / 1e6), 'absolute refs left in html:', left[:3])
