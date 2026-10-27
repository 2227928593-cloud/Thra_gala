# 资产清单 · 《恐怖复苏 · 敲门》

**版本** v1.0 · 对应 `design/art/art-bible.md` v1.0
**总数** 39 项资产 / 60 个文件（21 张场景各带 1 张 `_rot` 腐蚀版）
**风格** 复古橡皮管动画恐怖（vintage rubber-hose cartoon horror）
**生成方式** ImageGen：`size` / `background` / `quality:high` 已逐条标注；`input_fidelity` 见「参考图」栏

---

## 0. 使用方式（重要）

1. **参考图栏决定"统一"**。全族只有两张 style plate：
   - 立绘族 → `art/_samples/laoren.png`（`image1`，`input_fidelity 0.55–0.65`）
   - 场景族 → `art/_samples/classroom.png`（`image1`，`input_fidelity 0.45–0.55`）
   - 差分族 → 本体最终图（`image1`，`input_fidelity 0.85`）
2. **提示词可直接整段粘贴**。已内置风格头 + 负向尾，无需再拼。
3. 生成后**必走** §8.1 管线：去水印 → 修补 → LUT → 纸纹 → 网点 → 颗粒 → 划痕 → 暗角 → 导出。
4. 所有提示词末句已封死文字生成。若仍出字：**重跑，不接受"像字的装饰"**。
5. 立绘统一 1024×1536 透明 PNG；场景/结局统一 1536×1024 不透明。

---

## 1. 总览

| # | id | 类别 | 用途（一句） | 文件 |
|---|---|---|---|---|
| C01 | yangjian | 立绘 | 主角本体，全篇出场最多 | `characters/yangjian.webp` |
| C02 | yangjian_eye | 立绘差分 | 吞下鬼眼后，手臂裂开竖眼 | `characters/yangjian_eye.webp` |
| C03 | zhangwei | 立绘 | 同桌，插科打诨与牺牲 | `characters/zhangwei.webp` |
| C04 | miaoshan | 立绘 | 同桌，冷静的记忆者 | `characters/miaoshan.webp` |
| C05 | wangshanshan | 立绘 | 舞蹈生，被鬼婴标记前的干净版 | `characters/wangshanshan.webp` |
| C06 | wangshanshan_marked | 立绘差分 | 后颈青黑手印蔓延 | `characters/wangshanshan_marked.webp` |
| C07 | zhouzheng | 立绘 | 国际刑警，驭鬼者，腹部反常 | `characters/zhouzheng.webp` |
| C08 | zhouzheng_dying | 立绘差分 | 撑到极限，肚皮将破 | `characters/zhouzheng_dying.webp` |
| C09 | fangjing | 立绘 | 知道未来的人 | `characters/fangjing.webp` |
| C10 | laoren | 立绘 | 鬼敲门本体，A 级 | `characters/laoren.webp` |
| C11 | guiying | 立绘 | 鬼婴，贴墙爬行 | `characters/guiying.webp` |
| S01 | room_night | 场景 | 序幕 · 城东出租屋深夜 | `scenes/room_night.jpg` |
| S02 | hospital | 场景 | 帖中画面 · 中医院急诊室外 | `scenes/hospital.jpg` |
| S03 | classroom | 场景 | 高三（二）班晚自习，主场景 | `scenes/classroom.jpg` |
| S04 | classroom_early | 场景 | 讲课之前，黑板尚空 | `scenes/classroom_early.jpg` |
| S05 | classroom_ghost | 场景 | 门外站着人 | `scenes/classroom_ghost.jpg` |
| S06 | classroom_after | 场景 | 三天后封校的空教室 | `scenes/classroom_after.jpg` |
| S07 | corridor_dark | 场景 | 五楼走廊，鬼域，使用最高频 | `scenes/corridor_dark.jpg` |
| S08 | corridor_2f | 场景 | 二楼半旧走廊，厕所外 | `scenes/corridor_2f.jpg` |
| S09 | stairwell | 场景 | 楼梯间，无尽下楼 | `scenes/stairwell.jpg` |
| S10 | stairwell_mirror | 场景 | 楼梯间镜面，多一个人 | `scenes/stairwell_mirror.jpg` |
| S11 | toilet | 场景 | 二楼半厕所，惨白的手 | `scenes/toilet.jpg` |
| S12 | void_dark | 场景 | 无尽黑暗，手机灯只照一米 | `scenes/void_dark.jpg` |
| S13 | bone_tree | 场景 | 白骨树，倒挂黑影 | `scenes/bone_tree.jpg` |
| S14 | playground | 场景 | 操场 04:05 | `scenes/playground.jpg` |
| S15 | woods | 场景 | 操场边绿化林，方镜的电话 | `scenes/woods.jpg` |
| S16 | guard_booth | 场景 | 保安室，监控与手印 | `scenes/guard_booth.jpg` |
| S17 | school_gate | 场景 | 校门，进出关口 | `scenes/school_gate.jpg` |
| S18 | street_dawn | 场景 | 步行街 05:31，终幕 | `scenes/street_dawn.jpg` |
| S19 | street_day | 场景 | 步行街白天，世界照常 | `scenes/street_day.jpg` |
| S20 | street_night | 场景 | 步行街夜晚，冲出校门 | `scenes/street_night.jpg` |
| S21 | morgue | 场景 | 停尸间，少了一具 | `scenes/morgue.jpg` |
| E01 | e_door | 结局 | 门后的第十三次 | `endings/e_door.jpg` |
| E02 | e_stairs | 结局 | 永远的五楼 | `endings/e_stairs.jpg` |
| E03 | e_alone | 结局 | 一个人走出校门 | `endings/e_alone.jpg` |
| E04 | e_absorb | 结局 | 成为鬼 | `endings/e_absorb.jpg` |
| E05 | e_eighth | 结局 | 第八个人 | `endings/e_eighth.jpg` |
| E06 | e_written | 结局 | 被写下的人 | `endings/e_written.jpg` |
| E07 | e_true | 结局 | 五点三十一分 | `endings/e_true.jpg` |

---

## 2. 立绘（11）

> 统一规格：**1024×1536** / PNG→WebP q88（alpha），单张 180–260 KB / `background:transparent` / `quality:high`
> 统一构图：3/4 半身面向左；眼线 y=17.5%；肩线 y=39%；身体 x 18–84%；关键信息 y ≤ 78%；骨白切边 8 px `#CBBE9F`
> 统一光向：左前上方 35°；暗部落 sepia；右后冷青轮廓 15%

