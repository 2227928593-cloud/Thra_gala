# 批量生产计划 · 剩余 33 张

**版本** v1.0 · 2026-10-20
**前置** `design/art/art-bible.md` v1.1、`design/assets/asset-manifest.md` v1.1
**已完成** 6 张族锚定 + **B1 立绘 5 张 + B2 差分 3 张**（11 张立绘全部出齐，见 `art/_samples/portrait_family.png`）
**状态** ⏸ B1/B2 已交付；**B3–B7 等用户批预算**。

---

## 0. 一句话

剩余 **25 项资产 / 46 个文件**（18 场景 + 21 `_rot` + 7 结局）
= **46 次调用 / 230–460 credits**（`_rot` 走 A 重渲染）
或 **25 次 / 125–250 credits**（`_rot` 走 B 确定性派生，见 §4）。

---

## 1. 已完成 / 剩余

| 类别 | 总数 | 已完成 | 剩余 | 备注 |
|---|---|---|---|---|
| 立绘 | 11 | **11（全部）** | **0** | B1 5 张 + B2 3 张已交付 |
| 场景 | 21 | 3（classroom / corridor_dark / stairwell） | **18** | |
| 场景 `_rot` | 21 | 0（对照样张已出，未批量） | **21** | 路线见 §4 |
| 结局 | 7 | 0 | **7** | |
| **资产项** | **39** | **14** | **25** | |
| **文件** | 60 | 14 | **46**（含 21 `_rot`） | |

> 注：现有 3 张场景母版同样需要补 `_rot`。所以 `_rot` 一栏是 21 张，不是 18 张。

---

## 2. 逐张计划

图例：**方式** `txt2img`=纯文生图 / `img2img`=挂参考图 / `diff`=从本体派生（不重画）
**调用** 该资产需要的 ImageGen 次数

### 2.1 立绘（8 项 / 8 次调用）

| # | id | 方式 | 参考图 · fidelity | 调用 | 风险 | 触发点与对策 |
|---|---|---|---|---|---|---|
| C02 | `yangjian_eye` | **diff** | `yangjian.png` · 0.85 | 1 | 中 | 血流与竖眼容易被画成"血浆恐怖"，破坏平涂。对策：限定"一条细干血线 + 一只以墨线勾勒的竖眼"，禁 gore |
| C03 | `zhangwei` | img2img | `laoren.png` · 0.62 | 1 | 中 | "过大的笑"容易变成小丑。对策：`smile stretched past the cheek line, even teeth, no clown makeup` |
| C04 | `miaoshan` | img2img | `laoren.png` · 0.62 | 1 | **高** | 女性角色强触发美型插画。对策：`4.5-head proportion / no anime face / no glossy hair / no eyelashes`，且她是**最正常的一张**，不放任何恐怖项 |
| C05 | `wangshanshan` | img2img | `laoren.png` · 0.62 | 1 | **高** | 同上，另加"舞蹈生站姿"容易被画成写实人体比例。对策：`dancer posture but cartoon proportions, legs as rubber tubes` |
| C06 | `wangshanshan_marked` | **diff** | `wangshanshan.png` · 0.85 | 1 | 中 | 手印容易画成纹身贴纸。对策：`ink bleeding into the skin, not a decal` |
| C08 | `zhouzheng_dying` | **diff** | `zhouzheng.png` · 0.85 | 1 | 低 | 本体已稳定，只加深眼窝/加血线/开裂风衣。**这张最容易一次过** |
| C09 | `fangjing` | img2img | `laoren.png` · 0.62 | 1 | 中 | 不对称瞳孔 + 笑不达眼，容易被画成"已经疯了"。对策：`polite closed smile while the eyes stay flat and unamused` |
| C11 | `guiying` | img2img | `laoren.png` · 0.60 | 1 | **极高** | 婴儿 = 双重陷阱：要么可爱化，要么血腥化。对策：`no gore, no realistic baby, spider limbs, white gloves, solid black eyes, no teeth` |

> 立绘统一后处理：`clean_watermark.py --mode portrait` → `portrait_align.py`（22%）→ 不套 LUT。
> **全部 8 张必须以 `art/_samples/laoren.png` 为 image1**（该文件已于 v1.2 归一化到 22%）。

