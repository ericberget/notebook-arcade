#!/usr/bin/env python3
"""Bundle current game sources, without a server or third-party runtime."""
from pathlib import Path
import shutil
import re
root = Path(__file__).resolve().parents[1]
out = root / 'ios/SketchwaterPark/Web'
if out.exists(): shutil.rmtree(out)
for folder in ['games/splash-line', 'assets/fonts']:
    shutil.copytree(root / folder, out / folder, ignore=shutil.ignore_patterns('.*'))
(out / 'shared').mkdir(parents=True)
shutil.copy2(root / 'shared/fonts.css', out / 'shared/fonts.css')
shutil.copy2(root / 'favicon.svg', out / 'favicon.svg')
shutil.copy2(root / 'assets/student-desk-v1.webp', out / 'assets/student-desk-v1.webp')
html = out / 'games/splash-line/index.html'
text = html.read_text()
# Self-contained game only. External credit links can be opened deliberately in Safari.
csp = "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'"
text = text.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="' + csp + '">')
html.write_text(text)
# Catch accidental remote runtime dependencies and missing local HTML/CSS references.
for file in out.rglob('*'):
    if file.suffix not in ['.html', '.css']: continue
    source = file.read_text()
    refs = re.findall(r'(?:src|href)=["\']([^"\']+)', source) + re.findall(r'url\(["\']?([^\)"\']+)', source)
    for ref in refs:
        if ref.startswith(('data:', 'blob:', '#')): continue
        if ref.startswith('https://x.com/'): continue
        if ref.startswith(('http:', 'https:', '//')): raise SystemExit(f'Remote dependency: {ref}')
        if not (file.parent / ref.split('?')[0]).resolve().exists(): raise SystemExit(f'Missing asset: {file}: {ref}')
print(f'Bundled {sum(p.is_file() for p in out.rglob("*"))} offline files into {out}')