### C01 `yangjian` · 杨间

- **用途** 主角本体。全篇 40+ 节点出场，是玩家看得最久的一张，**必须最"正常"**。
- **尺寸/格式** 1024×1536 / PNG(alpha) → WebP q88
- **构图** 面向左 3/4，半身至大腿；单手插兜握翻盖手机（冷青微光落在下颌与手背）；另一手自然垂；单肩下沉
- **参考图** `art/_samples/laoren.png`，`input_fidelity 0.60`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no elbows or knees, four-finger hands in small white gloves, pie-cut eyes, oversized egg-shaped head, 4.5-head proportion, a bone-cream cut-out keyline 8px around the whole silhouette, aged cream paper fibre, halftone dots, one strong key light from the upper front-left, deep sepia shadow on the right, palette strictly limited to ink black, bone cream, sepia brown, dried blood red, and one cold dark teal. Subject: a 17-year-old Chinese high school senior, three-quarter view facing left, half body, calm flat stare, heavy eyelids, pie-cut eyes with a single small pupil, faint dark circles, messy short black hair in uneven inked tufts, a neck slightly longer than natural, one shoulder dropped lower than the other, mouth a single flat ink line. He wears a year-2000 Chinese school uniform: navy and cream zip-up school track jacket with two pale stripes at the collar and cuff, collar open, one hand in the pocket holding an old flip phone whose screen casts a cold teal glow up onto his jaw and hand, the other arm hanging loose. Ink seeps from the collar seam down one shoulder. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no signage, no watermark, no border, no frame.
```

### C02 `yangjian_eye` · 杨间（鬼眼）

- **用途** 吞下鬼眼后的状态切换（`d8` 起）。**差分，不重画。**
- **构图** 与 C01 **完全同姿同光**；右前臂皮肤裂开一只竖立的血红眼，角膜反一点冷青；嘴角一线干血；瞳孔略不对称
- **参考图** 本体 C01 最终图，`input_fidelity 0.85`
- **提示词**

```
Edit of the supplied image, keep composition, pose, lighting, framing and colour layout identical. Change only these: on the inside of the right forearm the skin splits open vertically into a blood-red eye with a cold teal pinpoint reflection and two ink-drawn lash-like skin folds; a single thin line of dried blood runs from the corner of the mouth to the jaw; the pupils are now slightly unequal in size; the hand still white-gloved. Style stays 1930s rubber-hose cartoon horror with thick uneven hand-inked black contours, flat opaque fills, bone-cream 8px cut-out keyline, aged cream paper, halftone dots, key light upper front-left, palette limited to ink black, bone cream, sepia, dried blood red and one cold teal. Transparent background, no text, no lettering, no watermark, no frame.
```

### C03 `zhangwei` · 张伟

- **用途** 同桌，负责喜剧节拍与"真正要命时没丢下人"的反差。
- **构图** 面向左，身体前倾、脖子前伸 1 头高的 1/5；一手比划，一手插兜；连帽衫套在校服外
- **恐怖项 1** 笑容过大（嘴角越界到颊侧，露出整齐得不像人的牙）
- **参考图** `laoren.png`，`0.60`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no elbows or knees, four-finger hands in small white gloves, pie-cut eyes, oversized egg-shaped head, 4.5-head proportion, bone-cream 8px cut-out keyline around the silhouette, aged cream paper fibre, halftone dots, one strong key light upper front-left, sepia shadow on the right, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: an 18-year-old Chinese high school boy, three-quarter view facing left, half body, body leaning forward with the neck pushed out ahead of the chest, one hand gesturing mid-sentence and one hand in the pocket, spiky hedgehog hair drawn as sharp inked triangles, a smile stretched too wide past the cheek line revealing a row of perfectly even teeth, eyes pie-cut and bright, a pair of cheap headphones hanging around his neck with one earcup cracked. He wears a loose hoodie over the school track jacket, hood bunched at the back of the neck. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

### C04 `miaoshan` · 苗小善

- **用途** 安静的记忆者；在所有人慌乱时提醒"刚才电话还能打通"。
- **构图** 面向左，双臂抱一本合起的书贴胸；重心在左腿；垂眼看向下方 15°
- **恐怖项 0** —— 全作最"干净"的一张，用来当对照
- **参考图** `laoren.png`，`0.60`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no elbows or knees, four-finger white-gloved hands, pie-cut eyes, oversized egg-shaped head, 4.5-head proportion, bone-cream 8px cut-out keyline, aged cream paper fibre, halftone dots, key light upper front-left, sepia shadow right, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: a 17-year-old Chinese high school girl, three-quarter view facing left, half body, standing quietly with her weight on the left leg, both arms hugging a closed hardcover book against her chest, eyes lowered about fifteen degrees, calm closed mouth, long straight black hair drawn as one solid inked mass with a few separating strands, a knitted cardigan over the school shirt with three visible buttons, a cheap cartoon-faced wristwatch on her left wrist, its face a blank cream disc. Nothing monstrous about her at all. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

### C05 `wangshanshan` · 王珊珊

- **用途** 被鬼婴标记**之前**的干净版（`e5`/`e6`）。
- **构图** 面向左，舞蹈生站姿：脚尖外开、脊柱直、肩打开；一手抬至胸前，一手垂；高马尾+发带
- **恐怖项 0**
- **参考图** `laoren.png`，`0.60`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no elbows or knees, four-finger white-gloved hands, pie-cut eyes, oversized egg-shaped head, 4.5-head proportion, bone-cream 8px cut-out keyline, aged cream paper fibre, halftone dots, key light upper front-left, sepia shadow right, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: a 17-year-old Chinese high school girl trained in dance, three-quarter view facing left, half body, upright dancer's posture with open shoulders and a long straight spine, feet turned slightly outward, high ponytail tied with a wide ribbon, ponytail drawn as one sweeping inked curve, one hand lifted near the collarbone and the other hanging relaxed, chin slightly up, calm neutral expression. She wears a fitted school track jacket tucked into loose school sports trousers with one pale side stripe, the jacket hem cinched. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

### C06 `wangshanshan_marked` · 王珊珊（被标记）

- **用途** 后颈青黑手印版本（`e8`/`g3`/`g4`）。**差分。**
- **构图** 与 C05 同姿同光；后颈手印沿颈侧向肩蔓延，青黑转干血，边缘像墨渗
- **参考图** 本体 C05 最终图，`0.85`
- **提示词**

```
Edit of the supplied image, keep composition, pose, lighting, framing and colour layout identical. Change only this: on the back of her neck a child-sized handprint in dark blue-black ink, the pigment spreading from the nape down along the left side of the neck and over the shoulder in creeping ink-bleed tendrils, the centre of the print drying toward a dull blood red, the skin around it slightly raised and drawn with one or two extra inked creases. Everything else stays identical, including the ponytail, ribbon, uniform and the bone-cream 8px cut-out keyline. Style stays 1930s rubber-hose cartoon horror, thick uneven hand-inked contours, flat fills, aged cream paper, halftone dots, key light upper front-left, palette limited to ink black, bone cream, sepia, dried blood and one cold teal. Transparent background, no text, no lettering, no watermark, no frame.
```

### C07 `zhouzheng` · 周正

- **用途** 国际刑警 / 驭鬼者，讲课段的核心。腹部鼓胀是叙事伏笔。
- **构图** 面向左，站姿笔直但肩塌；长风衣未扣，扣子绷紧；一手垂下夹卫星电话
- **恐怖项 1** 腹部：风衣下异常浑圆，撑开两颗扣子
- **参考图** `laoren.png`，`0.60`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no elbows or knees, four-finger white-gloved hands, pie-cut eyes, oversized egg-shaped head, 4.5-head proportion, bone-cream 8px cut-out keyline, aged cream paper fibre, halftone dots, key light upper front-left, sepia shadow right, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: an emaciated Chinese man in his thirties, a plainclothes international police officer, three-quarter view facing left, half body, standing straight but with collapsed shoulders, cheekbones sharp, eye sockets hollow with flat pie-cut eyes, a thin neck too long, a single strand of long hair across the forehead. He wears a long unbuttoned raincoat over a shirt, the coat's lower buttons pulled apart by an unnaturally round, taut, swollen belly that reads as a single smooth balloon shape under the cloth, the belt hanging unbuckled. One hand hangs down holding an old satellite phone by the antenna. Nothing else monstrous. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

### C08 `zhouzheng_dying` · 周正（濒死）

- **用途** 拖住老人之后、肚皮被撕开之前（`e1`/`e1b`/`e2`）。**差分。**
- **构图** 与 C07 同姿同光；眼窝加深，嘴角血，风衣下摆开裂渗墨
- **参考图** 本体 C07 最终图，`0.85`
- **提示词**

```
Edit of the supplied image, keep composition, pose, lighting, framing and colour layout identical. Change only these: the eye sockets deepen until the eyes read as flat dark hollows with a single cold teal pinpoint in one; a thin dried blood line runs from the corner of the mouth down the chin; the raincoat hem and one sleeve are torn and dissolving into wet black ink that drips and pools; the swollen belly is now visibly stretched with a faint dark crack across it. Keep everything else identical, including the bone-cream 8px cut-out keyline. Style stays 1930s rubber-hose cartoon horror, thick uneven hand-inked contours, flat fills, aged cream paper, halftone dots, key light upper front-left, palette limited to ink black, bone cream, sepia, dried blood red and one cold teal. Transparent background, no text, no lettering, no watermark, no frame.
```

### C09 `fangjing` · 方镜

- **用途** 知道"未来"的人；本作最不舒服的一张人类立绘。
- **构图** 面向左，双手垂在身前，一手捏半透明纸片；校服扣到最上一颗
- **恐怖项 2** 不对称瞳孔（一圆一竖裂）+ 笑不达眼（嘴笑，眼不动）
- **参考图** `laoren.png`，`0.60`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no elbows or knees, four-finger white-gloved hands, pie-cut eyes, oversized egg-shaped head, 4.5-head proportion, bone-cream 8px cut-out keyline, aged cream paper fibre, halftone dots, key light upper front-left, sepia shadow right, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: an 18-year-old Chinese high school boy, three-quarter view facing left, half body, standing very still with both hands low in front of the body, the school shirt buttoned to the very top button, flat neat short hair combed tight to the skull, a polite closed smile on the mouth while the eyes stay completely flat and unamused, and the two pie-cut eyes unequal: one a round white wedge with a small pupil, the other narrowed into a vertical slit like a cut. In one hand he holds a thin translucent sheet of paper that glows faint cream and shows nothing but soft mottling. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

### C10 `laoren` · 老人（鬼敲门）

- **用途** A 级鬼本体，全场最恐怖；同时是**立绘族 style plate**。
- **构图** 面向左，驼背、头前伸过头顶线；一手拄弯拐杖；长衫下摆融入滴落的墨
- **恐怖项 3** 过长脖 + 空眼眶 + 融化墨
- **参考图** 无（**本张即 plate**）
- **提示词**

```
1930s rubber-hose cartoon horror character, Fleischer-era cartoon language redrawn as a corpse, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no joints, four-finger white-gloved hands, oversized egg-shaped head, exaggerated 4-head proportion, bone-cream 8px cut-out keyline, aged cream paper fibre, halftone dots, key light upper front-left, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: an emaciated elderly Chinese corpse-man, three-quarter view facing left, half body, hunched with the head thrust forward past the chest on a neck far too long and thin, bald crown with three greasy black strands, sunken temples, skin a dead grey-sepia with mottled liver spots and purple corpse bruising, eye sockets hollow with flat dead-grey discs and a single pinpoint of cold teal, a mouth drawn too wide and slack with a hairline crack up the cheek, no smile. He wears a high-collared black Chinese changshan with cloth button knots, the hem dissolving into wet black ink drips, one white-gloved hand gripping a crooked wooden cane. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

