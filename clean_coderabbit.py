from bs4 import BeautifulSoup
import re

with open('coderabbit/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Remove all Next.js hydration and webpack/turbopack scripts that cause hydration failure
scripts_to_remove = []
for s in soup.find_all('script'):
    src = s.get('src', '')
    if '/_next/static/' in src or 'turbopack' in src or 'gtm' in src:
        scripts_to_remove.append(s)

print(f"Removing {len(scripts_to_remove)} Next.js chunk scripts to preserve static SSR DOM...")
for s in scripts_to_remove:
    s.decompose()

# Also remove script preloads
for l in soup.find_all('link', rel='preload'):
    if l.get('as') == 'script':
        l.decompose()

# Ensure CSS files are loaded with correct paths
# And ensure dark mode class is applied to html and body
if soup.html:
    classes = soup.html.get('class', [])
    if 'dark' not in classes:
        classes.append('dark')
        soup.html['class'] = classes
    soup.html['data-theme'] = 'dark'

if soup.body:
    # Ensure background-color is set
    soup.body['style'] = "background-color: #0d0d0f; color: #ffffff; min-height: 100vh;"

with open('coderabbit/index.html', 'w', encoding='utf-8') as f:
    f.write(str(soup))

print("Updated coderabbit/index.html! SSR DOM will now render cleanly without hydration wipe.")
