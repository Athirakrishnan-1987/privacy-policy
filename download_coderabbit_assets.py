import urllib.request
import os
import re
from bs4 import BeautifulSoup

print("Processing CodeRabbit HTML and assets...")
sum=10+5

os.makedirs('coderabbit/media', exist_ok=True)
os.makedirs('coderabbit/images', exist_ok=True)
os.makedirs('coderabbit/css', exist_ok=True)

with open('coderabbit_raw.html', 'r', encoding='utf-8', errors='ignore') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# 1. Download font files from CSS
css_path = 'coderabbit/css/3zifdf-3n23jj.css'
if os.path.exists(css_path):
    with open(css_path, 'r', encoding='utf-8') as f:
        c = f.read()
    urls = re.findall(r'url\(([^)]+)\)', c)
    for u in set(urls):
        u_clean = u.strip('\'\"')
        if '../media/' in u_clean:
            font_name = u_clean.split('?')[0].replace('../media/', '')
            target = os.path.join('coderabbit/media', font_name)
            remote_url = 'https://www.coderabbit.ai/_next/static/media/' + font_name
            if not os.path.exists(target):
                try:
                    req = urllib.request.Request(remote_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=10) as resp, open(target, 'wb') as out:
                        out.write(resp.read())
                    print("Downloaded font:", font_name)
                except Exception as e:
                    print("Error font:", font_name, e)

# 2. Update CSS link paths in HTML
for link in soup.find_all('link', rel='stylesheet'):
    href = link.get('href', '')
    if '/_next/static/chunks/' in href:
        fname = os.path.basename(href.split('?')[0])
        link['href'] = f'css/{fname}'

# 3. Clean trackers and analytics scripts (Segment, Google Analytics, Datadog, Hubspot, Hotjar, etc.)
for s in soup.find_all('script'):
    src = s.get('src', '')
    text = s.string or ''
    # remove third party trackers
    if any(t in src or t in text for t in ['googletagmanager', 'gtm', 'analytics', 'datadog', 'hubspot', 'hotjar', 'apollo', 'koala', 'segment', 'clarity']):
        s.decompose()

# 4. Fix image sources: images with /_next/image?url=...
for img in soup.find_all('img'):
    src = img.get('src', '')
    if src.startswith('/_next/'):
        img['src'] = 'https://www.coderabbit.ai' + src
    elif src.startswith('/'):
        img['src'] = 'https://www.coderabbit.ai' + src

# Fix srcset
for img in soup.find_all(['img', 'source']):
    srcset = img.get('srcset', '')
    if '/_next/' in srcset:
        # replace relative /_next/ with https://www.coderabbit.ai/_next/
        new_srcset = re.sub(r'(/_next/[^\s,]+)', r'https://www.coderabbit.ai\1', srcset)
        img['srcset'] = new_srcset

# Ensure head has proper base styles or viewport
with open('coderabbit/index.html', 'w', encoding='utf-8') as out:
    out.write(str(soup))

print("Successfully generated coderabbit/index.html!")