### C11 `guiying` · 鬼婴

- **用途** 从周正腹中爬出的东西，第三幕主威胁。
- **构图** 侧向贴地在墙上爬：四肢张开、头低垂、身体弓起；构图偏下（`dim:true` 使用时仍需可读）
- **恐怖项 3** 全项
- **参考图** `laoren.png`，`0.58`
- **提示词**

```
1930s rubber-hose cartoon horror character, thick uneven hand-inked black contours with pen pressure wobble, flat opaque fills, noodle limbs with no joints, oversized head on a thin body, bone-cream 8px cut-out keyline, aged cream paper fibre, halftone dots, key light upper front-left, palette strictly limited to ink black, bone cream, sepia, dried blood red, one cold dark teal. Subject: a newborn infant turned into something that crawls, presented sideways as if clinging to a wall, seen from the side and slightly above, entire figure about one and a half heads tall, an oversized bald head with two solid black eyes that have no whites and no pupils, a mouth too wide with no lips and no teeth, skin a cold blue-black with dried-blood creases at every joint, four limbs unnaturally long and thin like a spider's, ending in small white gloves, the spine arched backward, the belly a wet black hollow. Every limb bends at no visible joint. No umbilical cord. Isolated on a fully transparent background, no scenery, no ground shadow, no text, no letters, no numerals, no watermark, no border, no frame.
```

