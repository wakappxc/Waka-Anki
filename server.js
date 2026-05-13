const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');

const MIME = {
  '.html': 'text/html;charset=utf-8',
  '.js': 'application/javascript;charset=utf-8',
  '.json': 'application/json;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain;charset=utf-8',
};

function send(res, code, data, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json;charset=utf-8' });
  res.end(data);
}

function sendJSON(res, code, data) {
  send(res, code, JSON.stringify(data));
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return sendJSON(res, 404, { error: 'Not found' });
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, data, MIME[ext] || 'application/octet-stream');
  });
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return send(res, 204, '');

  // POST /api/data/<name> — save JSON file
  const apiMatch = req.method === 'POST' && req.url.match(/^\/api\/data\/([\w-]+)$/);
  if (apiMatch) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        JSON.parse(body);
        const filePath = path.join(DATA_DIR, apiMatch[1] + '.json');
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(filePath, body, 'utf-8');
        sendJSON(res, 200, { success: true });
      } catch (e) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // GET /api/data/<name> — read JSON file
  const getMatch = req.method === 'GET' && req.url.match(/^\/api\/data\/([\w-]+)$/);
  if (getMatch) {
    const filePath = path.join(DATA_DIR, getMatch[1] + '.json');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) sendJSON(res, 200, null);
      else send(res, 200, data, 'application/json;charset=utf-8');
    });
    return;
  }

  // Serve static files
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return sendJSON(res, 403, { error: 'Forbidden' });
  sendFile(res, filePath);
});

// Init data files
fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(path.join(DATA_DIR, 'fast-cards.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'fast-cards.json'), '[]', 'utf-8');
}
if (!fs.existsSync(path.join(DATA_DIR, 'ankiweb.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'ankiweb.json'), JSON.stringify({
    decks: [], notes: [], cards: [], revlog: [],
    nextId: { decks: 1, notes: 1, cards: 1, revlog: 1 }
  }), 'utf-8');
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  index.html → http://localhost:${PORT}/`);
  console.log(`  anki.html  → http://localhost:${PORT}/anki.html`);
  console.log(`  Data dir   → ${DATA_DIR}`);
});
