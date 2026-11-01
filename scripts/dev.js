#!/usr/bin/env node
// One command to develop: boots the Android emulator (if nothing is connected),
// starts the Firebase Auth Emulator (unless a real Firebase project is configured),
// starts the API with auto-reload, then launches Expo on the device.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const API_PORT = Number(process.env.PORT) || 4000;
const FIREBASE_PORT = 9099;
const FIREBASE_PROJECT = 'demo-shgds';
const FIREBASE_DATA = path.join(ROOT, '.firebase-emulator');
const emulatorOnly = process.argv.includes('--emulator-only');
const isWin = process.platform === 'win32';

const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = c('32');
const dim = c('2');
const bold = c('1');
const yellow = c('33');
const red = c('31');
const log = (msg) => console.log(`${green('◆')} ${msg}`);

function findSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    isWin && 'D:\\sdk',
    isWin && process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
    process.platform === 'darwin' && path.join(os.homedir(), 'Library', 'Android', 'sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(path.join(p, 'platform-tools')));
}

const SDK = findSdk();
const exe = (name) => (isWin ? `${name}.exe` : name);
const ADB = SDK && path.join(SDK, 'platform-tools', exe('adb'));
const EMULATOR = SDK && path.join(SDK, 'emulator', exe('emulator'));
const rawPath = process.env.PATH || process.env.Path || '';
const extraPaths = [
  path.join(FRONTEND, 'node_modules', '.bin'),
  isWin && 'C:\\Program Files\\nodejs',
  SDK && path.join(SDK, 'platform-tools'),
  SDK && path.join(SDK, 'emulator'),
].filter(Boolean);

const env = { ...process.env };
const fullPath = [...extraPaths, rawPath].join(path.delimiter);
env.PATH = fullPath;
env.Path = fullPath;
if (SDK) {
  env.ANDROID_HOME = SDK;
  env.ANDROID_SDK_ROOT = SDK;
  // Some setups keep AVDs outside the user profile; only point there if it exists.
  if (!env.ANDROID_AVD_HOME && isWin && fs.existsSync('D:\\.android\\avd')) env.ANDROID_AVD_HOME = 'D:\\.android\\avd';
}

// Minimal KEY=VALUE reader for frontend/.env.
function readEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].replace(/^['"]|['"]$/g, '')])
  );
}
// A real Firebase project is used when its web API key is in frontend/.env.
const useFirebaseEmulator = !readEnvFile(path.join(FRONTEND, '.env')).EXPO_PUBLIC_FIREBASE_API_KEY;

const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', env });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function connectedDevices() {
  const out = run(ADB, ['devices']).stdout || '';
  return out
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === 'device')
    .map(([serial]) => serial);
}

async function ensureDevice() {
  if (!SDK) {
    console.log(yellow('! Android SDK not found. Set ANDROID_HOME, or start an emulator from Android Studio.'));
    return null;
  }
  let devices = connectedDevices();
  if (devices.length) {
    log(`Using connected device ${bold(devices[0])}`);
    return devices[0];
  }
  const avds = (run(EMULATOR, ['-list-avds']).stdout || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('INFO'));
  if (!avds.length) {
    console.log(yellow('! No Android Virtual Device found. Create one in Android Studio → Device Manager.'));
    return null;
  }
  const avd = process.env.AVD && avds.includes(process.env.AVD) ? process.env.AVD : avds[0];
  log(`Booting emulator ${bold(avd)} …`);
  spawn(EMULATOR, ['-avd', avd, '-netdelay', 'none', '-netspeed', 'full'], { detached: true, stdio: 'ignore', env }).unref();

  const started = Date.now();
  while (Date.now() - started < 300000) {
    await sleep(2000);
    devices = connectedDevices();
    if (devices.length) {
      const booted = (run(ADB, ['-s', devices[0], 'shell', 'getprop', 'sys.boot_completed']).stdout || '').trim();
      if (booted === '1') {
        log(`Emulator ready ${dim(`(${Math.round((Date.now() - started) / 1000)}s)`)}`);
        await sleep(1500);
        return devices[0];
      }
    }
    process.stdout.write(dim('.'));
  }
  console.log(red('\n! Emulator did not finish booting in 5 minutes.'));
  return null;
}

function portInUse(port) {
  return new Promise((resolve) => {
    const s = net.createServer().once('error', () => resolve(true)).once('listening', () => s.close(() => resolve(false))).listen(port, '0.0.0.0');
  });
}