---

## 3. 场景（21 + 21 `_rot`）

> 统一规格：**生成 1536×1024 → 交付 1536×864（16:9）** / JPEG progressive q80 / 200–320 KB / `background:opaque` / `quality:high`
> 统一构图：地平线 y=62%（裁后 64.2%），灭点 (50%, 同高)，主光左上，暗角 38%，安全区 x15–85% / y10–90%
> 统一禁令：**人物 0 个**（S05 例外：1 个无五官剪影）、**零文字**
> `_rot` 统一做法：本体最终图 `image1` + `input_fidelity 0.72` + 腐化后缀（见每项末）

**`_rot` 通用后缀（追加在本体提示词之后）**

```
Keep the exact same camera, framing, horizon line, vanishing point, object positions and key light. Only the material has decayed: paint peeling off in sheets, black mould spreading down from the ceiling corners, long water stains running vertically, rust blooming on every metal edge, ink seeping out of the seams between surfaces, furniture edges going soft and sagging, a shallow pool of black ink on the floor.
```

### S01 `room_night` · 城东出租屋 · 深夜

- **用途** 序幕 6 处使用；玩家看到的第一个房间。
- **构图** 灭点在窗与床之间；铁栏杆窗居左，街灯冷青从窗帘缝切入；单床、折叠桌、亮着的显示器（屏幕**空白微光，无字**）、垂下的充电线
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, one strong key light from the upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a small rented room in a Chinese city at midnight, one-point perspective with the vanishing point between the barred window and the bed, a narrow single bed with a rumpled quilt pushed against the wall, a folding table holding an old monitor whose blank screen emits a cold teal glow, a tangle of charging cables hanging off the table edge, a cheap wardrobe with one door not quite shut, a barred window on the left with a street lamp outside throwing a hard teal shaft through a gap in the curtain onto the floor, dust in the air, the wallpaper stained in one corner. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S02 `hospital` · 外省第三中医院 · 急诊室外

- **用途** 帖子里的照片画面（第一幕），"看照片不会招来他"的证据。
- **构图** 走廊纵深，塑料连排椅列在左，地面一处干血，尽头的日光灯半亮
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: the corridor outside an emergency room in a Chinese provincial hospital at night, one-point perspective down the hallway, a long row of blue plastic linked chairs along the left wall, several of them pushed out of line, one IV stand standing alone with nothing attached, a closed swing door at the end of the corridor with a half-lit fluorescent tube above it flickering, a dark dried blood stain pooled on the terrazzo floor in the middle distance, a blank notice board on the right wall covered with empty pieces of paper of different sizes, the ceiling tiles discoloured in one patch. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S03 `classroom` · 高三（二）班 · 晚自习

- **用途** **全作主场景**（7 处）；也是**场景族 style plate**。验收看这张。
- **构图** 单点透视沿中央过道；左墙铁栏杆窗；正面绿黑板（仅抽象粉笔痕）；吊管灯一盏接触不良；右后门微开漏冷青
- **参考图** 无（**本张即 plate**）
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: an empty Chinese high-school classroom at night in the year 2000, one-point perspective down the central aisle between rows of double wooden desks with scratched tops, all chairs pushed neatly under the desks except one pulled out slightly, a window wall on the left with vertical iron security bars and a low green painted wall skirt, a long green blackboard on the far wall covered only with a few abstract dusty chalk arcs and eraser smears, a chalk tray holding three broken chalk stubs, two suspended fluorescent tubes with one tube failing, a back door ajar on the right with cold teal light leaking through the gap, a school bag left on a desk in the mid-ground, dust in the light. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S04 `classroom_early` · 同一间教室 · 讲课之前

- **用途** 周正写板书之前（`p10` 前）。
- **构图** 与 S03 **逐像素同构**；差别只有：黑板被擦得干净（仅一道湿痕）、灯全亮、桌面更整齐、后门关上
- **参考图** `classroom.png`（同 plate），`input_fidelity 0.70` —— 以 S03 为 `image1` 保留构图
- **提示词**

```
Same classroom and exact same camera as the reference image, keep the composition, horizon line and vanishing point identical. Only change the state: the green blackboard has just been wiped clean and shows nothing but one damp grey smear and a faint eraser arc, both fluorescent tubes are fully lit and even, every chair is squared to its desk, the back door on the right is fully closed with no light leaking through, the desks are tidier and the floor is less littered. Style unchanged: 1930s rubber-hose cartoon background painting, thick wobbly hand-inked contours, flat simplified shapes, aged cream paper, palette limited to bone cream, sepia, ink black, a little dried blood red and one cold teal, key light upper front-left, vignette 38 percent, halftone dots, film grain. No people, no lettering, no writing, no Chinese characters, no numerals, no watermark, no frame.
```

### S05 `classroom_ghost` · 门外站着人

- **用途** 第一幕惊悚点；本批**唯一允许出现人物剪影**的场景。
- **构图** 同 S03 机位；右后门玻璃外**一个瘦长黑剪影**站在走廊里，无五官、无衣褶细节，头顶略高于门框中线
- **参考图** `classroom.png`，`0.62`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: the same Chinese high-school classroom at night seen from the same one-point perspective down the aisle, but almost all the fluorescent tubes are dead so the room reads much darker, and through the glass pane of the half-open back door on the right there stands a single tall thin figure in the corridor outside, rendered as one solid flat ink-black silhouette with no face, no features and no clothing detail, its head slightly above the middle of the door frame, the cold teal light behind it making a thin rim along its edge. Inside the room only the blackboard and the nearest desk edges are still visible. No other people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S06 `classroom_after` · 三天后的空教室

- **用途** 尾声/档案回看；"暂无凶手"的那间教室。
- **构图** 同 S03 机位；课桌被推到两侧、警戒线斜拉过前景、地面灰白积尘、黑板被擦花但留痕
- **参考图** `classroom.png`，`0.68`
- **提示词**

