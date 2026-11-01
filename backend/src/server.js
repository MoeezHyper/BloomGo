const express = require('express');
const cors = require('cors');
const os = require('os');
const { APP_NAME, PORT, PUBLIC_DIR } = require('./config');
const db = require('./db');
const { usingEmulator, projectId } = require('./firebase');
const { syncAuthUsers } = require('./services/authSync');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR, { maxAge: '7d' }));

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`${new Date().toLocaleTimeString()}  ${req.method} ${req.path.startsWith('/api/auth/google') ? req.path : req.originalUrl}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, name: APP_NAME }));
app.use('/api/auth/google', require('./routes/googleAuth'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/flowers', require('./routes/flowers'));
app.use('/api/seasonal', require('./routes/seasonal'));
app.use('/api/chat', require('./routes/chat'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

async function start() {
  db.data; // load or seed the database before accepting requests
  try {
    const s = await syncAuthUsers();
    console.log(`[firebase] ${usingEmulator ? 'Auth Emulator' : `project ${projectId}`}: ${s.created} accounts created, ${s.linked} linked`);
    if (s.missing.length) console.warn(`[firebase] No Firebase account for: ${s.missing.join(', ')}`);
  } catch (e) {
    console.error(`[firebase] Could not reach Firebase Auth (${e.code || e.message}). Sign-in will fail until it is available.`);
  }
  app.listen(PORT, '0.0.0.0', () => {
    const lan = Object.values(os.networkInterfaces())
      .flat()
      .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
    console.log(`\n🌿 ${APP_NAME} API`);
    console.log(`   Local:    http://localhost:${PORT}`);
    if (lan) console.log(`   Network:  http://${lan}:${PORT}`);
    console.log('   Demo logins: sara@demo.com / ali@demo.com / hina@demo.com (Demo12), admin@shgds.app (Admin1)\n');
  });
}

start();