### 2.2 场景（18 项 / 18 次调用，不含 `_rot`）

按引擎使用频次排序，先出高频。频次来自 `grep -o "scene: '...'" js/*.js` 的统计。

| 批 | # | id | 用途 / 频次 | 调用 | 风险 | 要点 |
|---|---|---|---|---|---|---|
| 2 | S17 | `school_gate` | 校门 · 8 处 | 1 | 中 | 门牌必须**空白**；伸缩门格栅是画面骨架 |
| 2 | S18 | `street_dawn` | 步行街凌晨 · 10 处 | 1 | 中 | 终幕收束，**唯一不用 `_rot`**；天光冷青→骨白渐变 |
| 2 | S01 | `room_night` | 出租屋 · 6 处 | 1 | 低 | 玩家看到的第一个房间；显示器**无字**微光 |
| 2 | S11 | `toilet` | 厕所 · 6 处 | 1 | 中 | 地面积水反光 + 一扇半开门；隔断上湿手印 |
| 2 | S14 | `playground` | 操场 · 2 处 | 1 | 低 | 篮球架作前景剪影；场地灯冷青 |
| 2 | S10 | `stairwell_mirror` | 镜面 · 2 处 | 1 | **高** | 镜像里的"多一个人"极易画成两个人站那。对策：`nothing in the actual room, only inside the mirror`，建议以 `stairwell.png` 为 image1（0.72）保机位 |
| 3 | S02 | `hospital` | 急诊室外 · 2 处 | 1 | 低 | 连排椅 + 地面干血 |
| 3 | S08 | `corridor_2f` | 二楼半 · 2 处 | 1 | 低 | 低天花 + 外露管道 |
| 3 | S16 | `guard_booth` | 保安室 · 1 处 | 1 | 中 | 四台 CRT 屏幕**只有雪花**，绝不能出字 |
| 3 | S19 | `street_day` | 步行街白天 · 6 处 | 1 | 低 | 建议以 `street_dawn.png` 为 image1（0.70）保机位，只改时间 |
| 3 | S20 | `street_night` | 步行街夜 · 1 处 | 1 | 低 | 同上，同机位 |
| 3 | S21 | `morgue` | 停尸间 · 1 处 | 1 | 中 | 中间抽屉拉出且空；**抽屉上不能有编号** |
| 3 | S15 | `woods` | 绿化林 · 1 处 | 1 | 中 | 树干密集，易变写实森林 |
| 3 | S12 | `void_dark` | 无尽黑暗 · 2 处 | 1 | **高** | 易生成"有内容的黑"。对策：`no horizon, no walls, no ceiling`，只留一米光锥 |
| 4 | S04 | `classroom_early` | 讲课前 · 3 处 | 1 | 低 | 以 `classroom.png` 为 image1（0.75）保机位，只改状态（黑板擦净/灯全亮/门关上） |
| 4 | S05 | `classroom_ghost` | 门外有人 · 1 处 | 1 | **高** | 唯一允许出现人形剪影；剪影必须**无五官**。对策：`flat ink-black silhouette, no face, no features` |
| 4 | S06 | `classroom_after` | 三天后 · 1 处 | 1 | 中 | 警戒线 + 积尘 + 倒地椅；黑板留"灰白鬼影弧" |
| 4 | S13 | `bone_tree` | 白骨树 · 1 处 | 1 | **高** | 易变写实奇幻概念图。对策：树皮指定"椎骨分节"，禁 `epic fantasy` |

> 场景统一：`1536×1024` 生成 → `clean_watermark.py --mode scene`（裁到 1536×864，水印随裁切消失）。
> 风格句**必须**用 v1.2 新句式：`BOLD UNEVEN INK OUTLINE ... 10 to 14 px ... FLAT CEL-INK SHADING ... no ambient occlusion, no depth of field`。

### 2.3 结局（7 项 / 7 次调用）

