/* 极简测试框架 */
'use strict';
const results = [];
let current = '(未分组)';
const sections = new Set();

function section(name) { current = name; sections.add(name); }
async function test(name, fn) {
  const t0 = Date.now();
  try {
    await fn();
    results.push({ section: current, name, ok: true, ms: Date.now() - t0 });
    return true;
  } catch (e) {
    results.push({ section: current, name, ok: false, ms: Date.now() - t0, err: e && e.stack || String(e) });
    return false;
  }
}
function fail(msg) { throw new Error(msg); }
function ok(v, msg) { if (!v) fail(msg || `期望为真，实际 ${JSON.stringify(v)}`); }
function eq(a, b, msg) { if (a !== b) fail(`${msg || '值不相等'}：期望 ${JSON.stringify(b)}，实际 ${JSON.stringify(a)}`); }
function includes(hay, needle, msg) { if (!String(hay).includes(needle)) fail(`${msg || '不包含'}：${JSON.stringify(needle)} 不在 ${JSON.stringify(String(hay).slice(0, 200))}`); }
function notIncludes(hay, needle, msg) { if (String(hay).includes(needle)) fail(`${msg || '不应包含'}：${JSON.stringify(needle)} 出现在 ${JSON.stringify(String(hay).slice(0, 200))}`); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > tol) fail(`${msg || '数值超出容差'}：${a} vs ${b} (±${tol})`); }
/* 标记为"已知缺陷"，失败也算通过但单独记录 */
const known = [];
async function testKnown(name, fn, note) {
  const passed = await test(name, fn);
  known.push({ name, note, fails: !passed });
}

function summary() {
  const bySection = new Map();
  for (const r of results) {
    if (!bySection.has(r.section)) bySection.set(r.section, []);
    bySection.get(r.section).push(r);
  }
  const pass = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok);
  let out = '';
  for (const [sec, rs] of bySection) {
    out += `\n【${sec}】\n`;
    for (const r of rs) {
      out += `  ${r.ok ? '✓' : '✗'} ${r.name}${r.ok ? '' : '   ← ' + r.err.split('\n')[0]}\n`;
      if (!r.ok && r.err) out += r.err.split('\n').slice(1, 4).map(l => '      ' + l.trim()).join('\n') + '\n';
    }
  }
  out += `\n合计 ${results.length} 项：通过 ${pass}，失败 ${failed.length}\n`;
  if (known.length) {
    out += `\n已知缺陷标记 ${known.length} 项：\n`;
    known.forEach(k => { out += `  ${k.fails ? '已复现' : '未复现'}  ${k.name}\n         ${k.note}\n`; });
  }
  return { text: out, pass, failed, results, known };
}

module.exports = { section, test, testKnown, ok, eq, includes, notIncludes, near, fail, summary, results, known };