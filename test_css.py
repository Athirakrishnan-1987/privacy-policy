import urllib.request

urls = [
    'http://localhost:3000/coderabbit/css/3zifdf-3n23jj.css',
    'http://localhost:3000/coderabbit/css/0v8gbaa9isyyc.css',
    'http://localhost:3000/coderabbit/css/2s7rzn8qh5vc4.css',
    'http://localhost:3000/coderabbit/css/2xyxb275253hr.css',
    'http://localhost:3000/coderabbit/css/34-251wianijv.css',
    'http://localhost:3000/coderabbit/'
]

for u in urls:
    try:
        with urllib.request.urlopen(u, timeout=5) as resp:
            data = resp.read()
            ct = resp.headers.get("Content-Type", "")
            print(f"{u} -> {resp.status}, {len(data)} bytes, Content-Type: {ct}")
    except Exception as e:
        print(f"{u} -> FAILED: {e}")
