const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const NAVBAR_INTERACTION_SCRIPT = `
<script id="cr-page-interactivity">
document.addEventListener('DOMContentLoaded', () => {
  // Sticky Header with Glassmorphism Backdrop Blur
  const header = document.querySelector('header.site-header-root');
  if (header) {
    const onScroll = () => {
      const stuck = window.scrollY > 24;
      header.setAttribute('data-header-stuck', stuck ? 'true' : 'false');
      if (stuck) {
        header.style.backgroundColor = 'rgba(13, 13, 15, 0.85)';
        header.style.backdropFilter = 'blur(12px)';
        header.style.webkitBackdropFilter = 'blur(12px)';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
        header.style.transition = 'background-color 0.2s ease, border-color 0.2s ease';
      } else {
        header.style.backgroundColor = 'transparent';
        header.style.backdropFilter = 'none';
        header.style.webkitBackdropFilter = 'none';
        header.style.borderBottom = 'none';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Header Dropdown triggers
  const navTriggers = document.querySelectorAll('.site-header-nav-trigger');
  navTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
      navTriggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
      trigger.setAttribute('aria-expanded', (!isExpanded).toString());
    });
  });

  document.addEventListener('click', () => {
    navTriggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
  });

  // Pricing Plan Toggles (Annual vs Monthly)
  const billingButtons = document.querySelectorAll('[aria-label="Billing period"] button, [role="tablist"] button');
  billingButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      if (parent) {
        parent.querySelectorAll('button').forEach(b => {
          b.setAttribute('aria-pressed', 'false');
          b.classList.remove('bg-cui-base-2', 'text-cui-primary');
          b.classList.add('text-cui-tertiary');
        });
      }
      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('bg-cui-base-2', 'text-cui-primary');
      btn.classList.remove('text-cui-tertiary');
    });
  });
});
</script>
`;

function proxyAndCache(req, res, targetUrl, cacheFilePath) {
  const parsed = new URL(targetUrl);
  const options = {
    hostname: parsed.hostname,
    port: 443,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*'
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300 && cacheFilePath) {
      try {
        fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
        const fileStream = fs.createWriteStream(cacheFilePath);
        fileStream.on('error', (err) => console.error('Cache write stream error:', err.message));
        proxyRes.pipe(fileStream);
      } catch (e) {}
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', targetUrl, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Proxy Error');
    }
  });

  proxyReq.end();
}

