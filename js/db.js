// IndexedDB wrapper for Anki Web
// Stores: decks, notes, cards, revlog

const DB_NAME = 'ankiweb';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('decks')) {
        const ds = d.createObjectStore('decks', { keyPath: 'id', autoIncrement: true });
        ds.createIndex('name', 'name', { unique: true });
      }
      if (!d.objectStoreNames.contains('notes')) {
        const ns = d.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
        ns.createIndex('nid', 'id');
      }
      if (!d.objectStoreNames.contains('cards')) {
        const cs = d.createObjectStore('cards', { keyPath: 'id', autoIncrement: true });
        cs.createIndex('did', 'did');
        cs.createIndex('nid', 'nid');
        cs.createIndex('queue', 'queue');
        cs.createIndex('due', 'due');
      }
      if (!d.objectStoreNames.contains('revlog')) {
        d.createObjectStore('revlog', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function tx(storeName, mode) {
  return db.transaction(storeName, mode).objectStore(storeName);
}

// ===== Decks =====
const Deck = {
  async create(name) {
    const d = await openDB();
    const deck = { name, created: Date.now() };
    return new Promise((resolve, reject) => {
      const r = tx('decks', 'readwrite').add(deck);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },
  async getAll() {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('decks', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result);
    });
  },
  async get(id) {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('decks', 'readonly').get(id);
      r.onsuccess = () => resolve(r.result);
    });
  },
  async update(deck) {
    await openDB();
    deck.modified = Date.now();
    return new Promise((resolve, reject) => {
      const r = tx('decks', 'readwrite').put(deck);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },
  async remove(id) {
    await openDB();
    return new Promise((resolve) => {
      tx('decks', 'readwrite').delete(id);
      resolve();
    });
  },
  async count() {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('decks', 'readonly').count();
      r.onsuccess = () => resolve(r.result);
    });
  }
};

// ===== Notes =====
const Note = {
  async create(fields, tags, notetypeId) {
    const d = await openDB();
    const note = {
      guid: crypto.randomUUID(),
      fields: fields || ['', ''],
      tags: tags || [],
      notetypeId: notetypeId || 0,
      created: Date.now()
    };
    return new Promise((resolve, reject) => {
      const r = tx('notes', 'readwrite').add(note);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },
  async get(id) {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('notes', 'readonly').get(id);
      r.onsuccess = () => resolve(r.result);
    });
  },
  async getAll() {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('notes', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result);
    });
  },
  async update(note) {
    await openDB();
    note.modified = Date.now();
    return new Promise((resolve) => {
      tx('notes', 'readwrite').put(note);
      resolve();
    });
  },
  async remove(id) {
    await openDB();
    return new Promise((resolve) => {
      tx('notes', 'readwrite').delete(id);
      resolve();
    });
  },
  async removeMany(ids) {
    await openDB();
    const s = tx('notes', 'readwrite');
    for (const id of ids) s.delete(id);
    return new Promise((resolve) => { s.transaction.oncomplete = resolve; });
  }
};

