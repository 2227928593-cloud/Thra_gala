/* 测试入口：依次运行结构检查、核心套件、剧情可达性，输出汇总报告 */
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const tf = require('./tf');

const ROOT = path.resolve(__dirname, '..');
const only = process.argv[2];

(async () => {
  const t0 = Date.now();

  if (!only || only === 'structure') {
    console.log('══════ 结构完整性检查 (tests/structure.js) ══════\n');
    try {
      const out = execFileSync(process.execPath, [path.join(__dirname, 'structure.js')], { cwd: ROOT, encoding: 'utf8' });
      console.log(out.trim());
    } catch (e) {
      console.log((e.stdout || '').trim());
      console.log('(结构检查报告了问题，详见上表)');
    }
    console.log('');
  }

  if (!only || only === 'core') {
    console.log('══════ 核心功能套件 ══════');
    await require('./suite_core')();
    const s = tf.summary();
    console.log(s.text);
  }

  if (!only || only === 'plot') {
    console.log('\n══════ 剧情可达性套件 ══════');
    await require('./suite_plot')();
    const s = tf.summary();
    console.log(s.text);
  }

  if (!only || only === 'difficulty') {
    console.log('\n══════ 难度与资源后果套件 ══════');
    await require('./suite_difficulty')();
    const s = tf.summary();
    console.log(s.text);
  }

  console.log(`\n总耗时 ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})();