| # | id | 方式 | 参考图 | 调用 | 风险 | 画面 |
|---|---|---|---|---|---|---|
| E01 | `e_door` | txt2img | — | 1 | 低 | 半开门 + 十三道刻痕（横线，**不是数字**） |
| E02 | `e_stairs` | txt2img | — | 1 | 中 | 极低仰角，楼梯井向上收拢；楼层牌**空白** |
| E03 | `e_alone` | txt2img | — | 1 | 低 | 校门外脚印 + 公交驶过（**无线路号**） |
| E04 | `e_absorb` | img2img | `classroom.png` · 0.55 | 1 | 中 | 背对观众的人 + 一圈红眼；沿用教室机位 |
| E05 | `e_eighth` | txt2img | — | 1 | **高** | 六人六影**加第七道无主之影**——模型极易数错。对策：明确 `six shadows, then one extra seventh shadow belonging to nobody` |
| E06 | `e_written` | txt2img | — | 1 | **高** | 纸上墨迹"正在成形"，但不能是字。对策：`meaningless worming brush marks, not forming letters` |
| E07 | `e_true` | txt2img | — | 1 | 中 | 七人背影 + 身后未熄红光 |

> 结局同样 `1536×1024` 生成 → 裁 16:9。

---

## 3. 建议批次顺序

**先立绘、后场景、再结局，差分夹在两者之间，`_rot` 最后一次性出。**

| 批次 | 内容 | 调用 | 为什么这个顺序 |
|---|---|---|---|
| **B1 立绘扩族** | 5 张新本体（zhangwei / miaoshan / wangshanshan / fangjing / guiying） | 5 | 先把 11 张里最难的 5 张验掉。若女性角色仍然美型化，现在调整提示词的代价最小；等场景全出完再发现就得返工 |
| **B2 差分** | 3 张（yangjian_eye / wangshanshan_marked / zhouzheng_dying） | 3 | 必须等本体定稿。差分是最稳的一批，用来"回血"——如果 B1 有 1–2 张要重跑，这里可以补上进度 |
| **B3 高频场景** | 6 张（school_gate / street_dawn / room_night / toilet / playground / stairwell_mirror） | 6 | 覆盖引擎里 30+ 个节点。先出玩家看得最多的房间 |
| **B4 中低频场景** | 9 张 | 9 | 一次性出完，保证同光同线（同一批 prompt、同一批 seed 区域） |
| **B5 教室族 + 异类场景** | 3 张（classroom_early / classroom_ghost / classroom_after）+ bone_tree / void_dark | 5 | 教室三张要以 PLATE-E 为 image1 保机位，必须等 PLATE-E 定稿（已定）；两类"异类"单独出，避免污染批次风格 |
| **B6 `_rot`** | 21 张 | 21 | **必须一次性全出**。分两次出，暗角与霉斑强度会不一致——这正是旧版"背景割裂"的成因 |
| **B7 结局** | 7 张 | 7 | 最后出。结局是玩家截图分享最多的图，等全部风格稳定后再做 |
| | **合计** | **56** | 含 3 张母版的 `_rot`；若 `_rot` 走派生，则 **35** |

> 上表 56 与 §0 的 51 差 5：§0 只算了"资产项 33"，这里把 3 张母版缺的 `_rot` 也补上（实际文件数 = 54）。**以 56 为准。**

---

## 4. `_rot` 的两条路线（唯一的大额开关）

| | 路线 A：重渲染（art-bible §8.4 原方案） | 路线 B：确定性派生 |
|---|---|---|
| 做法 | 以本体为 image1，fidelity 0.72，腐化后缀重出 | 用 `tools/gen_rot.py` 升级版：调色 + 霉斑 + 水痕 + 暗角，零 AI |
| 调用 | **21 次**（105–210 credits） | **0 次** |
| 优点 | 结构会真的"烂"下去（墙皮掀起、家具软化），符合 R1–R4 腐化梯度 | 零成本、零漂移、100% 保构图 |
| 缺点 | 有 10–20% 概率模型偷改构图，需叠图验收重跑 | 只能"变脏变暗"，做不到"结构塌陷"，腐化感更弱 |
| 建议 | **先用 1 张做对照样张**（走廊，最常出现），与 B 方案并排比对，再决定 21 张走哪条 | |

> 这是唯一值得单独花 1 次调用做决策的地方。若走 B，总调用 35 次（175–350 credits）；走 A，56 次（280–560）。

---

## 5. 每批验收清单

跑完一批，逐条过。**任何一条不过，该张重跑，不要带病进下一批。**