function prefixPipe(stream, out, prefix, filter = () => true) {
  let buf = '';
  stream.on('data', (d) => {
    buf += d;
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    lines.filter(filter).forEach((l) => out.write(prefix + l + '\n'));
  });
}

const firebaseCli = path.join(ROOT, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');

async function firebaseReady() {
  return fetch(`http://127.0.0.1:${FIREBASE_PORT}/`)
    .then((r) => r.json())
    .then((j) => !!j.authEmulator?.ready)
    .catch(() => false);
}

// Firebase Auth Emulator: real Firebase Auth running locally, no account or keys needed.
async function startFirebaseEmulator() {
  if (await firebaseReady()) {
    log(`Firebase Auth Emulator already running on port ${FIREBASE_PORT} — reusing it`);
    return null;
  }
  if (!fs.existsSync(firebaseCli)) {
    console.log(red('! firebase-tools is not installed. Run npm i in the project root.'));
    process.exit(1);
  }
  log('Starting Firebase Auth Emulator…');
  const args = [firebaseCli, 'emulators:start', '--only', 'auth', '--project', FIREBASE_PROJECT];
  if (fs.existsSync(path.join(FIREBASE_DATA, 'firebase-export-metadata.json'))) args.push('--import', FIREBASE_DATA);
  // Own process group, so Ctrl+C reaches us first and we can save its data before it stops.
  const child = spawn(process.execPath, args, { cwd: ROOT, env, detached: true, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  prefixPipe(child.stdout, process.stdout, yellow('[firebase] '), (l) => /error|warn|⚠/i.test(l));
  prefixPipe(child.stderr, process.stderr, yellow('[firebase] '));
  const started = Date.now();
  while (Date.now() - started < 90000) {
    if (await firebaseReady()) {
      log(`Firebase Auth Emulator ready ${dim('(accounts & reset emails: http://127.0.0.1:4040/auth)')}`);
      return child;
    }
    if (child.exitCode !== null) break;
    await sleep(1000);
  }
  console.log(red('! Firebase Auth Emulator did not start. See the [firebase] lines above.'));
  process.exit(1);
}

// Saves emulator accounts to .firebase-emulator so they survive restarts.
function saveFirebaseData() {
  const args = [firebaseCli, 'emulators:export', FIREBASE_DATA, '--force', '--project', FIREBASE_PROJECT];
  const r = spawnSync(process.execPath, args, { cwd: ROOT, env, encoding: 'utf8', timeout: 30000 });
  if (r.status === 0) log('Saved Firebase emulator accounts');
  else console.log(yellow('! Could not save Firebase emulator accounts.'));
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (isWin) spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else process.kill(-child.pid, 'SIGINT');
}

async function startBackend(extraEnv) {
  if (await portInUse(API_PORT)) {
    const ok = await fetch(`http://localhost:${API_PORT}/api/health`).then((r) => r.ok).catch(() => false);
    if (ok) {
      log(`API already running on port ${API_PORT} — reusing it`);
      return null;
    }
    console.log(red(`! Port ${API_PORT} is used by another program. Free it, or pick another port: $env:PORT="5000"; npm start (PowerShell) / PORT=5000 npm start (bash).`));
    process.exit(1);
  }
  if (!fs.existsSync(path.join(BACKEND, 'node_modules'))) {
    log('Installing backend dependencies…');
    spawnSync('npm install', { cwd: BACKEND, stdio: 'inherit', shell: true });
  }
  // Our own watcher instead of node --watch: only backend/src changes restart the API
  // (database writes in backend/data must not), and the old process is fully stopped
  // before the new one binds the port.
  const api = { child: null, killed: false };
  const launch = () => {
    const child = spawn(process.execPath, ['src/server.js'], {
      cwd: BACKEND,
      env: { ...env, ...extraEnv, PORT: String(API_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    prefixPipe(child.stdout, process.stdout, green('[api] '));
    prefixPipe(child.stderr, process.stderr, green('[api] '));
    child.on('exit', (code) => {
      if (code && !child.restarting && !api.killed) console.log(red(`[api] exited with code ${code} — will restart when you save a file in backend/src`));
    });
    api.child = child;
  };
  let timer = null;
  fs.watch(path.join(BACKEND, 'src'), { recursive: true }, (_event, file) => {
    if (api.killed || !file || !/\.(js|json)$/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      console.log(green('[api] ') + dim(`${file} changed — restarting`));
      const old = api.child;
      if (old && old.exitCode === null) {
        old.restarting = true;
        const exited = new Promise((r) => old.once('exit', r));
        old.kill();
        await exited;
      }
      launch();
    }, 300);
  });
  launch();
  return {
    get killed() {
      return api.killed;
    },
    kill() {
      api.killed = true;
      api.child?.kill();
    },
  };
}

(async () => {
  console.log(`\n${bold('🌿 Smart Home Gardening and Decoration System')} ${dim('— dev')}\n`);
  const devicePromise = ensureDevice();
  if (emulatorOnly) return void (await devicePromise);

  const firebase = useFirebaseEmulator ? await startFirebaseEmulator() : null;
  if (!useFirebaseEmulator) log('Using the Firebase project configured in frontend/.env');
  const backend = await startBackend(
    useFirebaseEmulator ? { FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${FIREBASE_PORT}`, FIREBASE_PROJECT_ID: FIREBASE_PROJECT } : {}
  );
  const serial = await devicePromise;

  // Tunnel the API port to the device (emulator or USB phone) so the app can use
  // localhost — more reliable than 10.0.2.2 and unaffected by the host firewall.
  let apiUrl = `http://10.0.2.2:${API_PORT}`;
  let firebaseHost = `10.0.2.2:${FIREBASE_PORT}`;
  if (serial && run(ADB, ['-s', serial, 'reverse', `tcp:${API_PORT}`, `tcp:${API_PORT}`]).status === 0) {
    apiUrl = `http://localhost:${API_PORT}`;
    run(ADB, ['-s', serial, 'reverse', 'tcp:8081', 'tcp:8081']);
    if (useFirebaseEmulator && run(ADB, ['-s', serial, 'reverse', `tcp:${FIREBASE_PORT}`, `tcp:${FIREBASE_PORT}`]).status === 0) {
      firebaseHost = `127.0.0.1:${FIREBASE_PORT}`;
    }
  }
  log(`App will call the API at ${bold(apiUrl)}`);
  if (useFirebaseEmulator) log(`App will use the Firebase Auth Emulator at ${bold(firebaseHost)}`);

  // Tunnels can be dropped (Expo's own adb setup, emulator restarts); keep re-applying them.
  if (apiUrl.includes('localhost')) {
    const ports = [API_PORT, 8081, ...(useFirebaseEmulator ? [FIREBASE_PORT] : [])];
    setInterval(() => {
      const list = run(ADB, ['-s', serial, 'reverse', '--list']).stdout || '';
      for (const p of ports) if (!list.includes(`tcp:${p} tcp:${p}`)) run(ADB, ['-s', serial, 'reverse', `tcp:${p}`, `tcp:${p}`]);
    }, 5000).unref();
  }

  if (!fs.existsSync(path.join(FRONTEND, 'node_modules'))) {
    log('Installing app dependencies…');
    spawnSync(isWin ? 'npm.cmd install' : 'npm install', { cwd: FRONTEND, stdio: 'inherit', shell: true, env });
  }
  const expoBin = path.join(FRONTEND, 'node_modules', '.bin', isWin ? 'expo.cmd' : 'expo');
  const expoCmd = fs.existsSync(expoBin)
    ? `"${expoBin}" start ${serial ? '--android' : ''}`
    : `${isWin ? 'npx.cmd' : 'npx'} expo start ${serial ? '--android' : ''}`;
  log(`Starting Expo ${dim(`(${expoCmd})`)}\n`);
  const expoEnv = { ...env, EXPO_PUBLIC_API_URL: apiUrl, ...(useFirebaseEmulator && { EXPO_PUBLIC_FIREBASE_EMULATOR_HOST: firebaseHost }) };
  const expo = spawn(expoCmd, { cwd: FRONTEND, stdio: 'inherit', shell: true, env: expoEnv });

  let stopped = false;
  const shutdown = () => {
    if (stopped) return;
    stopped = true;
    if (backend && !backend.killed) backend.kill();
    if (firebase) {
      saveFirebaseData();
      killTree(firebase);
    }
  };
  expo.on('exit', (code) => {
    shutdown();
    process.exit(code ?? 0);
  });
  process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
  });
  process.on('exit', shutdown);
})();
