#!/usr/bin/env node
// One command to develop: boots the Android emulator (if nothing is connected),
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
const env = { ...process.env };
if (SDK) {
  env.ANDROID_HOME = SDK;
  env.PATH = [path.join(SDK, 'platform-tools'), path.join(SDK, 'emulator'), env.PATH].join(path.delimiter);
}

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

async function startBackend() {
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
  const child = spawn(process.execPath, ['--watch-path=src', 'src/server.js'], { cwd: BACKEND, env: { ...env, PORT: String(API_PORT) }, stdio: ['ignore', 'pipe', 'pipe'] });
  const prefix = green('[api] ');
  const pipe = (stream, out) => {
    let buf = '';
    stream.on('data', (d) => {
      buf += d;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      lines.forEach((l) => out.write(prefix + l + '\n'));
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => code && console.log(red(`[api] exited with code ${code}`)));
  return child;
}

(async () => {
  console.log(`\n${bold('🌿 Smart Home Gardening and Decoration System')} ${dim('— dev')}\n`);
  const devicePromise = ensureDevice();
  if (emulatorOnly) return void (await devicePromise);

  const backend = await startBackend();
  const serial = await devicePromise;

  // Tunnel the API port to the device (emulator or USB phone) so the app can use
  // localhost — more reliable than 10.0.2.2 and unaffected by the host firewall.
  let apiUrl = `http://10.0.2.2:${API_PORT}`;
  if (serial && run(ADB, ['-s', serial, 'reverse', `tcp:${API_PORT}`, `tcp:${API_PORT}`]).status === 0) {
    apiUrl = `http://localhost:${API_PORT}`;
  }
  log(`App will call the API at ${bold(apiUrl)}`);

  if (!fs.existsSync(path.join(FRONTEND, 'node_modules'))) {
    log('Installing app dependencies…');
    spawnSync('npm install', { cwd: FRONTEND, stdio: 'inherit', shell: true });
  }
  const expoArgs = ['expo', 'start', ...(serial ? ['--android'] : [])];
  log(`Starting Expo ${dim(`(npx ${expoArgs.join(' ')})`)}\n`);
  const expo = spawn(`npx ${expoArgs.join(' ')}`, { cwd: FRONTEND, stdio: 'inherit', shell: true, env: { ...env, EXPO_PUBLIC_API_URL: apiUrl } });

  const shutdown = () => {
    if (backend && !backend.killed) backend.kill();
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
