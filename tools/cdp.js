#!/usr/bin/env node
'use strict';

// Drives a page of the repo in headless Chrome over the DevTools protocol (no Playwright or
// Puppeteer needed): starts Chrome, runs a steps file against the page, saves the screenshots,
// prints what the steps log and every uncaught error of the page, then stops Chrome and all its
// child processes. Used by an agent to see a change working on a phone or a desktop.
//
// Usage: node --experimental-websocket tools/cdp.js <steps.js> [out-dir] [--port N] [--limit S]
//   out-dir  where the screenshots go (default: cdp-out in the system temp folder)
//   --limit  wall-clock limit in seconds (default 120): WebGL runs in software here, keep it short
//
// A steps file exports one async function, given the helpers below:
//
//   module.exports = async ({ page, phone, ev, shot, tap, key, sleep, log }) => {
//     await phone(390, 844);                         // or desktop(1366, 800)
//     await page('world-aviation');                  // a folder of the repo (or a full URL)
//     await ev(`I18N.set('en'); Career.new({ pilot: 'Test' }); UI.tab = 'career'; UI.showOps()`);
//     await shot('career');                          // <out-dir>/career.png
//     log(await ev(`Career.rank().licence`));
//   };
//
//   page(folderOrUrl, waitMs = 2500)  open index.html of a repo folder (file://) and wait
//   phone(w, h) / desktop(w, h)       the viewport: a phone is 2× pixels, touch, pointer: coarse
//   ev(js)                            evaluate in the page (awaits promises), returns the value as
//                                     JSON-able data, or 'EXC: …' if it threw
//   shot(name)                        a PNG screenshot of the viewport
//   tap(x, y)                         a touch tap (a phone) — click(x, y) is the mouse one
//   key(key, code, modifiers)         a key press, e.g. key('Enter', 'Enter'), key('6', 'Digit6', 1) = Alt+6
//   sleep(ms), log(...)               a pause, and a line on the output
//   send(method, params)              any raw DevTools command

const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const port = +opt('--port', 9333);
const limitS = +opt('--limit', 120);
if (!args[0]) { console.error('usage: node --experimental-websocket tools/cdp.js <steps.js> [out-dir] [--port N] [--limit S]'); process.exit(2); }
if (typeof WebSocket === 'undefined') { console.error('needs a global WebSocket: run node with --experimental-websocket (Node 20)'); process.exit(2); }
const steps = require(path.resolve(args[0]));
const out = path.resolve(args[1] || path.join(os.tmpdir(), 'cdp-out'));
fs.mkdirSync(out, { recursive: true });
const repo = path.resolve(__dirname, '..');

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome not found'); process.exit(2); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-profile-'));
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + port, '--user-data-dir=' + profile,
  '--enable-unsafe-swiftshader', '--no-first-run', 'about:blank'], { stdio: 'ignore' });

// Chrome and its GPU / renderer children: on Windows only taskkill /T takes them all
let stopped = false;
function stop(code) {
  if (stopped) return;
  stopped = true;
  if (process.platform === 'win32') spawn('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
  else chrome.kill('SIGKILL');
  setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* still locked */ } process.exit(code); }, 1500);
}
setTimeout(() => { console.error('time limit of ' + limitS + ' s reached'); stop(1); }, limitS * 1000).unref();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let tabs = null;
  for (let i = 0; i < 150 && !tabs; i++) {
    try { tabs = await (await fetch('http://127.0.0.1:' + port + '/json')).json(); } catch (e) { await sleep(200); }
  }
  const tab = tabs && tabs.find((t) => t.type === 'page');
  if (!tab) { console.error('Chrome did not start (port ' + port + ' busy?)'); stop(1); return; }
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => { ws.onopen = r; });
  let id = 0;
  const pending = {};
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
    if (d.method === 'Runtime.exceptionThrown') {
      const x = d.params.exceptionDetails;
      console.log('PAGE EXCEPTION ' + ((x.exception && x.exception.description) || x.text).split('\n').slice(0, 3).join(' | '));
    }
    if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) {
      console.log('PAGE ' + d.params.type.toUpperCase() + ' ' + d.params.args.map((a) => a.value !== undefined ? a.value : a.description).join(' ').slice(0, 400));
    }
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Runtime.enable');
  await send('Page.enable');

  const api = {
    send, sleep,
    log: (...a) => console.log(...a),
    page: async (where, waitMs = 2500) => {
      const url = /^[a-z]+:/.test(where) ? where : 'file:///' + path.join(repo, where, 'index.html').replace(/\\/g, '/');
      await send('Page.navigate', { url });
      await sleep(waitMs);
    },
    phone: async (w, h) => {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
      await send('Emulation.setEmitTouchEventsForMouse', { enabled: true, configuration: 'mobile' });
    },
    desktop: async (w, h) => {
      await send('Emulation.setTouchEmulationEnabled', { enabled: false });
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    },
    ev: async (expr) => {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.result.exceptionDetails) {
        const x = r.result.exceptionDetails;
        return 'EXC: ' + ((x.exception && x.exception.description) || x.text).split('\n')[0];
      }
      return r.result.result.value;
    },
    shot: async (name) => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      const file = path.join(out, name + '.png');
      fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
      return file;
    },
    tap: async (x, y) => {
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    },
    click: async (x, y) => {
      for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
    },
    key: async (key, code, modifiers = 0) => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, modifiers });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, modifiers });
    }
  };

  let code = 0;
  try { await steps(api); } catch (e) { console.log('STEPS FAILED ' + (e && e.stack || e)); code = 1; }
  console.log('screenshots: ' + out);
  ws.close();
  stop(code);
})();