```bash
# 1) 去水印 / 裁切 / 透明化（不写正式文件，先看对比）
python tools/clean_watermark.py "art/_samples/_raw/*.png" --mode auto --dry-run

# 2) 立绘眼线归一化（只对立绘；看 22% 参考线是否压在眼睛上）
python tools/portrait_align.py art/_samples/*.png --guide

# 3) 色板审计（出格色 <12%，墙裙绿 ≤12%，墨蓝 ≤10%）
python tools/lut.py art/_samples/*.png --check
```

| # | 检查项 | 通过标准 | 怎么查 |
|---|---|---|---|
| 1 | 文件名 | 与 `js/data.js` 引用一致，无破图 | 对照 `asset-manifest.md` §1 总览表 |
| 2 | 尺寸 | 立绘 1024×1536 RGBA；场景 1536×864 | `identify` / Python |
| 3 | 透明 | 立绘 alpha 有 0 值（不是全 255） | `alpha.min()==0` |
| 4 | 眼线 | 立绘 22% ±1% | `portrait_align.py --guide` 看红线是否压眼 |
| 5 | 同光 | 主光左上、暗部右侧 sepia | 与 `family_sheet.png` 并排目视 |
| 6 | 同线 | 立绘外轮廓 ≈1% 短边；场景 9–14 px | 100% 放大看最粗的线 |
| 7 | 地平线 | 场景 64.2% ±2% | 目视 + 安全区（y 10–90%）无关键信息 |
| 8 | 水印 | 无字形聚簇（residual 数值仅供参考，暗部噪点会误报） | 2 倍放大看右下角 |
| 9 | 色板 | 出格色 <12%；墙裙绿 ≤12%；墨蓝 ≤10% | `lut.py --check` |
| 10 | 零文字 | 黑板只有粉笔弧、门牌空白、屏幕只有雪花 | 逐张目视 |

---

## 6. 成本

| 方案 | 调用 | credits（5–10/次） | 适用 |
|---|---|---|---|
| 剩余全量（A：`_rot` 重渲染） | 46 | 230–460 | 质量优先 |
| 剩余精简（B：`_rot` 派生） | 25 | 125–250 | 预算敏感 |
| 已花（B1+B2+rot 对照） | 9 | 45–90 | 已交付 |

> 另有 1 次"`_rot` 路线对照样张"（走廊），建议无论选哪条都先花。

---

## 7. 需要用户拍板

1. **总预算**：56 次（280–560 credits）还是 35 次（175–350 credits）？差别只在 `_rot`。
2. **`_rot` 路线**：建议先出 1 张走廊对照，看过再定 21 张怎么走。
3. **是否分批放行**：建议 B1（8 次）先跑，看完立绘全族再决定后面的钱怎么花。

---

## 8. 风险总表（按"跑偏概率 × 返工成本"排序）

| 排名 | 资产 | 概率 | 返工成本 | 处置 |
|---|---|---|---|---|
| 1 | `guiying` | 极高 | 1 次 | 提示词里把"禁 gore / 禁写实婴儿"写在最前，白手套与蜘蛛肢是救命锚点 |
| 2 | `miaoshan` / `wangshanshan` | 高 | 1 次 ×2 | 4.5 头身 + 禁美型；这两张决定"人物是否像同一部片子" |
| 3 | `classroom_ghost` | 高 | 1 次 | 剪影必须无五官，否则变成"走廊里站了个路人" |
| 4 | `e_eighth` | 高 | 1 次 | 影子数量是最容易画错的地方，验收时数影子 |
| 5 | `void_dark` | 高 | 1 次 | 只要光锥，不要"黑暗中的房间" |
| 6 | `bone_tree` | 高 | 1 次 | 禁奇幻概念图，树皮=椎骨 |
| 7 | `stairwell_mirror` | 高 | 1 次 | 只有镜子里有人 |
| 8 | `e_written` | 高 | 1 次 | 墨迹不能成字 |
| 9 | 其余 18 张 | 中/低 | — | 按验收清单过 |

> 高风险 8 张全在 B1/B5/B7 三批里，且每张只值 1 次调用。**先跑这 8 张，比先跑 20 张低风险的更省钱**——因为它们一旦定稿，整套提示词模板就被验证了。
