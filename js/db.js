// IndexedDB-based storage
// Main data: store 'ankiweb' (decks, notes, cards, folders)
// Revlog:     store 'revlog'  (review history)
// Timehot:    store 'timehot' (daily counts)

const IDB_NAME = 'waka_anki';
const IDB_VERSION = 1;

let _idb = null;

function openIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('ankiweb')) db.createObjectStore('ankiweb');
      if (!db.objectStoreNames.contains('revlog')) db.createObjectStore('revlog');
      if (!db.objectStoreNames.contains('timehot')) db.createObjectStore('timehot');
    };
    req.onsuccess = (e) => { _idb = e.target.result; _idb.onclose = () => { _idb = null; }; resolve(_idb); };
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbGet(storeName, fallback) {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      tx.objectStore(storeName).get('main').onsuccess = (e) => {
        resolve(e.target.result ? e.target.result.data : null);
      };
    });
  } catch (e) { return null; }
}

async function idbSet(storeName, data) {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put({ data }, 'main');
      tx.oncomplete = () => resolve();
      tx.onerror = () => { console.error('IndexedDB write failed:', tx.error); resolve(); };
    });
  } catch (e) { console.error('IndexedDB write error:', e); }
}

// Legacy localStorage helpers – only used for one-time migration
const LS_ANKIWEB = 'waka_ankiweb';
const LS_REVLOG = 'waka_revlog';
const LS_TIMEHOT = 'waka_timehot';

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { return fallback; }
}

function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

let DB = null;
let REVLOG_DB = null;
let TIMEHOT_DB = null;

async function loadRevlogDB() {
  if (REVLOG_DB) return REVLOG_DB;
  let data = await idbGet('revlog');
  if (!data) {
    data = lsGet(LS_REVLOG, null);
    if (data) await idbSet('revlog', data);
  }
  if (!data) data = { revlog: [], nextId: { revlog: 1 } };
  REVLOG_DB = data;
  return REVLOG_DB;
}

async function saveRevlogDB() {
  await idbSet('revlog', REVLOG_DB);
}

async function loadTimehotDB() {
  if (TIMEHOT_DB) return TIMEHOT_DB;
  let data = await idbGet('timehot');
  if (!data) {
    data = lsGet(LS_TIMEHOT, null);
    if (data) await idbSet('timehot', data);
  }
  if (!data) data = { days: {} };
  TIMEHOT_DB = data;
  return TIMEHOT_DB;
}

async function saveTimehotDB() {
  await idbSet('timehot', TIMEHOT_DB);
}

async function loadDB() {
  if (DB) return DB;
  let data = await idbGet('ankiweb');
  if (!data) {
    data = lsGet(LS_ANKIWEB, null);
    if (data) await idbSet('ankiweb', data);
  }
  if (!data) data = { decks: [], notes: [], cards: [], folders: [], nextId: { decks: 1, notes: 1, cards: 1, folders: 1 } };
  DB = data;
  return DB;
}

async function saveDB() {
  await idbSet('ankiweb', DB);
}

