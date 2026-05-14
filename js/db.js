// File-based storage via local server
// Data stored at: data/ankiweb.json

const API = 'http://localhost:3456/api/data/ankiweb';

let DB = null;

async function loadDB() {
  if (DB) return DB;
  try {
    const r = await fetch(API, { cache: 'no-store' });
    if (r.ok) {
      const data = await r.json();
      if (data && data.decks) {
        DB = data;
        if (!DB.folders) DB.folders = [];
        if (!DB.nextId.folders) DB.nextId.folders = 1;
        return DB;
      }
    }
  } catch (e) { console.error('Load DB failed, start fresh'); }
  DB = { decks: [], notes: [], cards: [], revlog: [], folders: [], nextId: { decks: 1, notes: 1, cards: 1, revlog: 1, folders: 1 } };
  return DB;
}

async function saveDB() {
  try {
    await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DB),
    });
  } catch (e) { console.error('Save DB failed:', e); }
}

// ===== Decks =====
const Deck = {
  async clearCards(did) {
    const r = await fetch(`http://localhost:3456/api/deck/${did}/clear`, { method: 'POST' });
    DB = null; // invalidate cache so next loadDB re-fetches
    return r.json();
  },
  async create(name, folderId = null) {
    await loadDB();
    const deck = { id: DB.nextId.decks++, name, folderId, created: Date.now() };
    DB.decks.push(deck); await saveDB(); return deck.id;
  },
  async getAll() { await loadDB(); return [...DB.decks]; },
  async get(id) { await loadDB(); return DB.decks.find(d => d.id === id); },
  async update(deck) {
    await loadDB();
    const idx = DB.decks.findIndex(d => d.id === deck.id);
    if (idx >= 0) { deck.modified = Date.now(); DB.decks[idx] = deck; await saveDB(); }
  },
  async remove(id) { await loadDB(); DB.decks = DB.decks.filter(d => d.id !== id); await saveDB(); },
  async count() { await loadDB(); return DB.decks.length; },
  async findByName(name) { await loadDB(); return DB.decks.find(d => d.name === name); }
};

// ===== Folders =====
const Folder = {
  async create(name, parentId = null) {
    await loadDB();
    const folder = { id: DB.nextId.folders++, name, parentId, created: Date.now() };
    DB.folders.push(folder); await saveDB(); return folder.id;
  },
  async getAll() { await loadDB(); return [...DB.folders]; },
  async get(id) { await loadDB(); return DB.folders.find(f => f.id === id); },
  async update(folder) {
    await loadDB();
    const idx = DB.folders.findIndex(f => f.id === folder.id);
    if (idx >= 0) { folder.modified = Date.now(); DB.folders[idx] = folder; await saveDB(); }
  },
  async remove(id) {
    await loadDB();
    const folder = DB.folders.find(f => f.id === id);
    if (!folder) return;
    const parentId = folder.parentId;
    DB.folders.filter(f => f.parentId === id).forEach(f => f.parentId = parentId);
    DB.decks.filter(d => d.folderId === id).forEach(d => d.folderId = parentId);
    DB.folders = DB.folders.filter(f => f.id !== id);
    await saveDB();
  },
  async removeDeep(id) {
    await loadDB();
    const collectIds = (fid) => {
      const ids = [fid];
      DB.folders.filter(f => f.parentId === fid).forEach(f => ids.push(...collectIds(f.id)));
      return ids;
    };
    const ids = collectIds(id);
    ids.forEach(fid => {
      DB.decks = DB.decks.filter(d => d.folderId !== fid);
    });
    DB.folders = DB.folders.filter(f => !ids.includes(f.id));
    await saveDB();
    return ids.length;
  },
  async getChildren(id) { await loadDB(); return DB.folders.filter(f => f.parentId === id); },
  async getDecks(id) { await loadDB(); return DB.decks.filter(d => d.folderId === id); }
};

// ===== Notes =====
const Note = {
  async create(fields, tags, notetypeId) {
    await loadDB();
    const note = {
      id: DB.nextId.notes++, guid: crypto.randomUUID(),
      fields: fields || ['', ''], tags: tags || [],
      notetypeId: notetypeId || 0, created: Date.now()
    };
    DB.notes.push(note); await saveDB(); return note.id;
  },
  async get(id) { await loadDB(); return DB.notes.find(n => n.id === id); },
  async getAll() { await loadDB(); return [...DB.notes]; },
  async update(note) {
    await loadDB();
    const idx = DB.notes.findIndex(n => n.id === note.id);
    if (idx >= 0) { note.modified = Date.now(); DB.notes[idx] = note; await saveDB(); }
  },
  async remove(id) { await loadDB(); DB.notes = DB.notes.filter(n => n.id !== id); await saveDB(); },
  async removeMany(ids) { await loadDB(); DB.notes = DB.notes.filter(n => !ids.includes(n.id)); await saveDB(); }
};

