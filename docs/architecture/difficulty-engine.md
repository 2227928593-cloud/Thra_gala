# 难度与资源后果 · 引擎架构（v2 · 已对齐策划定稿）

> 对应设计文档：`design/gdd/difficulty-redesign.md`（§4.1 代价模型 / §6 三档参数 / §10 接口约定）。
> 状态：**已落地**。`js/engine.js` 的 `DIFFICULTY` / `lightPlan` / `forcedTarget` / `snapshot`+`migrateSave` 区块。
> 验证：`node tests/run.js difficulty`（59 项）、`node tools/validate.js`、`node tests/structure.js`。

---

## 0. 边界与约束

| 约束 | 来源 | 对架构的直接影响 |
|---|---|---|
| 纯前端、零依赖、无构建 | 项目定位（双击即玩） | 不引框架/打包器；引擎自包含 |
| 传统 `<script>`，不能用 ES Module | `file://` 下 CORS 会拦 module | 不拆模块文件；`index.html` 的 script 顺序就是依赖图 |
| `tests/` 在 `vm` 沙箱里加载**真实** `index.html` + 全部 js | 现有测试体系 | 新能力必须能通过 `window.__game` 暴露，且不依赖真实 DOM API |
| 剧情字段**只增不改** | 接口约定 §10.1 | 不写新字段的节点，行为必须与改动前**逐帧一致** |
| 旧 `localStorage` 存档必须能读 | 玩家资产 | 存档带版本号 + `migrateSave()`；新字段一律可选 |

三条设计原则：

1. **引擎给策略，数据给内容。** 引擎不认识"厕所""鬼婴"，只认识 `battery < 30`、`knock >= 13`、`light: 2`、`rotAfter`。
2. **默认零影响。** 任何新字段/钩子，不写就等于不存在。
3. **表现层不硬编码数值。** 引擎只加 CSS class（`low-battery` / `dread-lv2` / `by-eye`），浓淡由 `css/style.css` 决定。

---

## 1. 分层

```
┌────────────────────────────────────────────────────────────┐
│ 表现层  css/style.css                                       │
│  .low-battery / .bat-empty / .dread-lv1|2                  │
│  .hotspot.key|ref|plain（形状 + 颜色双通道）/ .by-eye       │
│  body.diff-story .choice .num（Q1 唯一的危险提示）           │
├────────────────────────────────────────────────────────────┤
│ 引擎层  js/engine.js                                        │
│  DIFFICULTY + scaleCost() ...... 倍率 × 取整规则            │
│  observeCost()/lightPlan() ..... 一处要付什么              │
│  chargeNodeClock()/elapsedMin()  节点耗时与时间线           │
│  forcedTarget() ................ k13 / f10 / end_absorb     │
│  check() ....................... minSurvivors / maxCorruption│
│  applyEffects() ................ 写入即夹取 + 归零钩子       │
│  snapshot()/migrateSave()/restartNode()/rollbackAfterDeath() │
├────────────────────────────────────────────────────────────┤
│ 数据层  js/data.js / story2..4.js                          │
│  节点 / 台词 / 选项 / 观察点（light / risk / noDim）/ tell    │
└────────────────────────────────────────────────────────────┘
```

依赖方向单向：表现层 ← 引擎层 ← 数据层。数据层不知道难度的存在；引擎层不认识任何剧情名词。

---

## 2. 难度数据模型

```js
DIFFICULTY = {
  story: {
    id:'story', name:'故事', short:'故事', tier:0,
    mul: 0.75, round: 'down',          // 倍率 + 取整：**只用于观察代价**
    nodeClock: { walk: 4, run: 2, still: 0 },  // 节点耗时是显式表（§12.1），不乘倍率
    knockPerObs: 0.5,                  // 每 2 处 +1（累计取整）
    knock: { warn:10, danger:13, k13:null },   // 故事档不触发 k13
    corruption: { power:25, sacrifice:60, brk:95 },
    eyeLight: { 1:2, 2:3 },            // 用鬼眼照明：复苏 +2 / +3
    lightRange: 20,                    // 电量 ≥20% 才敢用手机照 light:2
    hints: { cost:true, keyCount:true },
    observe: { dimWhenLow:false, alwaysVisible:true },
    save: { auto:true, manual:true, restart:true },
    death: { mode:'none', endings:[], penalty:{}, maxRollback:0 },
    markers: { choiceDanger:true }      // Q1：故事档保留一个干血红圆点
  },
  standard:  { mul:1,    round:'nearest', knockPerObs:1, knock:{warn:9,danger:12,k13:13},
               corruption:{power:30,sacrifice:60,brk:85}, eyeLight:{1:3,2:5}, lightRange:30,
               nodeClock:{walk:6,run:3,still:0},
               save:{auto:true,manual:false,restart:true},
               death:{mode:'rollback',endings:DEATH_ENDINGS,penalty:{},maxRollback:5},
               markers:{choiceDanger:false} },
  nightmare: { mul:1.25, round:'up',      knockPerObs:2, knock:{warn:8,danger:10,k13:11},
               corruption:{power:30,sacrifice:55,brk:75}, eyeLight:{1:5,2:8}, lightRange:45,
               nodeClock:{walk:7,run:4,still:0},
               save:{auto:true,manual:false,restart:false},
               death:{mode:'rollback',endings:DEATH_ENDINGS,
                      penalty:{knock:3,survivors:-1},maxRollback:3} }
}
```