// ===== Decks =====
const Deck = {
  async clearCards(did) {
    await loadDB();
    const cids = DB.cards.filter(c => c.did === did).map(c => c.id);
    const nids = new Set(DB.cards.filter(c => c.did === did).map(c => c.nid));
    DB.cards = DB.cards.filter(c => c.did !== did);
    DB.notes = DB.notes.filter(n => !nids.has(n.id));
    await saveDB();
    if (cids.length > 0) await Revlog.removeByCids(cids);
    return { success: true, count: nids.size };
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
  async remove(id) {
    await loadDB();
    const cids = DB.cards.filter(c => c.did === id).map(c => c.id);
    const nids = new Set(DB.cards.filter(c => c.did === id).map(c => c.nid));
    DB.cards = DB.cards.filter(c => c.did !== id);
    DB.notes = DB.notes.filter(n => !nids.has(n.id));
    DB.decks = DB.decks.filter(d => d.id !== id);
    await saveDB();
    if (cids.length > 0) await Revlog.removeByCids(cids);
  },
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
      id: DB.nextId.notes++, guid: generateUUID(),
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
    await loadDB();
    let added = 0;
    for (const c of cards) {
      const nid = DB.nextId.notes++;
      DB.notes.push({
        id: nid, guid: generateUUID(),
        fields: [c.front || '', c.back || ''], tags: c.tags || [],
        notetypeId: 0, created: Date.now()
      });
      DB.cards.push({
        id: DB.nextId.cards++, nid, did: c.did || 1, ord: 0,
        queue: 0, due: Date.now(), ivl: 0, factor: 2500,
        reps: 0, lapses: 0, left: 0, type: 0, created: Date.now()
      });
      added++;
    }
    await saveDB();
    return { success: true, count: added };
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
    await loadRevlogDB();
    const entry = {
      id: REVLOG_DB.nextId.revlog++, cid, rating, timeMs, ivl, factor, reps, lapses,
      reviewTime: Date.now()
    };
    REVLOG_DB.revlog.push(entry); await saveRevlogDB();

    await loadTimehotDB();
    const d = new Date(entry.reviewTime);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    TIMEHOT_DB.days[key] = (TIMEHOT_DB.days[key] || 0) + 1;
    await saveTimehotDB();

    return entry.id;
  },
  async getByCard(cid) { await loadRevlogDB(); return REVLOG_DB.revlog.filter(e => e.cid === cid); },
  async count() { await loadRevlogDB(); return REVLOG_DB.revlog.length; },
  async getAll() { await loadRevlogDB(); return [...REVLOG_DB.revlog]; },
  async removeByCids(cids) {
    await loadRevlogDB();
    const cidSet = new Set(cids);
    const before = REVLOG_DB.revlog.length;
    REVLOG_DB.revlog = REVLOG_DB.revlog.filter(e => !cidSet.has(e.cid));
    if (REVLOG_DB.revlog.length !== before) await saveRevlogDB();
  }
};

// ===== Timehot =====
const Timehot = {
  async getAll() { await loadTimehotDB(); return { ...TIMEHOT_DB.days }; },
  async getTotal() {
    await loadTimehotDB();
    let total = 0;
    for (const v of Object.values(TIMEHOT_DB.days)) total += v;
    return total;
  }
};

// ===== Stats =====
const Stats = {
  async getOverview() {
    await loadDB();
    await loadRevlogDB();
    const today = Math.floor(Date.now() / 86400000);
    let dueCount = 0;
    for (const c of DB.cards) {
      if (c.queue === -1) continue;
      if (c.queue === 0) { dueCount++; continue; }
      if (c.queue === 1 && c.due <= Date.now()) { dueCount++; continue; }
      if (c.queue === 2 && c.due <= today) { dueCount++; }
    }
    const revlogArr = REVLOG_DB.revlog || [];
    const todayReviews = revlogArr.filter(r => Math.floor(r.reviewTime / 86400000) === today).length;
    return { decks: DB.decks.length, notes: DB.notes.length, cards: DB.cards.length,
             due: dueCount, revlog: revlogArr.length, todayReviews };
  }
};

// Export for backup/restore (used by anki.html)
async function exportAllRawData() {
  await loadDB();
  await loadRevlogDB();
  await loadTimehotDB();
  return { ankiweb: DB, revlog: REVLOG_DB, timehot: TIMEHOT_DB };
}

async function importRawData(ankiweb, revlog, timehot) {
  if (ankiweb) { DB = ankiweb; await saveDB(); }
  if (revlog) { REVLOG_DB = revlog; await saveRevlogDB(); }
  if (timehot) { TIMEHOT_DB = timehot; await saveTimehotDB(); }
}

async function clearAllDB() {
  await loadDB();
  await loadRevlogDB();
  await loadTimehotDB();
  DB.decks = []; DB.notes = []; DB.cards = []; DB.folders = [];
  DB.nextId = { decks: 1, notes: 1, cards: 1, folders: 1 };
  await saveDB();
  REVLOG_DB.revlog = [];
  REVLOG_DB.nextId = { revlog: 1 };
  await saveRevlogDB();
  TIMEHOT_DB.days = {};
  await saveTimehotDB();
}

async function ensureDefaultDeck() {
  await loadDB();
  if (DB.decks.length === 0) await Deck.create('默认');
}
