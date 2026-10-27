# 理智值（sanity）与"去周目锁" · 技术落点评估

> 状态：**只读评估，未改任何 `js/` / `tests/` / `design/` 文件**（本轮唯一产物就是这份文档）。
> 目的：在动手之前把"改哪里、动多少、哪里会翻车"钉死，供主理人审。
> 代码基线：`js/engine.js`（2141 行，`SAVE_VERSION = 2`）、`tests/run.js` 157/157、`qa_time` 14/14、`qa_proofs` 56/56。

---

## 0. 结论摘要

| 项 | 结论 |
|---|---|
| 引擎改动面 | **小**。`check()` 两行、`freshState()` 一行、`normalizeStats()` 一行、`lockedHintFor()` 一个分支；存档/快照/迁移**自动兼容**（`stats` 是整体展开 + 按键遍历补水） |
| 数据改动面 | **中**。要给选项/线索加 `minSanity`，还要决定"哪些行为扣理智"（这一步比加字段重要得多） |
| 测试改动面 | **中**。`structure.js` 条件白名单必须同步；`suite_core` 的"5 个菜单项"会红（若拆掉标题页周目锁）；`120 次随机通关` 有**软锁**暴露风险 |
| 最大风险 | 确认主理人的判断：**理智锁必通选项 → 软锁**。而且现有引擎**没有"全部选项都锁住"的兜底**（见 §5、§7.1），这是最危险的一处 |
| 建议的规模 | 引擎 **S**（约 30–50 行）/ 数据 **M** / 测试 **M** |

一句话建议：**理智只允许锁"更好/更狠"的分支，永远不锁"活下去必须走的那条"**；并且先给引擎加一条"全锁兜底"，再让数据碰 `minSanity`。

---

## 1. 选项条件：`when` 判定在哪、要改哪几处

### 1.1 现有链路（按执行顺序）

| 环节 | 位置 | 说明 |
|---|---|---|
| 条件求值 | `js/engine.js:1579 check(cond)` | 纯函数式顺序判断：`flag / notFlag / clue / item / minEyes / minKnock / maxBattery / minBattery / minCorruption / minSurvivors / maxCorruption / allClues` |
| 结果落到按钮 | `js/engine.js:1343`（`renderChoices` 内） | `const ok = !c.disabled && (!c.when || check(c.when))`；`!ok` → `btn.classList.add('locked')`、`aria-disabled="true"`、`req` 文本换成 `lockedHintFor(c)` |
| 锁定提示文案 | `js/engine.js:1389 lockedHintFor(c)` | 按档位分三档：故事档说 `c.lockedHint`，标准「你不知道该怎么做」，噩梦「你做不到」 |
| 点击拦截 | `js/engine.js:1362-1364` | `if (btn.classList.contains('locked')) { toast(...); return; }` —— 锁住的按钮**仍然可聚焦、可点击**，只是给提示 |
| 数字键 1–9 | `js/engine.js:387-390` | `$$('.choice:not(.locked)')[Number(e.key) - 1]` —— **注意：这是"第 N 个未锁按钮"，不是"编号为 N 的按钮"**（见 §5.3 的既有隐患） |
| 行内条件 | `js/engine.js:988`（`playFrom` 内） | `if (line.when && !check(line.when)) continue;` —— 台词级 `when` 走同一个 `check()` |
| 自动驱动 | `tests/harness.js:222-231`（`playthrough`）、`tests/qa_driver.js:120-140`、`tests/suite_plot.js:19 pickFrom` / `:71` / `:240` | 全部用 `!c.locked` 过滤；`pick` 返回 `null` 时各自报 `stall: 'no-choice-picked'` |

### 1.2 新增 `minSanity` / `maxSanity` 要改的确切位置