**取整规则是设计的一部分**，不是实现细节：

```js
scaleCost(基准, 档位) = max(1, 档位.round(基准 × 档位.mul))
```

| 基准 | ×0.75 向下 | ×1 四舍五入 | ×1.25 向上 | 设计表值 |
|---|---|---|---|---|
| 观察耗时 6 分 | **4**（4.5↓） | 6 | **8**（7.5↑） | 4/6/8 ✓ |
| 观察耗电 5% | **3**（3.75↓） | 5 | **7**（6.25↑） | 3/5/7 ✓ |
| 节点耗时（不乘倍率） | 4 | 6 | 7 | 显式表 `nodeClock.walk` ✓ |

敲门不能用倍率（故事档是"每 2 处 +1"，不是 0.75），所以单独给 `knockPerObs`，
并按 §10.3 的要求**累计取整**：

```js
knock += floor(obsCount × rate) − floor((obsCount − 1) × rate)
// rate=0.5 → 0,1,0,1…   rate=1 → 1,1…   rate=2 → 2,2…
```

档位 id 归一：`normal` 是早期命名，读旧设定/旧存档时映射到 `standard`（`normDiff()`）。

---

## 3. 观察代价模型（§4.1）

```
代价 = 时刻（scaleCost(6)）
     + 敲门（knockPerObs 累计取整 + hotspot.risk）
     + 照明费（lightPlan 三选一）
     + (flags.ankle_hurt ? 时刻 +2 : 0)
```

`lightPlan(o)` 的判定顺序（**顺序就是优先级**）：

| 条件 | 结果 | 玩家看到的 |
|---|---|---|
| `free` 或 `light === 0` | `free` | 不收照明费（旁白已经说"你能看见了"） |
| `light === 1` 且 `corruption ≥ 力量阈值` | `eye-free` | 眼睛替你照着，不耗电也不耗复苏 |
| `battery ≥ lightRange` | `battery` | 电量 −scaleCost(5) |
| `eyes ≥ 1` | `eye` | 复苏 +`eyeLight[light]` |
| 其它（`eyes === 0`） | `too-dark` | `.too-dark` 置灰、「太黑了，照不到」 |

**只有最后一种会锁死**，这正是设计要的：`eyes === 0` 只可能出现在 `d6` 之前，而那一段电量是满的。

电量收缩按 §12.3 的三级顺序砍：**plain → ref → key**，`cap = max(1, ceil(n × ratio))`（至少留 1 处）。
`noDim: true`（全篇唯一线索来源，如 `o_f10_eyes`）**不参与收缩**——砍掉唯一来源等于制造卡关。

> ⚠️ **`hotspotTier()` 是全局反推，不是局部标注**：它扫描全部剧情的 `when`，把"被任何条件消费的线索"
> 判成 `key`。所以**剧情里加一条 `allClues` 会连锁改变其它节点的分级**——例如 B12 给真结局门槛加了
> `ghost_domain`，`d7` 的 `t_tree` 就从 `ref` 升成了 `key`，直接改变"电量不足时先砍谁"。
> 改动任何带线索条件的选项/台词后，**必须重跑** `suite_difficulty` 里那条
> 「电量 10% 时：key 优先保留、o_f10_eyes 永不隐藏」的回归用例。
噩梦允许把关键线索吞到只剩 1 处，这是"看得起但看不全"的代价。

---

## 4. 六个引擎钩子（§10.2）

