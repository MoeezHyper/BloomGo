const express = require('express');
const cors = require('cors');
const os = require('os');
const { APP_NAME, PORT, PUBLIC_DIR } = require('./config');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC_DIR, { maxAge: '7d' }));

app.use((req, _res, next) => {
  if (req.path.startsWith('/api')) console.log(`${new Date().toLocaleTimeString()}  ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, name: APP_NAME }));
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

db.data; // load or seed the database before accepting requests
app.listen(PORT, '0.0.0.0', () => {
  const lan = Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`\n🌿 ${APP_NAME} API`);
  console.log(`   Local:    http://localhost:${PORT}`);
  if (lan) console.log(`   Network:  http://${lan}:${PORT}`);
  console.log('   Demo logins: sara@demo.com / ali@demo.com / hina@demo.com (Demo@123), admin@shgds.app (Admin@123)\n');
});
