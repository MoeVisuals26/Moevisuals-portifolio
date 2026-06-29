const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css',
  '.js'  : 'application/javascript',
  '.json': 'application/json',
  '.jpg' : 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png' : 'image/png',
  '.mp4' : 'video/mp4',
  '.mov' : 'video/quicktime',
  '.svg' : 'image/svg+xml',
  '.ico' : 'image/x-icon',
  '.webp': 'image/webp',
};

function serveFile(filePath, res) {
  const ext         = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) return null;
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
    return true;
  });
}

http.createServer((req, res) => {
  console.log(new Date().toISOString().substr(11,8) + ' ' + req.method + ' ' + req.url);
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Try exact path first, then with .html appended (clean URLs)
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      // File exists — serve it
      const ext         = path.extname(filePath).toLowerCase();
      const contentType = MIME[ext] || 'application/octet-stream';
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) { res.writeHead(500); res.end('Server error'); return; }
        res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
        res.end(data);
      });
    } else {
      // Try adding .html
      const htmlPath = filePath + '.html';
      fs.access(htmlPath, fs.constants.F_OK, (err2) => {
        if (!err2) {
          fs.readFile(htmlPath, (readErr, data) => {
            if (readErr) { res.writeHead(500); res.end('Server error'); return; }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
            res.end(data);
          });
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found: ' + urlPath);
        }
      });
    }
  });

}).listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('  Moevisuals — local server running');
  console.log('  Open: http://localhost:' + PORT);
  console.log('');
  console.log('  Press Ctrl+C to stop.');
});
