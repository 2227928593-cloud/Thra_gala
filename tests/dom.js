/* =========================================================
   零依赖最小 DOM 实现（仅供测试用）
   目的：在 Node 里加载真实的 index.html + js/engine.js，跑真实引擎逻辑。
   覆盖 engine.js 实际用到的能力：querySelector(All)（含 :not / [attr] / 后代组合）、
   classList、dataset、style、innerHTML 解析、事件派发、closest。
   ========================================================= */
'use strict';

const VOID_TAGS = new Set(['img', 'input', 'meta', 'link', 'br', 'hr', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);

/* ---------------- classList ---------------- */
class ClassList {
  constructor(el) { this.el = el; }
  _list() { return (this.el._class || '').split(/\s+/).filter(Boolean); }
  _set(a) { this.el._class = [...new Set(a)].join(' '); }
  add(...cs) { const a = this._list(); cs.forEach(c => { if (c && !a.includes(c)) a.push(c); }); this._set(a); }
  remove(...cs) { this._set(this._list().filter(x => !cs.includes(x))); }
  contains(c) { return this._list().includes(c); }
  toggle(c, force) {
    const has = this.contains(c);
    const want = force === undefined ? !has : !!force;
    if (want) this.add(c); else this.remove(c);
    return want;
  }
  get length() { return this._list().length; }
  item(i) { return this._list()[i] || null; }
  toString() { return this.el._class || ''; }
}

/* ---------------- 选择器引擎 ---------------- */
function parseCompound(str) {
  const c = { tag: null, id: null, classes: [], attrs: [], nots: [] };
  let i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '#') { let j = i + 1; while (j < str.length && /[\w-]/.test(str[j])) j++; c.id = str.slice(i + 1, j); i = j; }
    else if (ch === '.') { let j = i + 1; while (j < str.length && /[\w-]/.test(str[j])) j++; c.classes.push(str.slice(i + 1, j)); i = j; }
    else if (ch === '[') {
      const j = str.indexOf(']', i);
      const body = str.slice(i + 1, j);
      const m = /^([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\]]*)))?$/.exec(body.trim());
      if (m) c.attrs.push({ name: m[1], value: m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] });
      i = j + 1;
    } else if (str.startsWith(':not(', i)) {
      let depth = 1, j = i + 5;
      while (j < str.length && depth > 0) { if (str[j] === '(') depth++; else if (str[j] === ')') depth--; if (depth > 0) j++; }
      c.nots.push(parseCompound(str.slice(i + 5, j)));
      i = j + 1;
    } else if (/[\w*-]/.test(ch)) { let j = i; while (j < str.length && /[\w*-]/.test(str[j])) j++; c.tag = str.slice(i, j).toLowerCase(); i = j; }
    else i++;
  }
  return c;
}
function parseSelector(sel) {
  return sel.split(',').map(s => s.trim()).filter(Boolean)
    .map(part => part.split(/\s+/).filter(Boolean).map(parseCompound));
}
function matchesCompound(el, c) {
  if (!el || el.nodeType !== 1) return false;
  if (c.tag && c.tag !== '*' && el.tagName.toLowerCase() !== c.tag) return false;
  if (c.id && el.getAttribute('id') !== c.id) return false;
  for (const cl of c.classes) if (!el.classList.contains(cl)) return false;
  for (const a of c.attrs) {
    if (!el.hasAttribute(a.name)) return false;
    if (a.value !== undefined && el.getAttribute(a.name) !== a.value) return false;
  }
  for (const n of c.nots) if (matchesCompound(el, n)) return false;
  return true;
}
function matchesChain(el, chain) {
  if (!matchesCompound(el, chain[chain.length - 1])) return false;
  let idx = chain.length - 2;
  let cur = el.parentNode;
  while (idx >= 0 && cur) {
    if (matchesCompound(cur, chain[idx])) idx--;
    cur = cur.parentNode;
  }
  return idx < 0;
}