```
Same classroom and exact same camera as the reference image, keep the composition, horizon line and vanishing point identical. Change the state to three days later: the desks are shoved back against both side walls leaving the aisle wide and empty, a strip of police barrier tape stretches diagonally across the foreground at chest height, a thick layer of pale dust covers the floor with footprints scuffed through it, the blackboard has been half wiped leaving vague grey ghost arcs, one chair lies on its side, a window pane is cracked. Style unchanged: 1930s rubber-hose cartoon background painting, thick wobbly hand-inked contours, flat simplified shapes, aged cream paper, palette limited to bone cream, sepia, ink black, a little dried blood red and one cold teal, key light upper front-left, vignette 38 percent, halftone dots, film grain. No people, no lettering, no writing, no Chinese characters, no numerals, no watermark, no frame.
```

### S07 `corridor_dark` · 五楼走廊 · 鬼域

- **用途** **使用最高频场景（11 处）**，是"鬼域"这张牌的门面。
- **构图** 长纵深走廊，门等距排列；尽端一盏半亮的灯是唯一光源；墙裙 1.1 m 线连续；地面水磨石反光拉长
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a long empty school corridor at night, hard one-point perspective with the vanishing point dead centre at the far end, identical classroom doors receding on both sides, a continuous green painted wall skirt running at hip height along the whole corridor, terrazzo floor polished enough to smear the reflections, one failing fluorescent tube near the far end as the only light source, the rest of the ceiling lost in dark, a fire hose cabinet with its glass broken on the left, one door standing ajar showing a black gap, ceiling plaster sagging in one patch, dust suspended in the cold light. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S08 `corridor_2f` · 二楼半 · 厕所外的旧走廊

- **用途** 更老、更低矮的一段走廊，通往厕所。
- **构图** 天花更低、外露管道；右侧一扇磨砂玻璃门（厕所）；左侧一扇封死的窗
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: an old low-ceilinged school corridor on a half floor, one-point perspective down it, exposed water pipes running along the ceiling with one joint wrapped in rag, a frosted glass door on the right leading to a toilet with a dark wet stain at its foot, a window on the left bricked up with mismatched boards, cracked pale green plaster falling away in a patch to show grey mortar, a wooden bench with one leg shorter than the others leaning against the wall, a single bare bulb hanging from a wire as the only teal-white light. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S09 `stairwell` · 楼梯间

- **用途** "永远的五楼"主场景；`_rot` 用于 `c2a`/`c2b`/`c2d`。
- **构图** 站在楼梯平台向上望半层；扶手曲线作为画面主引导线；一扇带铁栏的窗；上下两级台阶都在画面内
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a school stairwell landing seen from the half-floor, looking up at the next flight, a heavy steel handrail curving away as the main leading line, concrete steps with worn pale nosings, a barred window on the landing casting a hard grid of cold teal light across the wall, the wall skirt painted green to hip height, a dead bulb in a wire cage above, one step with a dark dried stain smeared along its edge, the flight above disappearing into darkness. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S10 `stairwell_mirror` · 楼梯间 · 镜面

- **用途** "镜子里多了一个人"。
- **构图** 同 S09 机位；平台墙上加一面旧木框镜，镜中映出走廊纵深，**镜中多一个瘦长剪影**（仅镜内，画面内无实体）
- **参考图** `stairwell.jpg`（本体）→ 用 `classroom.png` 做首张 `0.55`，建议以 S09 出图后 `0.75` 精修
- **提示词**

```
Same stairwell landing and exact same camera as the reference image, keep the composition, handrail curve, window grid and vanishing geometry identical. Add one thing: a large old wooden-framed mirror bolted to the landing wall, its glass dulled and spotted, and inside the mirror the reflection of the corridor behind does not match the room, because in it stands one extra tall thin figure rendered as a flat ink-black silhouette with no face, small and far away in the reflected depth. Nothing is standing in the actual stairwell. Style unchanged: 1930s rubber-hose cartoon background painting, thick wobbly hand-inked contours, flat simplified shapes, aged cream paper, palette limited to bone cream, sepia, ink black, a little dried blood red and one cold teal, key light upper front-left, vignette 38 percent, halftone dots, film grain. No other people, no lettering, no writing, no Chinese characters, no numerals, no watermark, no frame.
```

### S11 `toilet` · 二楼半厕所

- **用途** "惨白的手"高潮段（`c3`/`d2`/`d3`）。
- **构图** 从门口望进去；蹲位隔断排列，最里一扇门半开；地面积水；水龙头滴水形成唯一高光
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a school toilet on a half floor seen from the doorway, one-point perspective down a row of squat cubicles, pale green partition doors with one at the far end standing half open onto darkness, a row of taps along the left wall with one dripping, a shallow sheet of water on the tiled floor reflecting the cold teal light in long broken streaks, tiled walls with a dark tide line of grime at the bottom, a mop leaning in the corner, ceiling light a single failing tube. One wet hand-shaped smear on the inside of the nearest partition door. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S12 `void_dark` · 无尽黑暗

- **用途** 手机灯只照到一米；红光之前的绝对黑。
- **构图** 无透视；中央偏下一点冷青光锥；光锥边界的颗粒可数；四周纯墨
- **参考图** `classroom.png`，`0.42`（只取颗粒与色温）
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: absolute darkness with no architecture at all, the frame almost entirely ink black, and in the lower centre a single narrow cone of cold teal light from a phone torch, the cone only reaching about one metre before dying, the edges of the cone ragged and grainy, a few dust motes lit inside it, the floor beneath barely suggested by two or three faint inked tile lines that stop abruptly where the light ends, the rest of the space reading as endless empty void. No horizon, no walls, no ceiling. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no watermark, no border, no frame.
```

### S13 `bone_tree` · 白骨树 · 无名之地

- **用途** 树上的黑影；"比门外那个老人更不该被惊醒"。
- **构图** 仰角 10–15°；巨树主干居中偏左，树皮像骨；一根横枝上**倒挂**一个 4 m 无面孔黑影，胸口一枚锈棺材钉，黑色液体往下滴
- **参考图** `classroom.png`，`0.45`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, low upward camera angle of about twelve degrees, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a nameless dead place at night, one enormous tree filling the frame, its trunk and branches pale and bone-like with jointed segments that look like vertebrae, bark drawn as long vertical inked grooves, and hanging upside down from a heavy horizontal branch a four-metre tall faceless shadow figure rendered as a flat ink-black mass with no features, a long rusty coffin nail driven through its chest, black liquid dripping from the nail and from its hanging head down toward the ground where a shallow black pool has formed, bare cracked earth below, no stars, no other trees, everything beyond the light falling into ink. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no watermark, no border, no frame.
```

### S14 `playground` · 操场 · 四点零五分