// ===== Cards =====
const Card = {
  async batchCreate(cards) {
    const r = await fetch('http://localhost:3456/api/cards/batch-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards })
    });
    DB = null; // invalidate cache
    return r.json();
  },
  async create(nid, did, ord) {
    await loadDB();
    const card = {
      id: DB.nextId.cards++, nid, did: did || 1, ord: ord || 0,
      queue: 0, due: Date.now(), ivl: 0, factor: 2500,
      reps: 0, lapses: 0, left: 0, type: 0, created: Date.now()
    };
    DB.cards.push(card); await saveDB(); return card.id;
  },
  async get(id) { await loadDB(); return DB.cards.find(c => c.id === id); },
  async update(card) {
    await loadDB();
    const idx = DB.cards.findIndex(c => c.id === card.id);
    if (idx >= 0) { card.modified = Date.now(); DB.cards[idx] = card; await saveDB(); }
  },
  async remove(id) { await loadDB(); DB.cards = DB.cards.filter(c => c.id !== id); await saveDB(); },
  async removeByNid(nid) { await loadDB(); DB.cards = DB.cards.filter(c => c.nid !== nid); await saveDB(); },
  async getByNid(nid) { await loadDB(); return DB.cards.filter(c => c.nid === nid); },
  async getByDeck(did) { await loadDB(); return DB.cards.filter(c => c.did === did); },
  async getAll() { await loadDB(); return [...DB.cards]; },
  async getDueCards(did, now) {
    await loadDB();
    const ts = now || Date.now();
    return DB.cards.filter(c => {
      if (c.did !== did) return false;
      if (c.queue === -1) return false;
      if (c.queue === 0) return true;
      if (c.queue === 1) return c.due <= ts;
      if (c.queue === 2) { return c.due <= Math.floor(ts / 86400000); }
      return false;
    });
  },
  async countByDeck(did) {
    await loadDB();
    const cards = DB.cards.filter(c => c.did === did);
    const now = Date.now();
    const today = Math.floor(now / 86400000);
    let n = 0, l = 0, r = 0;
    for (const c of cards) {
      if (c.queue === -1) continue;
      if (c.queue === 0) n++;
      else if (c.queue === 1 || c.type === 3) { if (c.due <= now) l++; }
      else if (c.queue === 2) { if (c.due <= today) r++; }
    }
    return { new: n, learn: l, review: r, total: cards.length };
  }
};

// ===== Revlog =====
const Revlog = {
  async add(cid, rating, timeMs, ivl, factor, reps, lapses) {
    await loadDB();
    const entry = {
      id: DB.nextId.revlog++, cid, rating, timeMs, ivl, factor, reps, lapses,
      reviewTime: Date.now()
    };
    DB.revlog.push(entry); await saveDB(); return entry.id;
  },
  async getByCard(cid) { await loadDB(); return DB.revlog.filter(e => e.cid === cid); },
  async count() { await loadDB(); return DB.revlog.length; },
  async getAll() { await loadDB(); return [...DB.revlog]; }
};

// ===== Stats =====
const Stats = {
  async getOverview() {
    await loadDB();
    const today = Math.floor(Date.now() / 86400000);
    let dueCount = 0;
    for (const c of DB.cards) {
      if (c.queue === -1) continue;
      if (c.queue === 0) { dueCount++; continue; }
      if (c.queue === 1 && c.due <= Date.now()) { dueCount++; continue; }
      if (c.queue === 2 && c.due <= today) { dueCount++; }
    }
    const todayReviews = DB.revlog.filter(r => Math.floor(r.reviewTime / 86400000) === today).length;
    return { decks: DB.decks.length, notes: DB.notes.length, cards: DB.cards.length,
             due: dueCount, revlog: DB.revlog.length, todayReviews };
  }
};

async function clearAllDB() {
  await loadDB();
  DB.decks = []; DB.notes = []; DB.cards = []; DB.revlog = []; DB.folders = [];
  DB.nextId = { decks: 1, notes: 1, cards: 1, revlog: 1, folders: 1 };
  await saveDB();
}

async function ensureDefaultDeck() {
  await loadDB();
  if (DB.decks.length === 0) await Deck.create('默认');
}