/* ---------------- Element ---------------- */
let EID = 0;
class Element {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = String(tagName).toUpperCase();
    this.ownerDocument = ownerDocument;
    this.childNodes = [];
    this.parentNode = null;
    this._attrs = new Map();
    this._class = '';
    this._listeners = new Map();
    this._text = '';
    this._uid = ++EID;
    this.classList = new ClassList(this);
    this.style = makeStyle();
    this.dataset = makeDataset(this);
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.title = '';
    this.onclick = null;
    this.onerror = null;
    this.onload = null;
  }
  /* 与浏览器一致：src / alt 会反映到属性上（engine.js 用 getAttribute('src') 判断是否换背景） */
  get src() { return this.getAttribute('src') || ''; }
  set src(v) { this.setAttribute('src', v); }
  get alt() { return this.getAttribute('alt') || ''; }
  set alt(v) { this.setAttribute('alt', v); }
  get href() { return this.getAttribute('href') || ''; }
  set href(v) { this.setAttribute('href', v); }
  /* hidden 是反映属性：设置 property 必须同步 attribute（engine.js 用 .modal:not([hidden]) 选择器） */
  get hidden() { return this.hasAttribute('hidden'); }
  set hidden(v) { if (v) this._attrs.set('hidden', ''); else this._attrs.delete('hidden'); }
  get id() { return this.getAttribute('id') || ''; }
  set id(v) { this.setAttribute('id', v); }
  get className() { return this._class; }
  set className(v) { this._class = String(v || ''); }
  get children() { return this.childNodes.filter(n => n.nodeType === 1); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get offsetWidth() { return 0; }
  get offsetHeight() { return 0; }

  get textContent() {
    if (!this.childNodes.length) return this._text;
    return this.childNodes.map(n => n.nodeType === 1 ? n.textContent : n.text).join('');
  }
  set textContent(v) { this.childNodes = []; this._text = v == null ? '' : String(v); }

  get innerHTML() { return this.childNodes.map(serialize).join(''); }
  set innerHTML(html) {
    this.childNodes = [];
    this._text = '';
    const frag = parseHTML(String(html == null ? '' : html), this.ownerDocument);
    frag.childNodes.slice().forEach(n => this.appendChild(n));
  }

  setAttribute(n, v) {
    n = String(n);
    this._attrs.set(n, String(v));
    if (n === 'class') this._class = String(v);
  }
  getAttribute(n) { return this._attrs.has(String(n)) ? this._attrs.get(String(n)) : null; }
  hasAttribute(n) { return this._attrs.has(String(n)); }
  removeAttribute(n) { this._attrs.delete(String(n)); if (String(n) === 'class') this._class = ''; }

  appendChild(node) {
    if (!node) return node;
    // DocumentFragment：插入其所有子节点（与浏览器一致）
    if (node.nodeType === 11) {
      node.childNodes.slice().forEach(c => this.appendChild(c));
      node.childNodes = [];
      return node;
    }
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.push(node);
    return node;
  }
  append(...nodes) { nodes.forEach(n => this.appendChild(typeof n === 'string' ? this.ownerDocument.createTextNode(n) : n)); }
  insertBefore(node, ref) {
    const i = ref ? this.childNodes.indexOf(ref) : -1;
    node.parentNode = this;
    if (i < 0) this.childNodes.push(node); else this.childNodes.splice(i, 0, node);
    return node;
  }
  removeChild(node) {
    const i = this.childNodes.indexOf(node);
    if (i >= 0) { this.childNodes.splice(i, 1); node.parentNode = null; }
    return node;
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  contains(n) { for (let c = n; c; c = c.parentNode) if (c === this) return true; return false; }

  querySelector(sel) { const r = this.querySelectorAll(sel); return r[0] || null; }
  querySelectorAll(sel) {
    const groups = parseSelector(sel);
    const out = [];
    const walk = el => {
      for (const ch of el.childNodes) {
        if (ch.nodeType !== 1) continue;
        if (groups.some(g => matchesChain(ch, g))) { if (!out.includes(ch)) out.push(ch); }
        walk(ch);
      }
    };
    walk(this);
    return out;
  }
  closest(sel) {
    const groups = parseSelector(sel);
    for (let c = this; c && c.nodeType === 1; c = c.parentNode) if (groups.some(g => matchesChain(c, g))) return c;
    return null;
  }

  addEventListener(type, fn) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(fn);
  }
  removeEventListener(type, fn) {
    const a = this._listeners.get(type);
    if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }
  }
  dispatchEvent(ev) {
    ev.target = ev.target || this;
    ev.currentTarget = this;
    const direct = this._listeners.get(ev.type) || [];
    const inline = ev.type === 'click' ? this.onclick : ev.type === 'error' ? this.onerror : ev.type === 'load' ? this.onload : null;
    [...direct, ...(inline ? [inline] : [])].forEach(fn => { if (!ev._stopped) { try { fn.call(this, ev); } catch (e) { throw e; } } });
    // 冒泡
    if (!ev._stopped && this.parentNode && this.parentNode.dispatchEvent) this.parentNode.dispatchEvent(ev);
    return !ev.defaultPrevented;
  }
  getBoundingClientRect() { return { left: 0, top: 0, right: 1440, bottom: 900, width: 1440, height: 900, x: 0, y: 0 }; }
  focus() {} blur() {} click() { this.dispatchEvent(makeEvent('click', { target: this })); }
  scrollIntoView() {}
}

