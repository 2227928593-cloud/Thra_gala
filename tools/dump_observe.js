/* 导出观察点 + 立绘落位，供叠加核对 */
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.resolve(__dirname, '..');
const sb = { console }; sb.window = sb; vm.createContext(sb);
for (const f of ['js/data.js', 'js/story2.js', 'js/story3.js', 'js/story4.js'])
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sb, { filename: f });
const N = sb.window.STORY.nodes;
const out = [];
for (const [id, n] of Object.entries(N)) {
  if (!n.observe || !n.observe.length) continue;
  const cast = (n.cast || []).map(c => {
    const scale = c.scale || 92;
    const h = scale / 100 * 0.78 * 900;          // 立绘高度（px，按 900 高舞台）
    const w = h * 1016 / 1416;                    // 立绘宽度（px）
    let cx;
    if ((n.cast || []).length > 1) cx = (16 + (n.cast || []).indexOf(c) * 34) / 100 * 1600;
    else if (c.pos === 'left') cx = (0.03 * 1600) + w / 2;
    else if (c.pos === 'center') cx = 800;
    else cx = (0.97 * 1600) - w / 2;
    return { id: c.id, cx, w, h };
  });
  out.push({ node: id, scene: n.scene, obs: n.observe.map(o => ({ label: o.label, x: o.x, y: o.y })), cast });
}
fs.writeFileSync(path.join(root, 'tools', '_obs.json'), JSON.stringify(out), 'utf8');
console.log('nodes', out.length, 'hotspots', out.reduce((a, b) => a + b.obs.length, 0));