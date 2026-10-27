/* =========================================================
   零依赖 CDP 客户端：用 Node 内置 WebSocket 驱动本机 Edge/Chrome
   附：一个只读静态文件服务器（用于给 file:// 之外的正常 http 源，
   这样才能测到真实的 localStorage / fetch 行为）

   ⚠ 当前环境下不可用（保留备查）：
     本沙箱会终止 Node 直接 spawn 出来的浏览器进程（退出码 0x80000003），
     由 PowerShell 启动的 headless 实例其 CDP 端口也不稳定，
     因此正式测试走的是 tests/harness.js 的"真实引擎 + 最小 DOM"方案。
     若在放开的环境（本机命令行）中运行，本文件可以正常驱动浏览器。
   ========================================================= */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8'
};

function serve(root, port = 0) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      let p = path.join(root, url === '/' ? 'index.html' : url);
      if (!p.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
      fs.readFile(p, (err, data) => {
        if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + url); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.on('error', reject);
    srv.listen(port, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

/* ---------- 找到本机浏览器 ---------- */
const CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
];
function findBrowser() {
  for (const c of CANDIDATES) if (fs.existsSync(c)) return c;
  throw new Error('未找到 Edge/Chrome');
}

/* ---------- 启动浏览器（stdio: ignore，避免沙箱管道限制） ---------- */
async function launch(opts = {}) {
  const exe = findBrowser();
  const port = opts.port || (9000 + Math.floor(Math.random() * 900));
  const userDir = path.join(require('os').tmpdir(), 'thragal-e2e-' + port + '-' + Date.now());
  const args = [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required', '--mute-audio',
    '--window-size=1440,900',
    `--remote-debugging-port=${port}`, `--user-data-dir=${userDir}`,
    'about:blank'
  ];
  const child = spawn(exe, args, { stdio: 'ignore', detached: false });
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 30000;
  let ver = null;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(base + '/json/version');
      if (r.ok) { ver = await r.json(); break; }
    } catch (e) { /* 还没起来 */ }
    await new Promise(r => setTimeout(r, 250));
  }
  if (!ver) { try { child.kill(); } catch (e) {} throw new Error('浏览器 CDP 端口未就绪'); }
  return {
    child, port, base, version: ver, userDir,
    async close() {
      try { await fetch(base + '/json/close/' + (await listTargets(base)).map(t => t.id).join(',')); } catch (e) {}
      try { child.kill(); } catch (e) {}
      await new Promise(r => setTimeout(r, 400));
      try { fs.rmSync(userDir, { recursive: true, force: true }); } catch (e) {}
    }
  };
}

async function listTargets(base) {
  const r = await fetch(base + '/json/list');
  return r.json();
}

/* ---------- WebSocket 上的最小 CDP 会话 ---------- */
class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = [];
    this.consoleLogs = [];
    this.pageErrors = [];
    this.failedRequests = [];
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message + ' ' + JSON.stringify(msg.error.data || '')));
        else resolve(msg.result);
        return;
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        this.consoleLogs.push({
          type: msg.params.type,
          text: (msg.params.args || []).map(a => a.value !== undefined ? String(a.value) : (a.description || a.type)).join(' ')
        });
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.pageErrors.push(d.exception ? (d.exception.description || d.exception.value) : d.text);
      } else if (msg.method === 'Log.entryAdded') {
        const e = msg.params.entry;
        if (e.level === 'error') this.pageErrors.push(`[${e.source}] ${e.text}`);
      } else if (msg.method === 'Network.loadingFailed') {
        this.failedRequests.push(msg.params.errorText + ' ' + (msg.params.type || ''));
      }
      this.listeners.forEach(l => l(msg));
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify(payload));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('CDP 超时: ' + method)); } }, 30000);
    });
  }
  on(fn) { this.listeners.push(fn); }
  waitFor(method, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('等待事件超时: ' + method)), timeout);
      this.on(msg => { if (msg.method === method) { clearTimeout(t); resolve(msg.params); } });
    });
  }
  async evaluate(expr, opts = {}) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: !!opts.awaitPromise, userGesture: true
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('页面求值异常: ' + (d.exception ? (d.exception.description || d.exception.value) : d.text));
    }
    return r.result.value;
  }
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', e => rej(new Error('WebSocket 连接失败')), { once: true });
  });
  return new Session(ws);
}

/* ---------- 打开一个页面并接入 ---------- */
async function newPage(browser) {
  const bws = await connect(browser.version.webSocketDebuggerUrl);
  const { targetId } = await bws.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await bws.send('Target.attachToTarget', { targetId, flatten: true });
  const page = new Session(bws.ws);
  page.sessionId = sessionId;
  page.targetId = targetId;
  // 把 send 绑定到该 target 的 session
  const rawSend = page.send.bind(page);
  page.send = (m, p = {}) => rawSend(m, p, sessionId);
  page.evaluate = async (expr, opts = {}) => {
    const r = await page.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: !!opts.awaitPromise, userGesture: true
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error('页面求值异常: ' + (d.exception ? (d.exception.description || d.exception.value) : d.text));
    }
    return r.result.value;
  };
  await page.send('Runtime.enable');
  await page.send('Log.enable');
  await page.send('Page.enable');
  await page.send('Network.enable');
  page.navigate = async (url) => {
    const p = await page.send('Page.navigate', { url });
    if (p.errorText) throw new Error('导航失败: ' + p.errorText);
    return p;
  };
  page.screenshot = async (file) => {
    const r = await page.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    return file;
  };
  page.close = () => bws.send('Target.closeTarget', { targetId });
  page.browserSession = bws;
  return page;
}

module.exports = { serve, launch, connect, newPage, findBrowser, Session, listTargets };