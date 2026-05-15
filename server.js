const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const ATTACH_DIR = path.join(DATA_DIR, '附件');

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

  // POST /api/deck/:id/clear — batch delete all cards in a deck (also removes revlog)
  const clearMatch = req.method === 'POST' && req.url.match(/^\/api\/deck\/(\d+)\/clear$/);
  if (clearMatch) {
    const did = parseInt(clearMatch[1]);
    try {
      const filePath = path.join(DATA_DIR, 'ankiweb.json');
      const revlogPath = path.join(DATA_DIR, 'revlog.json');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const db = JSON.parse(raw);
      const nids = new Set();
      const removedCids = new Set();
      db.cards = db.cards.filter(c => {
        if (c.did === did) { nids.add(c.nid); removedCids.add(c.id); return false; }
        return true;
      });
      db.notes = db.notes.filter(n => !nids.has(n.id));
      fs.writeFileSync(filePath, JSON.stringify(db), 'utf-8');

      // Also remove revlog entries for the cleared cards
      if (removedCids.size > 0 && fs.existsSync(revlogPath)) {
        const revlogDB = JSON.parse(fs.readFileSync(revlogPath, 'utf-8'));
        revlogDB.revlog = revlogDB.revlog.filter(e => !removedCids.has(e.cid));
        fs.writeFileSync(revlogPath, JSON.stringify(revlogDB), 'utf-8');
      }

      sendJSON(res, 200, { success: true, count: nids.size });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // POST /api/deck/:id/delete — delete a deck and all its cards/notes/revlog
  const deleteDeckMatch = req.method === 'POST' && req.url.match(/^\/api\/deck\/(\d+)\/delete$/);
  if (deleteDeckMatch) {
    const did = parseInt(deleteDeckMatch[1]);
    try {
      const filePath = path.join(DATA_DIR, 'ankiweb.json');
      const revlogPath = path.join(DATA_DIR, 'revlog.json');
      const raw = fs.readFileSync(filePath, 'utf-8');
      const db = JSON.parse(raw);
      const nids = new Set();
      const removedCids = new Set();
      db.cards = db.cards.filter(c => {
        if (c.did === did) { nids.add(c.nid); removedCids.add(c.id); return false; }
        return true;
      });
      db.notes = db.notes.filter(n => !nids.has(n.id));
      db.decks = db.decks.filter(d => d.id !== did);
      fs.writeFileSync(filePath, JSON.stringify(db), 'utf-8');

      if (removedCids.size > 0 && fs.existsSync(revlogPath)) {
        const revlogDB = JSON.parse(fs.readFileSync(revlogPath, 'utf-8'));
        revlogDB.revlog = revlogDB.revlog.filter(e => !removedCids.has(e.cid));
        fs.writeFileSync(revlogPath, JSON.stringify(revlogDB), 'utf-8');
      }

      sendJSON(res, 200, { success: true, count: nids.size });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // POST /api/cards/batch-create — batch create notes + cards
  const batchCreateMatch = req.method === 'POST' && req.url === '/api/cards/batch-create';
  if (batchCreateMatch) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { cards } = JSON.parse(body);
        const filePath = path.join(DATA_DIR, 'ankiweb.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const db = JSON.parse(raw);
        let added = 0;
        for (const c of cards) {
          const nid = db.nextId.notes++;
          db.notes.push({
            id: nid, guid: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
            fields: [c.front || '', c.back || ''], tags: c.tags || [],
            notetypeId: 0, created: Date.now()
          });
          db.cards.push({
            id: db.nextId.cards++, nid, did: c.did || 1, ord: 0,
            queue: 0, due: Date.now(), ivl: 0, factor: 2500,
            reps: 0, lapses: 0, left: 0, type: 0, created: Date.now()
          });
          added++;
        }
        fs.writeFileSync(filePath, JSON.stringify(db), 'utf-8');
        sendJSON(res, 200, { success: true, count: added });
      } catch (e) {
        sendJSON(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  // POST /api/attachment/upload — save an image to data/附件/
  if (req.method === 'POST' && req.url === '/api/attachment/upload') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('binary');
        const boundary = req.headers['content-type']?.match(/boundary=(.+)/)?.[1];
        if (!boundary) return sendJSON(res, 400, { error: 'No boundary' });
        const parts = raw.split('--' + boundary);
        for (const part of parts) {
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;
          const header = part.slice(0, headerEnd);
          const body = part.slice(headerEnd + 4);
          const fnMatch = header.match(/filename="(.+?)"/);
          if (!fnMatch) continue;
          const ext = path.extname(fnMatch[1]).toLowerCase();
          const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + ext;
          fs.mkdirSync(ATTACH_DIR, { recursive: true });
          // Remove trailing \r\n before the boundary
          const cleanBody = body.endsWith('\r\n') ? body.slice(0, -2) : body;
          fs.writeFileSync(path.join(ATTACH_DIR, name), cleanBody, 'binary');
          sendJSON(res, 200, { success: true, name });
          return;
        }
        sendJSON(res, 400, { error: 'No file' });
      } catch (e) {
        sendJSON(res, 500, { error: e.message });
      }
    });
    return;
  }

  // GET /api/browse/tree — folder tree with deck stats (one shot, no N+1)
  if (req.method === 'GET' && req.url === '/api/browse/tree') {
    try {
      const filePath = path.join(DATA_DIR, 'ankiweb.json');
      const db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const now = Date.now();
      const today = Math.floor(now / 86400000);

      // Build deck stats map in one pass
      const deckStats = {};
      for (const d of db.decks) {
        deckStats[d.id] = { new: 0, learn: 0, review: 0, total: 0 };
      }
      for (const c of db.cards) {
        const s = deckStats[c.did];
        if (!s) continue;
        s.total++;
        if (c.queue === -1) continue;
        if (c.queue === 0) s.new++;
        else if (c.queue === 1) { if (c.due <= now) s.learn++; }
        else if (c.queue === 2) { if (c.due <= today) s.review++; }
      }

      sendJSON(res, 200, {
        decks: db.decks,
        folders: db.folders || [],
        deckStats
      });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // GET /api/browse/deck/:id — all cards+notes in a deck (one shot)
  const browseDeckMatch = req.method === 'GET' && req.url.match(/^\/api\/browse\/deck\/(\d+)$/);
  if (browseDeckMatch) {
    try {
      const did = parseInt(browseDeckMatch[1]);
      const filePath = path.join(DATA_DIR, 'ankiweb.json');
      const db = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      const cards = db.cards.filter(c => c.did === did);
      const nidSet = new Set(cards.map(c => c.nid));
      const notesMap = {};
      for (const n of db.notes) {
        if (nidSet.has(n.id)) notesMap[n.id] = n;
      }

      sendJSON(res, 200, { cards, notesMap });
    } catch (e) {
      sendJSON(res, 500, { error: e.message });
    }
    return;
  }

  // Serve static files
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/anki.html';
  try { urlPath = decodeURIComponent(urlPath); } catch (e) { /* keep as-is */ }
  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return sendJSON(res, 403, { error: 'Forbidden' });
  sendFile(res, filePath);
});

// Init data files
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(ATTACH_DIR, { recursive: true });
if (!fs.existsSync(path.join(DATA_DIR, 'fast-cards.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'fast-cards.json'), '[]', 'utf-8');
}

const ankiPath = path.join(DATA_DIR, 'ankiweb.json');
const revlogPath = path.join(DATA_DIR, 'revlog.json');

// Migrate: if revlog.json doesn't exist, extract revlog from ankiweb.json
if (!fs.existsSync(revlogPath) && fs.existsSync(ankiPath)) {
  try {
    const raw = fs.readFileSync(ankiPath, 'utf-8');
    const db = JSON.parse(raw);
    if (db.revlog && Array.isArray(db.revlog)) {
      const revlogDB = {
        revlog: db.revlog,
        nextId: { revlog: db.nextId?.revlog || 1 }
      };
      fs.writeFileSync(revlogPath, JSON.stringify(revlogDB), 'utf-8');
      // Strip revlog from main DB
      delete db.revlog;
      if (db.nextId) delete db.nextId.revlog;
      fs.writeFileSync(ankiPath, JSON.stringify(db), 'utf-8');
      console.log('Migrated revlog to separate file');
    }
  } catch (e) {
    console.error('Migration failed:', e.message);
  }
}

// Initialize revlog.json if missing
if (!fs.existsSync(revlogPath)) {
  fs.writeFileSync(revlogPath, JSON.stringify({
    revlog: [], nextId: { revlog: 1 }
  }), 'utf-8');
}

// Initialize ankiweb.json if missing (no revlog field)
if (!fs.existsSync(ankiPath)) {
  fs.writeFileSync(ankiPath, JSON.stringify({
    decks: [], notes: [], cards: [], folders: [],
    nextId: { decks: 1, notes: 1, cards: 1, folders: 1 }
  }), 'utf-8');
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  anki.html  → http://localhost:${PORT}/`);
  console.log(`  anki.html  → http://localhost:${PORT}/anki.html`);
  console.log(`  Data dir   → ${DATA_DIR}`);
});