| # | 位置 | 实现 | 关键细节 |
|---|---|---|---|
| H1 | `runNode` 开头 | `forcedTarget()` → `k13` | **节点不存在则跳过且不记旗标**：文案没落地时行为与改动前一致；噩梦档撞阈值直接 `e_door`（选择即承诺） |
| H2 | `runNode` | `chargeNodeClock()` + `forcedTarget()` | 节点耗时可用 `costClock` 覆盖；跨 03:00 置 `night_late`；到 05:30 强制 `f10`。**预算用 `elapsedMin()`（经过分钟数），不用 `clock % 1440`** |
| H3 | `updateHUD` | 敲门 `?` / `.low-battery` | `heard_it`（兼容旧的 `listened`）没置位时显示 `?`；`battery < 30` 给舞台加 `.low-battery` |
| H4 | `renderHotspots` | `.by-eye` / `.too-dark` | 照距不足**不锁死**：加虚线血色环 + 副标签「（用这只眼睛看）」；仅 `eyes === 0` 置灰 |
| H5 | `check()` | `minSurvivors` / `maxCorruption` | 配合"写入即夹取"，`minBattery` 在负数上不会误判 |
| H6 | `applyEffects` | `clamp(0,100)` + `set` | `battery` / `corruption` 写入即夹；`set:{battery:N}` 与 `stats` 一样走夹取；复苏到 `brk` 只在幕末清单（`act3/d8/act5/f9`）触发 `end_absorb` |

`forcedTarget()` 返回 `{node}` 或 `{death}` 或 `null`，三者互斥且都带"已处理"旗标，避免重复触发或死循环。

### 时间线的两个坑（都已守住）

1. `elapsedMin() = clock − 开局时刻`。开局 1330（22:10），到 05:30 是 440 分钟。
   用 `clock % 1440` 会把 22:14 判成"已过 05:30"（1334 ≥ 330），整局立刻被拖进死线。
2. `night_late` 只在**跨过** 03:00 的那一次置位（比较 `before < 290 && after >= 290`），不是每节点重判。

---

## 5. 存档策略（§6.3 / Q3）

| | 故事 | 标准 | 噩梦 |
|---|---|---|---|
| 自动槽 | 每节点 | 每节点 | 每节点（覆盖） |
| `保存进度` / `读取进度` | 有（手动槽） | 无 | 无 |
| 回退入口 | 「回到本节点开头」（`nk`，精确到节点） | 「回到本场景开头」（`ck`，唯一回退） | 无 |
| 死在坏结局 | 不回滚（`mode:'none'`） | 回**本场景开头**，资源维持当时数值（≤5 次） | 回**本场景开头** + 敲门 3 / 同伴 −1（≤3 次） |

三处锚点：

- **`state.nk`** = 进入**节点**时的快照（`applyEnter` 之后取，重入用 `skipEnter`，效果不会被计两次）——给故事档的「回到本节点开头」；
- **`state.ck`** = 进入**场景**时的快照（`sceneOf` 变化时写一次，`ck.line = 0`）——给标准/噩梦的死亡回滚与标准档的「回到本场景开头」；
- **`state.actStart`** = 本幕幕首节点 id——`k13_pass.route` 的兜底目标。

**`state.ck` 的写入时机**：只在 `runNode` 里发现"场景变了"时写（`sceneOf(n) !== lastScene`），
`resume` / `keepCk`（回滚重入）一律跳过——否则会把死亡现场存成检查点，形成"回滚到死亡现场"。

死亡后**不覆盖自动槽**：写进去的是 `deathTarget()`（即回退目标），所以关页面再回来也不会掉进坏结局。

**回滚后必须夹取**（否则死循环）：

```js
knock      = min(knock + penalty.knock, d.knock.danger - 1)   // 噩梦 11+3 → 9，否则下个节点再进 k13
corruption = min(corruption, d.corruption.brk - 15)           // 从 e_absorb 回来仍 85+ 会立刻二次失控
```

顺序不能反：**先加惩罚，再夹上限**。标准档没有 knock 惩罚，但仍夹 corruption。

存档结构（v2）：

```js
{ v, node, line, flags, stats, clues, items, codex, act, cycle,
  difficulty,        // 本局档位（跟着存档走）
  actStart, obsCount, rollbackCount, ending, nk?, savedAt }
```

迁移（`migrateSave`）三条规则：**不是对象/节点不存在 → null**；**缺字段用 `freshState()` 补**；
**类型不对就当没写**。旧档没有 `difficulty` → 按 `standard` 继续（保持它当初的物理法则）；
旧档的 `ck`（早期版本的场景检查点）会被当作 `nk` 读入。