- **用途** 第四幕；电话里的敲门声。
- **构图** 平视，地平线 62%；左前方篮球架作为前景剪影，跑道弧线向右延伸；看台在远处；一盏场地灯
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: an empty Chinese school sports ground at four in the morning, eye-level view, a single basketball hoop on a leaning pole in the left foreground cutting a black silhouette against the sky, the curved line of a running track sweeping away to the right, low concrete bleachers in the far distance, one tall floodlight mast with a single cold teal lamp still burning and a cone of drizzle visible in its beam, the ground cracked and patchy, thin ground fog lying in the low spots, sky a flat pale sepia-grey with no moon. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S15 `woods` · 操场边绿化林

- **用途** 方镜那通电话（`f8`）。
- **构图** 林中小径居中，两侧树干密集，雾在腰高；光源只有一点从树冠漏下的冷青
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a narrow belt of trees at the edge of a school sports ground at night, a packed-dirt path running straight into the depth and vanishing into fog, tree trunks densely packed on both sides drawn as vertical inked bars with no leaves low down, waist-high ground fog lying across the path in flat bands, one thin shaft of cold teal light falling through the canopy onto the middle of the path, a discarded school shoe at the edge of the frame, the depth beyond twenty metres reading as solid ink, no sky visible. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S16 `guard_booth` · 保安室

- **用途** 监控、半开的门、玻璃上的手印。
- **构图** 从窗外向内看；桌上 4 台 CRT 监控屏（**屏上只有雪花噪点，无画面无字**）；门半开；玻璃外侧一只手掌印
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a school gatekeeper's booth seen from outside through its window at night, a narrow room with a desk holding four small old CRT monitors whose screens show nothing but grey static snow, a mug and a folded newspaper on the desk, a bare bulb above, a door on the far side standing half open onto complete darkness, a wall of pigeonhole key slots with every slot empty, and on the outside of the window glass a single palm print pressed in the dust at chest height, fingers spread. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals on the screens, no signage, no watermark, no border, no frame.
```

### S17 `school_gate` · 校门

- **用途** 8 处；进出关口的心理锚点。
- **构图** 正面略偏左；电动伸缩门半开；门卫室在右；门牌**留空**；街对面被雾吞掉
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: the main gate of a Chinese middle school at night, seen frontally and very slightly from the left, a retractable metal security gate half drawn across the entrance with its lattice reading as a black grid, a brick gate pillar on each side with a blank rectangular nameplate mounted on the left pillar and completely empty, a small gatehouse with one lit window on the right, a sodium street lamp outside casting a warm sepia pool on the road, the street beyond the gate swallowed by fog after ten metres, one loose sheet of paper caught against the gate lattice. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### S18 `street_dawn` · 步行街 · 凌晨五点三十一

- **用途** 终幕出口（10 处）；**唯一不用 `_rot` 的收束画面**。
- **构图** 与 S19/S20 **同机位**；砖铺步行街纵深；卷帘门全关；路灯未熄；天将亮的冷青→骨白渐变
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a pedestrian shopping street in a Chinese city at half past five in the morning, one-point perspective down the brick-paved street, closed roller shutters on both sides with their metal ribs drawn as tight horizontal lines, two street lamps still lit and buzzing at the edge of dawn, a stack of plastic crates outside one shop, a bicycle leaning on its stand, the sky above the far end shifting from cold teal at the horizon to bone cream higher up, the bricks still wet from the night, everything empty and quiet and slightly too still. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no shop signage, no watermark, no border, no frame.
```

### S19 `street_day` · 步行街 · 白天

- **用途** 6 处；"世界照常运转"的对照面。
- **构图** 同 S18 机位；卷帘门全开、货物外摆；光变平、暗角减弱到 20%；仍**无人物**
- **参考图** `classroom.png`，`0.55`
- **提示词**

```
Same street and exact same camera as the reference image, keep the composition, horizon line and vanishing point identical. Change only the time of day: full daylight, all roller shutters rolled up and open with goods stacked and hanging outside the shops, the brick paving dry and bright, the street lamps off, the sky flat pale bone cream, shadows short and soft, the vignette reduced to about twenty percent and the grain lighter, the whole scene calm and ordinary. Style unchanged: 1930s rubber-hose cartoon background painting, thick wobbly hand-inked contours, flat simplified shapes, aged cream paper texture, palette limited to bone cream, sepia, ink black, a small amount of dried blood red and one cold teal accent, halftone dots and light film grain. No people, no lettering, no writing, no Chinese characters, no numerals, no shop signage, no watermark, no frame.
```

### S20 `street_night` · 步行街 · 夜晚

- **用途** 冲出校门那一刻（`f10` 后）。
- **构图** 同 S18 机位；夜、灯全亮、雨后反光最强、暗角回满 38%
- **参考图** `classroom.png`，`0.55`
- **提示词**

```
Same street and exact same camera as the reference image, keep the composition, horizon line and vanishing point identical. Change only the time of day: deep night, every street lamp lit and haloed, shop shutters closed, the brick paving soaked and mirror-bright with long vertical reflections of the lamps, thin rain falling visible only inside the lamp cones, sky solid ink black, vignette back to full thirty-eight percent, grain heavier. Style unchanged: 1930s rubber-hose cartoon horror background painting, thick wobbly hand-inked contours, flat simplified shapes, aged cream paper, palette limited to bone cream, sepia, ink black, a little dried blood red and one cold dark teal, halftone dots, projector scratches. No people, no lettering, no writing, no Chinese characters, no numerals, no shop signage, no watermark, no frame.
```

### S21 `morgue` · 医院 · 停尸间

- **用途** "那具尸体不见了"。
- **构图** 正面一排不锈钢抽屉；**中间一格拉出且空**；地上一条拖痕通到门口；地漏在中央
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a hospital mortuary at night, frontal symmetrical view of a wall of stainless steel drawers with round handles, the middle drawer pulled fully out and completely empty with its tray bare, one white sheet fallen in a heap on the tiled floor beside it, a long dark drag mark smeared from the drawer across the floor toward the door, a floor drain in the centre, a single green-tinted fluorescent tube above, the ceiling and corners heavy with shadow, condensation on the steel. Nothing else in the room. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no labels on the drawers, no signage, no watermark, no border, no frame.
```

---

## 4. 结局插画（7）

> 统一规格：**生成 1536×1024 → 交付 1536×864（16:9）** / JPEG progressive q82 / 220–320 KB / `background:opaque`
> 统一构图：地平线 62%，主光左上，暗角 38%；与场景同一套 LUT
> 统一禁令：零文字；人物只允许剪影或背影（**不画正脸**）

### E01 `e_door` · 门后的第十三次

- **用途** 结局 1；"暂无凶手"。
- **构图** 门在画面中央偏右、半开 25°；门板上十三道**刻痕**（横线，不是数字）；门内是更黑的走廊与一盏远灯
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a closed classroom door standing half open about twenty-five degrees, seen slightly from the left, the door surface of old painted wood with a small frosted glass pane at the top, and on the door panel thirteen short horizontal scratches carved in a rough column, each a single quick stroke, no numerals and no writing anywhere. Beyond the opening, a corridor recedes into darkness with one single cold teal lamp burning very far away like an unclosed eye, and a thin spill of that light lies across the threshold. The floor in front of the door is empty. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no watermark, no border, no frame.
```

