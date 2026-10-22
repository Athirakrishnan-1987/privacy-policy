import shutil
import re
import os

print("Setting CodeRabbit as root index.html...")

# 1. Backup CodeAnt if not already backed up
if not os.path.exists('codeant.html'):
    shutil.copyfile('index.html', 'codeant.html')
    print("Backed up CodeAnt to codeant.html")

# 2. Read CodeRabbit HTML
with open('coderabbit/index.html', 'r', encoding='utf-8') as f:
    cr_html = f.read()

# Make CSS links relative so they work both locally and in root
cr_html = re.sub(r'href=["\'](?:/coderabbit)?/css/', 'href="css/', cr_html)

# Ensure html tag has class="dark" and data-theme="dark"
if not 'class="dark"' in cr_html:
    cr_html = cr_html.replace('<html ', '<html class="dark" data-theme="dark" ')

# Write to root index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(cr_html)

# Also update coderabbit/index.html
with open('coderabbit/index.html', 'w', encoding='utf-8') as f:
    f.write(cr_html)

print("Successfully set CodeRabbit as root index.html!")