| # | 文件:行 | 改动 |
|---|---|---|
| 1 | `js/engine.js:1594`（`check()` 尾部：`maxCorruption`(1593) 之后、`allClues`(1594) 之前） | `if (cond.minSanity != null && (state.stats.sanity ?? 100) < cond.minSanity) return false;`<br>`if (cond.maxSanity != null && (state.stats.sanity ?? 100) > cond.maxSanity) return false;` |
| 2 | `js/engine.js:1389 lockedHintFor()` | 加一个理智分支（否则理智不足会复用「你做不到」，玩家分不清是缺线索还是吓傻了）。建议：`c.sanityHint || '你的手在抖，看不清该选哪个'`（故事档仍优先 `c.lockedHint`） |
| 3 | `tests/structure.js:85 COND_KEYS` | 白名单加 `'minSanity'`, `'maxSanity'`，否则每个用到的节点都会被报「未知条件（会被静默忽略）」 |
| 4 | `tools/validate.js:79 checkCond()` | 加取值范围校验（0–100 整数），避免数据写 `minSanity: 60` 却把 `sanity` 初始成 40 这种静默不可达 |

> 只改这 4 处就够，**不需要动 `renderChoices` 的主干**——`ok` 的判定已经是"`check()` 说了算"。

---

## 2. 状态与存档

### 2.1 `sanity` 落在 `state.stats` 里

| 位置 | 现状 | 要做什么 |
|---|---|---|
| `js/engine.js:486-489 freshState().stats` | `clock / knock / eyes / corruption / battery / survivors / minutes` | 加 `sanity: 100` |
| `js/engine.js:514 snapshot()` | `stats: { ...state.stats }` 整体展开 | **无需改动**（自动带上 sanity） |
| `js/engine.js:544 migrateSave()` | `for (const k of Object.keys(s.stats))` 以 `freshState()` 为底、逐个键尝试 `+raw[k]` | **无需改动**：旧存档没有 `sanity` → 保持 `freshState` 的 100 |
| `js/engine.js:969 normalizeStats()` | 只夹 `battery` / `corruption` | 加 `if (s.sanity != null) s.sanity = clamp(s.sanity, 0, 100);` |
| `js/engine.js:1645 applyEffects()` 的 `fx.stats` | 通用累加 `state.stats[k] = (state.stats[k]‖0) + fx.stats[k]` | **无需改动**：数据写 `effects: { stats: { sanity: -8 } }` 直接生效，末尾自动过 `normalizeStats()` |
| `js/engine.js:709-745 rollbackAfterDeath()` | 惩罚 → 夹 knock → 夹 corruption | 见 §3（建议**不**在回滚里夹 sanity，只让它随快照/连续值走） |
| `js/engine.js:16 SAVE_VERSION` | `2` | **不必升**（见 2.3） |

### 2.2 旧存档缺 `sanity`：默认 **100**，不是 0

理由（按重要性）：

1. **语义正确**：0 在语义上是"已经吓傻/崩溃"，会让旧存档一读进来就落在所有 `minSanity` 门槛之下——玩家会因为"游戏更新"而突然失去已有选项的可选性，这是最糟的兼容事故。
2. **`maxSanity` 反向门槛会误伤**：如果将来有 `maxSanity`（"你已经不太像人了，看不懂人话"），默认 0 会让旧档**绕过**这类门槛，白送增益。
3. **读档不增不减**：`migrateSave` 的原则是"缺字段用默认值补，绝不因为少一个键丢档/改档"。100 是中性值（不是满 buff，也不触发任何下限）。

### 2.3 `SAVE_VERSION` 要不要从 2 升到 3

**建议不升**（保持 2），理由：

- 引擎读档逻辑是"以 `freshState()` 为底 + 按键补水"，新增一个 `stats` 键**天然向后兼容**，升版本号不带来任何行为收益；
- 反向不兼容（新档给旧引擎读）在本项目里不存在（同一份代码）；
- 若为了遥测/排查想区分，可以升到 3，但那样 `migrateSave` 里要加一条"v<3 且无 sanity → 100"的显式分支——**纯冗余**，不建议。

> 唯一值得升版本的情形：将来要对旧档做**一次性数值换算**（例如把旧档的 corruption 折成 sanity）。本轮没有这种需求。