### E02 `e_stairs` · 永远的五楼

- **用途** 结局 2。
- **构图** 极低视角仰望一圈圈向上收拢的楼梯井；每层墙上同一块**空白**楼层牌；一段台阶上一只磨破的校鞋
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, extreme low upward camera angle, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a stairwell shaft seen from the very bottom looking straight up, flights of stairs and landings spiralling upward and inward toward a small bright square of ceiling far above, the handrails drawing a tightening spiral, every landing wall carrying an identical completely blank rectangular floor plate with no numerals on it, one worn-out school shoe lying alone on a step in the lower foreground, its toe pointing downward toward the viewer, the concrete edges chipped, the void in the middle of the spiral reading as pure ink. No people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no watermark, no border, no frame.
```

### E03 `e_alone` · 一个人走出校门

- **用途** 结局 3。
- **构图** 从校门内侧向外看；一串脚印向远处去；早班公交驶过（车身**无线路号**）；一个**背影**极小而远
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: the view from inside a school gate looking out at dawn, the open gate frame in the foreground, a single set of footprints in the thin dust leading away from the camera and shrinking into the distance, an early city bus passing on the road beyond with all its windows blank and lit, the sky pale cream, the street buildings low and grey, and one small distant human figure seen only from behind, entirely in flat black silhouette, walking away and about to be lost among the buildings. No other people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no bus route numbers, no signage, no watermark, no border, no frame.
```

### E04 `e_absorb` · 成为鬼

- **用途** 结局 4。
- **构图** 教室，一人**背对观众**坐于课桌；身上睁开一圈红眼（8–12 只，沿背脊与肩）；黑板上只余抽象粉笔痕
- **参考图** `classroom.png`，`0.58`（沿用 S03 机位）
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: the same empty classroom at night seen from behind, one student sitting alone at a desk facing away from the viewer, seen only as a black silhouette from the back, and along the spine and both shoulders of that silhouette a ring of small blood-red eyes have opened in the skin, each one a narrow almond with a black pupil, about ten of them arranged in a rough spiral, the nearest eye catching a cold teal glint. On the green blackboard ahead there is nothing but vague dusty chalk arcs, and the fluorescent tube above the figure is failing. No other people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no watermark, no border, no frame.
```

### E05 `e_eighth` · 第八个人

- **用途** 结局 5；全作最"冷"的一张。
- **构图** 清晨街道，六个人背向远处；地面**拉出六道影子 + 第七道没有主人**；第七道明显更长
- **参考图** `classroom.png`，`0.55`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a wide brick-paved pedestrian street at first light, low sun raking in from the upper left, six human figures walking away from the camera in a loose group, all rendered as flat black silhouettes seen from behind with no detail, and on the pale ground each of them casts a long shadow stretching toward the camera, making six shadows, and then a seventh long shadow lying beside them at a slightly wrong angle that belongs to nobody at all, longer than the others and slightly narrower. The street is otherwise completely empty, shutters closed, one lamp still on. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

### E06 `e_written` · 被写下的人

- **用途** 结局 6。
- **构图** 桌面特写俯角；一张薄如皮肤的半透明纸居中，纸面**墨迹正在成形**——但画成**无意义的墨线笔画**，不构成任何字形
- **参考图** `classroom.png`，`0.50`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a close view of a scratched wooden desk top at night seen from slightly above, and lying in the centre of it a single sheet of thin translucent material like dried human skin, its edges irregular and slightly curled, and on its surface fresh wet black ink strokes are in the act of appearing, drawn as meaningless worming brush marks that trail off into wet pools, deliberately not forming any letters or characters or numerals at all, the wet ink still glossy and the paper glowing faint cream from beneath, a cheap ballpoint lying beside it, the rest of the desk falling into darkness. No hands, no people. Absolutely no lettering, no writing, no Chinese characters, no numerals, no words, no watermark, no border, no frame.
```

### E07 `e_true` · 五点三十一分

- **用途** 结局 7（正解 / 第一卷终）。
- **构图** 步行街晨光；**七个人背面**（一大六小）；身后远处地面残留一片**未熄的红光**
- **参考图** `classroom.png`，`0.55`
- **提示词**

```
1930s rubber-hose cartoon horror background painting, gouache and ink on aged cream paper, thick wobbly hand-inked contours, flat simplified shapes, bowed hand-drawn perspective, palette strictly limited to bone cream, sepia brown, ink black, a little dried blood red and one cold dark teal, key light upper front-left, horizon at 62 percent, even vignette 38 percent, halftone dots, film grain, projector scratches. Subject: a brick-paved pedestrian street at dawn, seven people walking away from the camera together in a loose cluster, one taller figure and six smaller ones, all rendered as flat black silhouettes seen from behind with no facial detail, their shadows falling toward the camera, and far behind them on the ground a wide patch of dying blood-red light still glows and fades out across the bricks, the street lamps behind now off, the sky ahead a pale bone cream, the buildings low and quiet. Warm, exhausted, almost safe. Absolutely no lettering, no writing, no Chinese characters, no numerals, no signage, no watermark, no border, no frame.
```

---

## 5. 批量生成顺序与风险

### 5.1 建议顺序（先锁基准，再放量）

1. **先出场景族**：`classroom`（已为 plate）→ `corridor_dark` → `stairwell`。三张确认光向/地平线/暗角一致后，再出其余 18 张。
2. **再出立绘族**：`laoren`（已为 plate）→ `yangjian` 重跑（用 plate 做 `image1`，**不要纯文生图**）→ `zhouzheng` → 其余 8 张。
3. **差分最后**：全部走 img2img，不重画。
4. **`_rot` 最后批量**：同一条 LUT、同一 `input_fidelity`，一次性出 21 张，避免批次漂移。

### 5.2 最容易跑偏的资产（预判）