**读档时档位不一致**：弹 `confirmBox` 说明"存档是 X 档、当前设定是 Y 档，继续会按 X 继续"，
用户取消则不进入游戏；**永远不静默改写存档里的档位，也不静默改写玩家设定**。

---

## 6. 台词播放的代际保护

`runNode` 每次进入新节点都会 `playGen++`，并清掉旧的打字机定时器、释放还在等"点一下"的 `advanceResolve`。
`playFrom` 拿到 `gen`，在每次 `await` 之后比对：**代际变了就立刻退出**。

没有这层保护时，"回到本节点开头"（或任何在台词播到一半时换节点的操作）会留下一个孤儿循环，
它会继续往 `#story-text` 写旧台词、并和新的循环抢 `advanceResolve`——表现为"文本停住、点不动"。

---

## 7. ADR

### ADR-1：不引入框架/构建（保持零依赖 + `file://` 可玩）

**备选**：CDN 版 Vue/React；打包器 + ES Module 拆文件；维持单文件引擎 + 表驱动。

**决定**：单文件 + 表驱动。

**理由**：ES Module 在 `file://` 下会被 CORS 拦（项目第一硬约束）；加构建等于把"改一句台词"的门槛从记事本提到装 node；
现有测试按 `<script>` 顺序在 `vm` 里加载真实文件，改模块要重写夹具，收益全在组织、风险全在已通过的 150+ 项行为；
真正的复杂度在**规则**（倍率、可见性、存档迁移），规则用数据表表达比用组件树更短、更好测。

**后果**：正面——零安装、零构建、测试夹具不动；负面——`engine.js` 继续变长（现约 1750 行），
靠注释分区 + "新能力一律走表 + 纯函数"来维持可读性。

---

### ADR-2：资源后果放在引擎，不放在剧情数据

**备选**：数据侧逐点写 `when`；引擎侧统一派生；混合。

**决定**：引擎侧统一派生，数据只给"这一处的属性"（`light` / `risk` / `noDim` / `free`）。

**理由**：38 个观察点 × 3 档 × 3 种照明 = 300+ 组合，写进数据必然漏；
引擎侧是一条纯函数（`lightPlan` / `observationVisible`），可以直接断言"4 处 → 2 处且保留 2 个 key"；
策划调数值只改表，不动 20 个剧情文件。

**后果**：正面——后果全局一致、可穷举测试；负面——数据作者失去"这一处不受电量影响"的表达力，
所以补了 `noDim` 与 `free` 两个显式例外字段（宁可多两个字段，也不把管线搬回数据里）。

---

### ADR-3：存档策略数据化，档位属于"一局"

**备选**：全局一套存档逻辑；按档位分支的 `if`；存档策略数据化（`save.*` + `death.*`）。

**决定**：数据化，且 `state.difficulty` 随存档走。

**理由**：噩梦档如果只是"数值更难"，不可手动存 + 回退惩罚就白设计了；
把档位名写进业务流程会让第三个档位要改 5 处 `if`；
存档不带档位会产生最糟的一类 bug——用故事档玩到厕所（电量 60%），改设定成噩梦后读档，
后续代价突然变 1.25 倍，"刚好够用"的设计立刻崩。

**后果**：正面——加档位 = 加一行；存档可解释（HUD 与暂停菜单都写出规则）；卡住的玩家可以当场调低难度。
负面——存档多了 `difficulty` / `nk` / `actStart` / `obsCount`，体积略增；
"当场调低"意味着噩梦的严格性可以被玩家自行解除（单机叙事游戏，接受）。

---

### ADR-4：坏结局用"结局 id 白名单"，不在结局数据上加字段

**决定**：`DIFFICULTY.*.death.endings = ['e_door','e_stairs']`（引擎配置）。

**理由**：本轮不允许改剧情数据；而且"哪个结局算死"本身是**难度规则**
（同一结局在故事档可以正常收尾，在噩梦档就是失败）。结局 id 是稳定标识，不是正文。

**后果**：新增结局若想算"死"，需要在难度表里加一个 id（`validate` 可扩展校验）；
漏加的表现是"这个结局在噩梦档正常收尾"，属于温和失败，不会崩。
`e_absorb`（复苏失控）刻意不在白名单里——设计写着"不可撤销"。

---

## 8. 不变量（改代码时别破坏）