---

## 3. 回滚语义：理智"保留"还是"恢复"？

两条现有路径（`js/engine.js:660 deathTarget()`）：

| 档位 | `death.mode` | 回滚目标 | 资源 |
|---|---|---|---|
| 故事 | `node` | `state.nk`（本节点开头的完整快照） | **全部恢复**到进入节点时 |
| 标准 / 噩梦 | `rollback` | `{ ...snapshot(false), node: state.ck.node }`（当前状态 + 场景开头的位置） | **维持死亡当时的数值** |

### 3.1 两种选择对体验的影响

**A. 保留（跟标准/噩梦现有的"资源维持当时数值"一致）**

- 玩家死一次 → 理智不回升 → 下次走到同一个节点，原本能选的选项**还是不能选**；
- 好处：死亡有真实代价，"看清了不该看的东西"确实回不去；
- 坏处：如果理智正好卡在某个 `minSanity` 边上，会出现**"回滚 → 还是不够 → 只能走更差的分支 → 再死"**的循环（与 §7.1 的软锁是同一个根）。

**B. 恢复到 ck 快照（跟故事档一致）**

- 死在 e_absorb（理智/复苏爆表）后回滚，理智回到场景开头 → 玩家能重新做选择；
- 好处：回滚是"重来这一段"，逻辑自洽；不会因为一次失败永久失去分支；
- 坏处：**理智变成可以靠死亡刷回来的资源**——"先花理智看清全部，死了再回滚"成了最优解，把理智设计的张力抹平。

### 3.2 建议

**混合，按 `death.mode` 走现有语义（不加特例）**：

- 标准 / 噩梦：**保留**（当前值），但**必须加一条下限保护**：回滚后 `sanity = max(sanity, 该场景 ck 节点所需最低 minSanity + 1)`——这条不是"送理智"，而是"保证你回到的那个场景至少有一条路能走"（数据侧仍应遵守 §7 的不变量，这条只是兜底）；
- 故事：**随快照恢复**（它本来就恢复资源，理智不该例外）。

一句话：**不要为理智单独发明第三种回滚语义**，否则三档的存档规则会变得没人能讲清。

---

## 4. UI 落点

### 4.1 现有 HUD 槽位（`index.html`）

```
index.html:55  .hud-left   → #hud-chapter（章）· #hud-place（地点）
index.html:59  .hud-right  → #stat-clock  · #stat-diff  · #stat-knock
                            · #stat-eyes   · #stat-battery（<100% 才显示）
                            · #stat-corrupt（条状 #v-corrupt）
                            · 三个按钮（档案/回廊/菜单）
```
窄屏规则在 `css/style.css` 的 `@media (max-width:700px)`：`.hud-right{gap:10px}`、`.diff-stat{display:none}`、`.corrupt-stat .k,.eyes-stat .k{display:none}`。

`updateHUD()`（`js/engine.js:1696-1758`）已有一套成熟的"只在变化时更新 + `lastHUD` 记忆 + `pulseStat()`"模式，任何新槽位照抄即可。

### 4.2 显式条（要改的）

| 文件:行 | 改动 |
|---|---|
| `index.html:75` 之后 | 新增 `<div class="stat sanity-stat" id="stat-sanity"><span class="k">理智</span><span class="v" id="v-sanity">100</span></div>`（或复用 `.corrupt-stat .bar` 的条状写法） |
| `js/engine.js:1696 updateHUD()` | 加一段"变化才写 DOM + 下降时 `pulseStat('#stat-sanity')`" |
| `css/style.css`（`.corrupt-stat` 一带，约 300 行附近） | `.sanity-stat .v{...}` + 低理智时的变色；窄屏加 `display:none`（HUD 已经很挤） |

成本：**S**，但会加一份"玩家盯着数字玩"的心理负担，也和第 5 条"隐性"的设计意图相反。

### 4.3 隐性（推荐）：不占槽位，只在**跨越阈值**时给一次信号

