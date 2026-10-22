import re

with open('coderabbit/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix relative css paths
content = re.sub(r'href=["\']css/', 'href="/coderabbit/css/', content)

with open('coderabbit/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated coderabbit/index.html CSS paths successfully!")
