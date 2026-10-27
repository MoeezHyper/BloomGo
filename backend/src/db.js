// Tiny JSON-file datastore. Everything lives in memory and is flushed to disk
// atomically after each mutation, which is plenty for sample data and testing.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DB_FILE } = require('./config');
const { buildSeed } = require('./data/seedUsers');

let state = null;

function load() {
  if (state) return state;
  if (fs.existsSync(DB_FILE)) {
    state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } else {
    state = buildSeed();
    save();
    console.log('[db] Created new database with demo accounts at', DB_FILE);
  }
  state.users ||= [];
  state.resetCodes ||= [];
  return state;
}

function save() {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

const newId = () => crypto.randomUUID();

module.exports = {
  get data() {
    return load();
  },
  save,
  newId,
};