| 资产 | 风险 | 对策 |
|---|---|---|
| `yangjian` | **最高**。学生 + 校服 + 少年 = 强烈触发日漫写实。本轮样张已翻车一次 | 纯文生图必失败。**强制**以 `laoren.png` 为 `image1`，`input_fidelity ≥ 0.60`；提示词把"thick uneven hand-inked contours / flat opaque fills"放在**最前** |
| `guiying` | 高。婴儿形象容易被"可爱化"或"过度血肉化" | 强调 `no blood, no gore, no realistic baby`；用"蜘蛛般四肢 + 白手套"锁住卡通语法 |
| `wangshanshan` / `miaoshan` | 高。女性角色容易被拉向美型插画 | 强调 `4.5-head proportion`、`no anime face`、`no glossy hair`；用 plate 保线宽 |
| `bone_tree` | 中。容易变成写实奇幻概念图 | 保留 `flat simplified shapes`，禁止 `epic fantasy`；树皮用"椎骨分节"这个具体指令 |
| `void_dark` | 中。容易生成"有内容的黑"，破坏"空" | 明确 `no horizon, no walls, no ceiling`，只留光锥 |
| 所有 `_rot` | 中。模型会在"腐蚀"时**改构图** | 叠图差值验收，结构边缘差 ≤ 6 px，否则重跑 |

### 5.2b 批次已知偏差（立绘全族，接受不修）

| 项 | 现象 | 处置 |
|---|---|---|
| 内部结构线偏细 | 1024 基准下 3px，进游戏约 2px；与外轮廓 10–14px 反差大 | 批量约束下一批 `internal line ≥4px`，已过的 11 张不回炉 |
| `guiying` 撕纸碎边 | 模型把切边画成撕纸质感 | 接受，屏上读作纸屑颗粒 |
| `zhouzheng` / `zhouzheng_dying` 头身偏小 | 比少年组更接近真人比例 | 解释为『成年角色』，保留 |
| `miaoshan` 表情偏怒 | 设定是『安静垂眼』 | 用户已接受，不为表情重跑 |

### 5.3 已知待清项（v1.1 更新，已解决）

- ~~水印~~ → 已解决。`tools/clean_watermark.py` 实测：**场景在 3:2 → 16:9 居中裁切时，水印所在的底部条带被整体裁掉**，零痕迹、无需修补；**立绘**在棋盘格 keying 时水印随背景一起消失，仅需在框内补清 0–2 px 残留。若某张图原生就是 16:9（水印留在画内），脚本会改用"裁掉水印带 + 回过拉伸 5–7%"——比镜像填补干净（实测镜像会在墙面上复制出第二个柜子）。
- **新增待清项：眼线高度不齐**。6 张锚定图眼线在 19%–27% 之间摆动，同屏并排时"机位高度"不一致。批量前需要一个"眼线对齐到 22%"的步骤（上补透明留白 / 下裁切）。
- **新增待清项：场景线宽偏细**。场景按 1536 宽出图时，外轮廓实测细于 §4.1 要求的 9–14 px。批量时用 `corridor_dark` 的句式，并直接写明 `contour lines 10 to 14 pixels thick`。

---

# 附录 A · 背景纸纹层规格（交付工程，勿自行改参数）

**资产** `art/ui/paper_grain.png` · 512×512 · PNG · 可无缝平铺（已用 FFT 周期噪声构造，接缝差 10.76 vs 内部 10.78，数学上无接缝）
**平铺预览** `art/ui/_paper_grain_tile3x.png`（3×3 拼接）· `art/ui/_paper_grain_seam.png`（跨四格交点的 1:1 裁切）

## A.1 为什么加这一层

立绘是"画在纸上"的（纸纹 + 网点 + 墨线），场景是数字绘的。两者材质语言不同，人物会显得"贴"在背景上。
把纸纹**只压在背景**、不压人物，让布景也变成"纸"，缝才合得上（见 `mock_paper.png` 对照）。

## A.2 插入位置

加在 `.bg-wrap` 的伪元素上 —— 它随背景一起被 `object-fit:cover` 裁切、跟着转场淡入淡出，且**在立绘之下**（`.sprites` 是 `.stage` 的 z-index:2，`.bg-wrap` 是 z-index:0）。

```css
/* 背景纸纹 + 网点：只压场景，不压人物 */
.bg-wrap::after{
  content:"";
  position:absolute; inset:0;
  pointer-events:none;
  background-image:url("../art/ui/paper_grain.png");
  background-repeat:repeat;              /* 必须 repeat，不能 repeat-x */
  background-size:512px 512px;           /* 必须写死 px，不要用 cover/% */
  mix-blend-mode:multiply;               /* multiply 压暗；不要用 overlay（会提对比，暗部脏） */
  opacity:.11;                           /* 终值 0.11；范围 0.10–0.12 */
  z-index:1;
}

/* 让调色雾层压在纸纹之上，避免雾盖在纸上显得发灰 */
.bg-tint{ z-index:2; }
.bg-fog { z-index:3; }
```

## A.3 与既有滤镜的叠加顺序（自下而上）

1. `.bg`（图片本身，含 `saturate(.95) contrast(1.1) brightness(1.04)`，以及 `.stage.ghost/.blood/.dawn/.void` 的心情滤镜）
2. **`.bg-wrap::after` 纸纹（multiply 0.11）** ← 新增
3. `.bg-tint` 上下渐变压暗
4. `.bg-fog` 雾（z-index:3）
5. `.sprites` 立绘（**不受纸纹影响**，这是本方案的关键）
6. `.fx-vignette`(7) / `.fx-grain`(8) / `.fx-scan`(9)

> 注意：`.fx-grain`（10.5% overlay 颗粒）本来就压在立绘之上，属于"胶片层"，与纸纹不冲突；不要再把纸纹也叠到立绘上，否则人物会糊。

## A.4 与心情滤镜的关系

`.stage.blood .bg` / `.stage.void .bg` 只作用于 `.bg` 图片，纸纹层是独立的伪元素，**不会被心情滤镜改色**——这是期望行为：纸的质感应该恒定，只有画面内容随心情变。

## A.5 验收与回退

- 验收：在 `street_day`（亮）与 `corridor_dark`（暗）两张上各看一眼 —— 亮底不应发灰、暗底不应出现规则网格。
- 若亮底发灰：`opacity` 降到 `.08`；若暗底出现网格：`background-size` 改 `640px 640px`（把网点放大，减弱摩尔纹）。
- 若性能报警（低端机）：整段删除即可，`.bg-wrap::after` 是纯装饰层，无布局依赖。
