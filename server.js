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
        proxyRes.pipe(fileStream);
      } catch (e) {}
    }

    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', targetUrl, err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error');
  });

  proxyReq.end();
}

const server = http.createServer((req, res) => {
  let reqUrl = decodeURIComponent(req.url.split('?')[0]);

  // 1. Next.js assets, SVGs, images proxying & caching from CodeRabbit
  const proxyPrefixes = ['/_next/', '/redesign/', '/press-kit/', '/images/', '/content/', '/favicon'];
  if (proxyPrefixes.some(prefix => reqUrl.startsWith(prefix))) {
    let localFile = path.join(__dirname, reqUrl);
    if (reqUrl.startsWith('/_next/image')) {
      const hash = crypto.createHash('md5').update(req.url).digest('hex');
      localFile = path.join(__dirname, '_next', 'image_cache', `${hash}.webp`);
    }

    if (fs.existsSync(localFile) && fs.statSync(localFile).isFile()) {
      const ext = path.extname(localFile).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'image/webp',
        'Cache-Control': 'public, max-age=31536000'
      });
      fs.createReadStream(localFile).pipe(res);
      return;
    }
    const remoteUrl = 'https://www.coderabbit.ai' + req.url;
    proxyAndCache(req, res, remoteUrl, localFile);
    return;
  }

  // 2. ROOT: localhost:3000/ shows CodeRabbit directly!
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

  // 3. CodeAnt route at /codeant or /codeant.html
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

  // 4. Resolve static files (css/, media/, etc.)
  let filePath = path.join(__dirname, reqUrl);

  // Check if file exists in coderabbit subfolder as fallback
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
      // Fallback: Default to index.html (CodeRabbit)
      const indexPath = path.join(__dirname, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
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
  console.log(` CodeRabbit AI Running on Root:`);
  console.log(` -> http://localhost:${PORT}/`);
  console.log(` (CodeAnt AI available at: http://localhost:${PORT}/codeant)`);
  console.log(`======================================================\n`);
});