function fetchAndCleanHtml(pageSlug, callback) {
  const targetUrl = `https://www.coderabbit.ai${pageSlug}`;
  const options = {
    hostname: 'www.coderabbit.ai',
    port: 443,
    path: pageSlug,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  };

  https.get(options, (resp) => {
    if (resp.statusCode !== 200) {
      return callback(new Error(`Upstream returned status ${resp.statusCode} for ${targetUrl}`));
    }

    let raw = '';
    resp.setEncoding('utf8');
    resp.on('data', chunk => raw += chunk);
    resp.on('end', () => {
      try {
        let cleaned = raw;
        // Strip Next.js chunks that break static SSR hydration
        cleaned = cleaned.replace(/<script[^>]*src=["'][^"']*\/_next\/static\/chunks\/[^"']*["'][^>]*><\/script>/gi, '');
        cleaned = cleaned.replace(/<script[^>]*turbopack[^>]*><\/script>/gi, '');
        cleaned = cleaned.replace(/<link[^>]*rel=["']preload["'][^>]*as=["']script["'][^>]*>/gi, '');

        // Ensure dark theme
        if (!cleaned.includes('data-theme="dark"')) {
          cleaned = cleaned.replace(/<html\b([^>]*)>/i, '<html $1 class="dark" data-theme="dark">');
        }
        if (!cleaned.includes('min-height: 100vh')) {
          cleaned = cleaned.replace(/<body\b([^>]*)>/i, '<body $1 style="background-color: #0d0d0f; color: #ffffff; min-height: 100vh;">');
        }

        // Inject page interactivity
        cleaned = cleaned.replace('</body>', `${NAVBAR_INTERACTION_SCRIPT}</body>`);

        // Cache locally for instant subsequent loads
        const fileBase = pageSlug.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '_');
        const savePath = path.join(__dirname, `${fileBase}.html`);
        fs.writeFile(savePath, cleaned, 'utf8', () => {});

        callback(null, cleaned);
      } catch (err) {
        callback(err);
      }
    });
  }).on('error', err => callback(err));
}

const server = http.createServer((req, res) => {
  let reqUrl = decodeURIComponent(req.url.split('?')[0]);

  // 1. Next.js assets, SVGs, images, fonts proxying & caching from CodeRabbit
  const proxyPrefixes = ['/_next/', '/redesign/', '/press-kit/', '/images/', '/content/', '/favicon'];
  if (proxyPrefixes.some(prefix => reqUrl.startsWith(prefix))) {
    let localFile = path.join(__dirname, reqUrl);
    if (reqUrl.startsWith('/_next/image')) {
      const hash = crypto.createHash('md5').update(req.url).digest('hex');
      localFile = path.join(__dirname, '_next', 'image_cache', `${hash}.webp`);
    }

    // Check if asset exists directly at path
    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
      });
      fs.createReadStream(localFile).pipe(res);
      return;
    }

    // Check css/ directory fallback for /_next/static/chunks/*.css
    const baseName = path.basename(reqUrl);
    const cssLocal = path.join(__dirname, 'css', baseName);
    if (fs.existsSync(cssLocal) && fs.statSync(cssLocal).isFile()) {
      res.writeHead(200, {
        'Content-Type': 'text/css; charset=UTF-8',
        'Cache-Control': 'public, max-age=31536000'
      });
      fs.createReadStream(cssLocal).pipe(res);
      return;
    }

    // Check media/ directory fallback for fonts
    const mediaLocal = path.join(__dirname, 'media', baseName);
    if (fs.existsSync(mediaLocal) && fs.statSync(mediaLocal).isFile()) {
      const ext = path.extname(mediaLocal).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'font/woff2',
        'Cache-Control': 'public, max-age=31536000'
      });
      fs.createReadStream(mediaLocal).pipe(res);
      return;
    }

    const remoteUrl = 'https://www.coderabbit.ai' + req.url;
    proxyAndCache(req, res, remoteUrl, localFile);
    return;
  }

  // 2. ROOT: localhost:3000/ shows CodeRabbit homepage
  if (reqUrl === '/' || reqUrl === '' || reqUrl === '/coderabbit' || reqUrl === '/coderabbit/') {
    const indexPath = path.join(__dirname, 'index.html');
    fs.readFile(indexPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading CodeRabbit page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(content);
    });
    return;
  }

  // 3. CodeAnt AI route at /codeant or /codeant.html
  if (reqUrl === '/codeant' || reqUrl === '/codeant/' || reqUrl === '/codeant.html') {
    const codeantPath = path.join(__dirname, 'codeant.html');
    fs.readFile(codeantPath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading CodeAnt page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(content);
    });
    return;
  }

  // 4. CodeRabbit Subpages (e.g., /customers, /pricing, /contact-us, /security, /enterprise)
  // Strip optional /coderabbit/ prefix and trailing slash
  let cleanRoute = reqUrl.replace(/^\/coderabbit\/?/, '/').replace(/\/$/, '');
  if (!cleanRoute.startsWith('/')) cleanRoute = '/' + cleanRoute;

  // Candidate file paths for HTML pages
  const candidateHtmlFiles = [
    path.join(__dirname, `${cleanRoute}.html`),
    path.join(__dirname, 'coderabbit', `${cleanRoute}.html`),
    path.join(__dirname, cleanRoute, 'index.html'),
    path.join(__dirname, 'coderabbit', cleanRoute, 'index.html'),
    path.join(__dirname, cleanRoute)
  ];

  for (const candidate of candidateHtmlFiles) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && (candidate.endsWith('.html') || !path.extname(candidate))) {
      fs.readFile(candidate, (err, content) => {
        if (!err) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        } else {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading page');
        }
      });
      return;
    }
  }

  // 5. If it's a subpage request without a file extension (e.g. /customers, /pricing, /contact-us),
  // dynamically fetch and clean from CodeRabbit and cache locally!
  if (!path.extname(reqUrl)) {
    fetchAndCleanHtml(cleanRoute, (err, cleanedHtml) => {
      if (!err && cleanedHtml) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(cleanedHtml);
      } else {
        // Fallback: Default to index.html (CodeRabbit)
        fs.readFile(path.join(__dirname, 'index.html'), (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
          res.end(content);
        });
      }
    });
    return;
  }

  // 6. Resolve other static files (css/, media/, js/, etc.)
  let filePath = path.join(__dirname, reqUrl);

  if (!fs.existsSync(filePath)) {
    const inCr = path.join(__dirname, 'coderabbit', reqUrl);
    if (fs.existsSync(inCr) && fs.statSync(inCr).isFile()) {
      filePath = inCr;
    }
  }

  // Check font fallbacks for /media/ or .woff2
  if (!fs.existsSync(filePath) && (reqUrl.includes('/media/') || reqUrl.endsWith('.woff2'))) {
    const fontName = path.basename(reqUrl);
    const crFont = path.join(__dirname, 'media', fontName);
    if (fs.existsSync(crFont)) {
      filePath = crFont;
    }
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` CodeRabbit AI Multi-Page Server Running:`);
  console.log(` -> Homepage:   http://localhost:${PORT}/`);
  console.log(` -> Customers:  http://localhost:${PORT}/customers`);
  console.log(` -> Pricing:    http://localhost:${PORT}/pricing`);
  console.log(` -> Contact Us: http://localhost:${PORT}/contact-us`);
  console.log(` -> Security:   http://localhost:${PORT}/security`);
  console.log(` -> Enterprise: http://localhost:${PORT}/enterprise`);
  console.log(` (CodeAnt AI available at: http://localhost:${PORT}/codeant)`);
  console.log(`======================================================\n`);
});