class TextNode {
  constructor(text) { this.nodeType = 3; this.text = String(text); this.parentNode = null; }
  get textContent() { return this.text; }
  set textContent(v) { this.text = String(v); }
  get nodeValue() { return this.text; }
}

function makeStyle() {
  const s = {};
  s.setProperty = (k, v) => { s[k] = v; };
  s.getPropertyValue = k => s[k] || '';
  s.removeProperty = k => { delete s[k]; };
  return s;
}
function camel(k) { return k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
function kebab(k) { return k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()); }
function makeDataset(el) {
  return new Proxy({}, {
    get(_, k) { return el.getAttribute('data-' + kebab(String(k))); },
    set(_, k, v) { el.setAttribute('data-' + kebab(String(k)), v); return true; },
    has(_, k) { return el.hasAttribute('data-' + kebab(String(k))); },
    deleteProperty(_, k) { el.removeAttribute('data-' + kebab(String(k))); return true; },
    ownKeys() { return [...el._attrs.keys()].filter(a => a.startsWith('data-')).map(a => camel(a.slice(5))); },
    getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; }
  });
}

function makeEvent(type, props = {}) {
  const ev = {
    type, target: null, currentTarget: null, defaultPrevented: false, _stopped: false,
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() { this._stopped = true; },
    ...props
  };
  return ev;
}

function serialize(n) {
  if (n.nodeType === 3) return n.text;
  const tag = n.tagName.toLowerCase();
  const attrs = [...n._attrs.entries()].map(([k, v]) => ` ${k}="${v}"`).join('');
  if (VOID_TAGS.has(tag)) return `<${tag}${attrs}>`;
  return `<${tag}${attrs}>${n.childNodes.map(serialize).join('')}</${tag}>`;
}

/* ---------------- HTML 解析（容错，够用即可） ---------------- */
function parseHTML(html, doc) {
  const root = doc ? doc.createElement('#fragment') : new Element('#fragment', doc);
  const stack = [root];
  let i = 0;
  const top = () => stack[stack.length - 1];
  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt < 0) { if (i < html.length) top().appendChild(new TextNode(html.slice(i))); break; }
    if (lt > i) top().appendChild(new TextNode(html.slice(i, lt)));
    if (html.startsWith('<!--', lt)) { const e = html.indexOf('-->', lt); i = e < 0 ? html.length : e + 3; continue; }
    if (html.startsWith('<!', lt)) { const e = html.indexOf('>', lt); i = e < 0 ? html.length : e + 1; continue; }
    if (html.startsWith('</', lt)) {
      const e = html.indexOf('>', lt);
      const name = html.slice(lt + 2, e).trim().toLowerCase();
      for (let k = stack.length - 1; k > 0; k--) {
        if (stack[k].tagName.toLowerCase() === name) { stack.length = k; break; }
      }
      i = e + 1; continue;
    }
    // 开标签
    let j = lt + 1, name = '';
    while (j < html.length && /[^\s/>]/.test(html[j])) name += html[j++];
    const el = new Element(name, doc);
    // 属性
    while (j < html.length && html[j] !== '>') {
      while (j < html.length && /\s/.test(html[j])) j++;
      if (html[j] === '/' || html[j] === '>') break;
      let an = '';
      while (j < html.length && /[^\s=/>]/.test(html[j])) an += html[j++];
      if (!an) { j++; continue; }
      let av = '';
      while (j < html.length && /\s/.test(html[j])) j++;
      if (html[j] === '=') {
        j++;
        while (j < html.length && /\s/.test(html[j])) j++;
        const q = html[j];
        if (q === '"' || q === "'") { j++; const e = html.indexOf(q, j); av = html.slice(j, e); j = e + 1; }
        else { while (j < html.length && /[^\s>]/.test(html[j])) av += html[j++]; }
      }
      el.setAttribute(an, av);
    }
    const selfClose = html[j - 1] === '/' || VOID_TAGS.has(name.toLowerCase());
    top().appendChild(el);
    if (!selfClose) stack.push(el);
    const gt = html.indexOf('>', j);
    i = gt < 0 ? html.length : gt + 1;
  }
  return root;
}