最省的做法（**零 DOM 改动**，只在 `updateHUD` 里加 10 行）：

```js
/* 理智只做"隐性提示"：不给数字，只在跨过档位时响一次 */
const band = sanityBand();            // 0 稳 / 1 紧 / 2 崩（按固定阈值切）
if (lastHUD.sanityBand !== band) {
  lastHUD.sanityBand = band;
  document.body.classList.toggle('sanity-low', band >= 1);
  if (band >= 1) toast(band === 2 ? '你的手在抖。' : '你听见自己的呼吸变快了。', 'warn');
  if (window.Sound) Sound.play('heartbeat');
}
```
配套 CSS 只需一条：`body.sanity-low .story-text{ letter-spacing:.02em }` 之类的**极轻**变化，或干脆不加视觉，只留 toast + 心跳音。

- 不占 HUD、不写数字 → 不鼓励"抠数值"；
- 复用现有 `lastHUD` 模式与 `toast()`/`Sound.play()`，不动 HTML；
- 想更强再叠 `#stage.classList.add('shake')`（已有现成类与 `no-fx` 降级）。

> 建议：**先做隐性**。等数据显示"玩家完全意识不到理智在掉"再升级成显式条（决策成本最低）。

---

## 5. 锁定选项的表现

### 5.1 可见但灰（现状）

- DOM：`<button class="choice locked" aria-disabled="true">`，编号仍在（`num = i + 1`）；
- 视觉：`css/style.css:471 .choice.locked{opacity:.42; cursor:not-allowed}`；
- 键盘：数字键只索引 `:not(.locked)`，但**编号是按全部选项排的** → 见 5.3；
- 自动驱动：全部 `!c.locked` 过滤，**不会点灰按钮**。

### 5.2 完全不出现（渲染时过滤）

- `renderChoices` 里 `(n.choices||[]).forEach(...)` 处（`js/engine.js:1311-1314`）加一条 `if (c.hideWhenLocked && !ok) return;` 即可；
- 优点：不制造"看得见吃不着"的挫败；
- 缺点：玩家不知道"这里本来有别的活法"，也无法为下一次重玩留下线索感；对**必通选项**来说更糟（见 §7.1）。

### 5.3 一个**既有**隐患（本轮不修，但理智会放大它）

`renderChoices` 的编号是"全部选项的下标 + 1"（`js/engine.js:1346`），而数字键取的是"第 N 个**未锁**按钮"（`js/engine.js:389`）。只要列表里有锁住项，**按 3 可能触发编号 4 的选项**。

理智锁会显著增加锁定项数量 → 这个错配会被玩家当成"按键乱了"。建议本轮**顺手改成"按显示编号"**：给按钮 `dataset.num = i+1`，键盘用 `$$('.choice:not(.locked)').find(b => b.dataset.num === e.key)`。**这是一行级改动，但会让 1 条既有用例的数字键行为更符合直觉**（现有用例只按"第一个未锁项"，不会红）。

### 5.4 理智不足时的建议

| 选项类型 | 建议表现 |
|---|---|
| 普通分支（走另一条路也能活） | **可见但灰** + 专门的 `sanityHint`（保留"我知道这里有别的东西，但我做不到"的恐惧感） |
| **必通选项**（唯一继续路径 / 唯一能拿到关键线索的入口） | **不允许被 `minSanity` 锁**（数据不变量，见 §7.2）。引擎侧不提供"隐藏"选项来规避软锁 |

---

## 6. 测试影响（逐文件）

### 6.1 一定会红（必须先改）

| 文件:行 | 断言 | 为什么会红 |
|---|---|---|
| `tests/suite_core.js:23` | `eq(g.$$('#boot .menu-item').length, 5)`（用例名「标题页 5 个菜单项齐备」） | 若按"拆掉通关才能选"把标题页的「重走这一夜」改成**常驻**（`js/engine.js:301 refreshBoot()`，其中 `:317-319` 只在 `unlock.endings.length > 0` 时创建 `#btn-ng`），新玩家会看到 6 项 |
| `tests/structure.js:85` | `COND_KEYS` 白名单 | 数据一旦写 `minSanity`，每个节点都会报「未知条件（会被静默忽略）」→ `run.js` 的结构检查段变红 |
| `tools/validate.js:79` | `checkCond()` | 逻辑同上；不加校验则数据写错也静默通过 |