// ===== Cards =====
const Card = {
  // Create a card for a note
  async create(nid, did, ord) {
    const d = await openDB();
    const card = {
      nid: nid,
      did: did || 1,
      ord: ord || 0,
      queue: 0,       // 0=new, 1=learn, 2=review, -1=suspended
      due: Date.now(), // for new: position (timestamp used as insertion order proxy)
      ivl: 0,          // interval in days
      factor: 2500,    // ease factor * 1000
      reps: 0,         // number of reviews
      lapses: 0,       // number of times forgotten
      left: 0,         // remaining learning steps (0 = not in learning)
      type: 0,         // 0=new, 1=learn, 2=review, 3=relearn
      created: Date.now()
    };
    return new Promise((resolve, reject) => {
      const r = tx('cards', 'readwrite').add(card);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },
  async get(id) {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('cards', 'readonly').get(id);
      r.onsuccess = () => resolve(r.result);
    });
  },
  async update(card) {
    await openDB();
    card.modified = Date.now();
    return new Promise((resolve) => {
      tx('cards', 'readwrite').put(card);
      resolve();
    });
  },
  async remove(id) {
    await openDB();
    return new Promise((resolve) => {
      tx('cards', 'readwrite').delete(id);
      resolve();
    });
  },
  async removeByNid(nid) {
    await openDB();
    const cards = await Card.getByNid(nid);
    for (const c of cards) await Card.remove(c.id);
  },
  async getByNid(nid) {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('cards', 'readonly').index('nid').getAll(nid);
      r.onsuccess = () => resolve(r.result);
    });
  },
  async getByDeck(did) {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('cards', 'readonly').index('did').getAll(did);
      r.onsuccess = () => resolve(r.result);
    });
  },
  async getAll() {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('cards', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result);
    });
  },
  // Get all cards due for review in a given deck
  async getDueCards(did, now) {
    await openDB();
    const all = await Card.getByDeck(did);
    const ts = now || Date.now();
    return all.filter(c => {
      if (c.queue === -1) return false; // suspended
      if (c.queue === 0) return true;  // new
      if (c.queue === 1) return c.due <= ts; // learning, due in seconds
      if (c.queue === 2) {
        // Review: due is a day number (days since collection creation)
        const today = Math.floor(ts / 86400000);
        return c.due <= today;
      }
      return false;
    });
  },
  // Count cards by state for a deck
  async countByDeck(did) {
    await openDB();
    const cards = await Card.getByDeck(did);
    const now = Date.now();
    const today = Math.floor(now / 86400000);
    let n = 0, l = 0, r = 0;
    for (const c of cards) {
      if (c.queue === -1) continue;
      if (c.queue === 0) n++;
      else if (c.queue === 1 || c.type === 3) {
        if (c.due <= now) l++;
      } else if (c.queue === 2) {
        if (c.due <= today) r++;
      }
    }
    return { new: n, learn: l, review: r, total: cards.length };
  }
};

// ===== Revlog =====
const Revlog = {
  async add(cid, rating, timeMs, ivl, factor, reps, lapses) {
    await openDB();
    const entry = {
      cid, rating, timeMs, ivl, factor, reps, lapses,
      reviewTime: Date.now()
    };
    return new Promise((resolve) => {
      const r = tx('revlog', 'readwrite').add(entry);
      r.onsuccess = () => resolve(r.result);
    });
  },
  async getByCard(cid) {
    await openDB();
    const all = await new Promise((resolve) => {
      const r = tx('revlog', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result);
    });
    return all.filter(e => e.cid === cid);
  },
  async count() {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('revlog', 'readonly').count();
      r.onsuccess = () => resolve(r.result);
    });
  },
  async getAll() {
    await openDB();
    return new Promise((resolve) => {
      const r = tx('revlog', 'readonly').getAll();
      r.onsuccess = () => resolve(r.result);
    });
  }
};

// ===== Stats =====
const Stats = {
  async getOverview() {
    await openDB();
    const decks = await Deck.getAll();
    const notes = await Note.getAll();
    const cards = await Card.getAll();
    const revlogCount = await Revlog.count();

    let dueCount = 0;
    const now = Date.now();
    const today = Math.floor(now / 86400000);
    for (const c of cards) {
      if (c.queue === -1) continue;
      if (c.queue === 0) { dueCount++; continue; }
      if (c.queue === 1 && c.due <= now) { dueCount++; continue; }
      if (c.queue === 2 && c.due <= today) { dueCount++; }
    }

    const todayReviews = (await Revlog.getAll()).filter(r => {
      const rDay = Math.floor(r.reviewTime / 86400000);
      return rDay === today;
    }).length;

    return { decks: decks.length, notes: notes.length, cards: cards.length,
             due: dueCount, revlog: revlogCount, todayReviews };
  }
};

// Initialize default deck
async function ensureDefaultDeck() {
  await openDB();
  const decks = await Deck.getAll();
  if (decks.length === 0) {
    await Deck.create('默认');
  }
}