/* ---------------- document / window ---------------- */
function createEnvironment(html, opts = {}) {
  const doc = {
    nodeType: 9, _listeners: new Map(), childNodes: [], _uid: ++EID,
    createElement(tag) { return new Element(tag, doc); },
    createTextNode(t) { return new TextNode(t); },
    createDocumentFragment() { const f = new Element('#fragment', doc); f.nodeType = 11; return f; },
    querySelector(sel) { return doc.documentElement.querySelector(sel); },
    querySelectorAll(sel) { return doc.documentElement.querySelectorAll(sel); },
    getElementById(id) { return doc.documentElement.querySelector('#' + id); },
    addEventListener(type, fn) { if (!doc._listeners.has(type)) doc._listeners.set(type, []); doc._listeners.get(type).push(fn); },
    removeEventListener(type, fn) { const a = doc._listeners.get(type); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
    dispatchEvent(ev) {
      ev.target = ev.target || doc;
      const direct = doc._listeners.get(ev.type) || [];
      direct.forEach(fn => { try { fn.call(doc, ev); } catch (e) { throw e; } });
      return !ev.defaultPrevented;
    }
  };
  const root = parseHTML(html, doc);
  // 找到 <html> 作为 documentElement
  let htmlEl = root.childNodes.find(n => n.nodeType === 1 && n.tagName === 'HTML');
  if (!htmlEl) { htmlEl = doc.createElement('html'); root.childNodes.forEach(n => htmlEl.appendChild(n)); }
  htmlEl.parentNode = doc;
  doc.documentElement = htmlEl;
  doc.body = htmlEl.querySelector('body') || (() => { const b = doc.createElement('body'); htmlEl.appendChild(b); return b; })();
  doc.head = htmlEl.querySelector('head') || doc.createElement('head');

  const listeners = new Map();
  const win = {
    document: doc,
    _listeners: listeners,
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
    removeEventListener(type, fn) { const a = listeners.get(type); if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
    dispatchEvent(ev) { (listeners.get(ev.type) || []).forEach(fn => fn.call(win, ev)); return true; },
    location: { href: 'http://127.0.0.1/index.html', search: opts.search || '', hash: '', pathname: '/index.html', origin: 'http://127.0.0.1' },
    navigator: { userAgent: 'DSH-TestHarness', language: 'zh-CN' },
    getComputedStyle: (el) => ({ display: el && el.hidden ? 'none' : 'block', opacity: '1' }),
    innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    requestAnimationFrame: (fn) => setTimeout(() => fn(Date.now()), 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    __events: makeEvent
  };
  win.window = win;
  win.self = win;
  win.top = win;
  // Image
  win.Image = class Image extends Element {
    constructor() { super('img', doc); }
  };
  return { doc, win, root, htmlEl };
}

/* ---------------- localStorage ---------------- */
function createLocalStorage(store = new Map()) {
  return {
    getItem: k => (store.has(String(k)) ? store.get(String(k)) : null),
    setItem: (k, v) => { store.set(String(k), String(v)); },
    removeItem: k => { store.delete(String(k)); },
    clear: () => store.clear(),
    key: i => [...store.keys()][i] ?? null,
    get length() { return store.size; },
    _store: store
  };
}

/* ---------------- 事件派发辅助 ---------------- */
function click(el) { el.dispatchEvent(makeEvent('click', { target: el })); }
function keydown(doc, key) {
  doc.dispatchEvent(makeEvent('keydown', { key, target: doc.body, preventDefault() { this.defaultPrevented = true; } }));
}

module.exports = { Element, TextNode, createEnvironment, createLocalStorage, parseHTML, makeEvent, click, keydown };