### 6.2 可能会红（取决于数据怎么改）

| 文件:行 | 断言 | 风险点 |
|---|---|---|
| `tests/suite_plot.js:233-257`（120 次随机通关） | `stalls.length === 0`（`:255-256`） | 随机玩家可能走进"全部选项都被理智锁住"的节点 → `pick` 返回 `null` → `stall:'no-choice-picked'`（`tests/harness.js:230`）→ 直接红。**这是最可能先炸的一条** |
| `tests/suite_plot.js:261` | `seenEndings.size >= 3` | 若理智让某些分支更难走到，随机覆盖的结局数会掉 |
| `tests/suite_plot.js:267` | 线索解锁数（`seenClues.size >= 18`） | 若关键线索入口被 `minSanity` 卡住，这条会掉 |
| `tests/suite_plot.js:19 pickFrom` / `:71` / `:82`（`POLICY`）+ `:68` 的 k13 优先 | 引导通关 | 现有引导按**文案**匹配（`/转过头/`、`/把所有人聚在一起/`）。删掉 `flag:'ng'` 的两处选项后，`data.js:268`（p5「不点。你记得听完之后…」）从第 3 个变成第 2 个 → `firstUnlocked` 的选择变了 → **敲门/电量预算随之变化**，`qa_time` 的 T3 余量（现在 P1 44 分 / P3 91 分）会偏移 |
| `tests/qa_time.js` §【1】【3】 | 三档 P1/P2/P3 的幕间 clock、f10 余额 | 同上：早期分支变化会改整条时间线。**改完必须重新基线，不要直接调断言** |
| `tests/qa_proofs.js` §5 | 7 结局可达 | 若理智锁住真结局的某个必需品（`ghost_domain` / `saw_sixth` 的入口），`e_true` 会变不可达 |

### 6.3 不会红但需要同步的文档

- `README.md`：「新玩家看到的标题仍然只有 5 项」「周目入口是通关后才动态加上的」需要改写；
- `docs/architecture/difficulty-engine.md`：资源表要加 sanity 一行（`§3.6 资源上下界`）。

---

## 7. 工作量与风险

### 7.1 最大风险：软锁（**确认主理人的判断**，并且比想象的更近）

引擎现在**没有"全部选项都锁住"的兜底**：

- `renderChoices`（`js/engine.js:1323-1328`）只处理**列表为空**（`!list.length` → 自动前进/结局）；
- 列表非空但**全部 `locked`** 时，玩家看到一排灰按钮，点任何一个都只弹 toast → **卡死**；
- 自动驱动更直接：`pick` 返回 `null` → `stall:'no-choice-picked'`（`tests/harness.js:230`、`tests/qa_driver.js:135`）。

**最容易软锁的一处**（具体到节点）：`f10`。

理由：`f10` 的 5 个选项里已有 **2 个被线索锁死**（`咬下手臂` 要 `allClues[eye_rule] + minEyes≥5 + maxCorruption≤60`；`鬼域` 要 `allClues[eye_rule] + minEyes≥5`），`纸上是这么写的` 还要 `item: paper`。如果再给其中任意一项加 `minSanity`，把一个"没拿到 `paper`、眼睛也不够"的玩家丢进 `f10`，剩下能点的只有「自己一个人冲出校门」和「闭上眼睛」——**如果这两条里再有一条被理智锁，就是硬软锁**。

次危险的是 `g7`（真结局需要 4 条线索 + 存活人数，`回头去找` 需要 `left_wang`）与 `k13`（3 个选项里 1 个要 `knock_rule`，另 2 个都通向 `e_door`）。