1. 本局一律读 `state.difficulty`；只有 `setDifficulty()` 允许同时写 `state.difficulty` 与 `settings.difficulty`。
2. 所有代价走 `scaleCost()`；基准值只写在 `OBSERVE_COST` / `NODE_COST_CLOCK` 两处。
3. 敲门只走 `knockDeltaFor()`（累计取整），不许在别处 `knock += 1`。
4. `observationVisible()` 必须是 `observationRemaining()` 的子集，且按原始顺序返回；`noDim` 永远在其中。
5. 时间预算只用 `elapsedMin()`；**禁止 `clock % 1440`**。
6. 强制转场必须"节点存在才转"，且每个都带一次性旗标（`__k13` / `__timeup` / `__absorb`）。
7. 归零钩子不判死、不跳节点；判死只能发生在 `showEnding()`。
8. 存档写入必须经过 `snapshot()`；读入必须经过 `migrateSave()`。
9. 回退重入必须 `skipEnter: true` + `noCharge: true`。
10. 任何在台词播放途中换节点的路径，都必须经过 `runNode`（拿新代际），不许绕过。
11. 新增节点/选项/观察点字段要同步 `tests/structure.js` 的允许列表与 `tools/validate.js`。
12. 改任何"带线索条件"的选项/台词后，重跑「key 优先保留 / noDim 永不隐藏」回归用例——`hotspotTier` 是全局反推。
13. 回滚必须先加惩罚再夹上限（`knock ≤ danger−1`、`corruption ≤ brk−15`），否则会"回滚→立刻再死"。
14. 进 `k13` 前必须写 `flags.__k13_back`；从 `k13_pass` 回到该节点时不再结算它的进入效果与节点耗时。

---

## 9. 与策划文档的对照（落地情况）

| 设计条目 | 状态 |
|---|---|
| §4.1 `light` / `risk` / 照明三选一 / `ankle_hurt +2` | ✅ 已实现（含 `eye-free` 与 `too-dark`） |
| §4.1 `eyes===0` 才不可点 | ✅ |
| §4.2 新增 11 个观察点 | 由策划写入（已落地 38 个点，含 `light` / `risk` / `noDim`） |
| §4.1 `light:0` 的第四幕免费 | ✅ 引擎支持，数据已标注 |
| §5.3 `k13` 拦截 | ✅ 引擎就绪 + 数据已落地 |
| §5.4 fail-forward 的"伤/失/账" | ✅ 只靠 flags/stats，引擎零新增系统 |
| §6.1 倍率与取整 | ✅ `scaleCost` |
| §6.2 提示强度（标记/锁定提示/观察可见性） | ✅（Q1 的干血红圆点 + 三档 `lockedHint`） |
| §6.3 存档规则 | ✅（含"回到本节点开头"） |
| §6.4 死亡惩罚 | ✅（故事回这一步 / 标准回幕首 / 噩梦回幕首 + 惩罚） |
| §8.4 `minSurvivors` / `maxCorruption` | ✅ |
| §10.1 `state.difficulty` 与存档绑定 | ✅（不一致时提示） |
| §10.3 夹取与取整 | ✅ |
| Q5 复苏 85 失控 + 80 警告 + 「压住它」 | ✅ |
| `rotAfter` | ✅ 引擎支持（数据仍用手写 `_rot`，可后续替换） |

---

## 10. 已知风险与知识缺口

| 风险 | 说明 | 缓解 |
|---|---|---|
| 数值平衡仍在调 | 剧情数据正在按设计 §7 的 A/B 表重写，敲门/时间预算会随之变化；`e_written` 的全夜路线因此改用"从 f8 支线入口验证"（与 `prove_eighth` 同口径） | 平衡定稿后可以把该用例改回整夜跑 |
| 电量吞点可能被读成 bug | 玩家看到"还剩 1 处"而画面里有 3 个光圈 | 提示条写明"还有 N 处沉在黑暗里（电量不够了）"；`noDim` 保证唯一来源不被吞；故事档不吞 |
| 回退与档案解锁 | 死亡时结局仍永久解锁（画廊是账户资产），回退只回退这一局 | 有意为之；若要改，改 `showEnding()` 一行 |
| CSS 无法自动化验证 | 亮度、形状、焦点描边只在真浏览器可见 | 测试断言 class/选择器存在；视觉需人工过一遍 |
| `engine.js` 继续膨胀 | 现约 1750 行 | 新能力强制走"表 + 纯函数"，禁止在渲染函数里写业务常数 |