**缓解（引擎侧、建议同批做）**：
1. 引擎加"全锁兜底"：`renderChoices` 末尾若 `list.length > 0 && 全部 locked && n.next` → 渲染一个中性「继续」；
2. `tools/validate.js` 加**静态校验**：每个有 `choices` 的节点，至少要有一条 `when` 为空（或永远可满足）的出口；这是**零运行成本**的软锁守门；
3. 数据不变量（写进 GDD）：`minSanity` 只允许加在"非唯一出路"的选项上。

### 7.2 其他风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 理智的"扣法"没定义 | 加字段容易，**难的是"什么行为扣多少"**。如果没有扣法，`minSanity` 就是永不触发的死门槛 | 数据侧先定 3–5 条扣法（看见尸体 / 直视鬼 / 听满 N 下敲门 / 用鬼眼看 / 回滚一次），每条只在 1–2 处试水 |
| 与 `corruption` 语义重叠 | 两个"心智类"计量并排会让玩家分不清"复苏"和"理智" | 明确分工：`corruption` = 你**变成了什么**（力量/代价），`sanity` = 你**还能不能做正常判断**（选项可见性）；HUD 上二选一只显式展示一个 |
| 旧档默认 100 的反向门槛 | 若将来有 `maxSanity`，旧档会"绕过"它 | 默认值选中性 100，且 `maxSanity` 只用于**叙事变体**（不同台词），不用于锁路 |
| 回滚刷理智 | 若回滚恢复理智，玩家会主动死来刷 | 见 §3.2：标准/噩梦保留 |
| 与"去周目锁"的耦合 | 删掉 `flag:'ng'` 两处选项后，`p5`/`d1` 的首选项位置变化会改早期预算（`qa_time` 会偏） | 先删后**立刻重跑 `qa_time` 重新基线**，再调其它数值 |
| HUD 拥挤 | 窄屏已隐藏 `难度` | 隐性方案天然规避 |

### 7.3 工作量拆分

| 块 | 规模 | 内容 |
|---|---|---|
| 引擎 | **S**（约 30–50 行） | `check()` 2 行、`freshState` 1 行、`normalizeStats` 1 行、`lockedHintFor` 1 分支、`updateHUD` 隐性提示约 10 行、`renderChoices` 全锁兜底约 6 行、数字键改按显示编号约 3 行 |
| 数据 | **M** | 删 2 处 `flag:'ng'` 选项（+4 处 `ng` 台词决定是否保留）、给 8–12 个选项加 `minSanity`、定义扣法并在 10–20 处 `effects.stats` 里挂 `sanity` |
| 测试 | **M** | `structure.js`/`validate.js` 白名单与校验、`suite_core:23` 菜单项数、`suite_plot` 的 `POLICY` 与 120 次随机（可能要先加"全锁兜底"才绿）、`qa_time` 重新基线 |
| 文档 | **S** | README 的"5 项/周目"表述、`difficulty-engine.md` 资源表 |

---

## 8. 建议的实现顺序（审完后照此派单）

1. **引擎**：`sanity` 字段 + `check()` + `normalizeStats` + 全锁兜底 + 数字键按显示编号 + 隐性提示；
2. **工具**：`structure.js` / `validate.js` 白名单 + "每个节点至少一条无条件出口"的静态校验；
3. **测试基线**：先跑一遍（应当仍 157/157，因为数据还没用 `minSanity`）；
4. **数据**：先删 `flag:'ng'` 两处 → 立刻重跑 `qa_time` 重新基线；
5. **数据**：加扣法 + `minSanity`，每加 3–5 处跑一次 `tests/run.js` + `qa_*`；
6. **文档**：README / 架构文档同步。

---

## 附：本轮没有做的事（明确声明）

- 没有修改 `js/`、`tests/`、`design/` 下任何文件；
- 没有新增依赖、没有提交 git；
- 所有行号基于当前工作树（`engine.js` 2141 行、`tests/run.js` 157 项），实现时若有插入需重新对齐。
