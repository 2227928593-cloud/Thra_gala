/* =========================================================
   第三幕 · 楼梯与厕所
   第四幕 · 鬼眼
   ========================================================= */
'use strict';

/* =========================================================
   第三幕 · 楼梯
   ========================================================= */
nd('act3', {
  actCard: { id: 'act3', kicker: '第二幕', title: '鬼域', sub: '六月二十一日 · 21:40 · 第七中学 教学楼' },
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你们顺着楼梯往下冲。'),
    narr('一层，两层，三层……'),
    narr('五楼到一楼，本来只需要几十秒。'),
    narr('——但是跑到一半，楼梯里的灯灭了。'),
    { who: '', text: '不是“变暗”，是“消失”。', style: 'whisper', fx: 'ghost' },
    narr('黑暗浓得像水，伸手不见五指。窗外也没有一点光。'),
    narr('有人尖叫，有人摔倒。'),
    say('方镜', '都别停！快走！'),
    narr('你摸黑继续往下。'),
    narr('你有个习惯——走路的时候会数台阶。'),
    narr('一，二，三……'),
    narr('数着数着，你发现不对。'),
    say('杨间', '~我们已经下了不止五层了。~')
  ],
  choices: [
    { text: '停下来，喊住所有人。', next: 'c2', effects: { clues: ['no_basement'], flags: { counted: true } } },
    { text: '不管了，继续往下跑。', next: 'c2run', effects: { stats: { knock: 1 } } }
  ]
});

nd('c2run', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你不敢停。停下来就意味着被落下。'),
    narr('脚下还是台阶。台阶永远是台阶。'),
    narr('你听见前面有人在喊：“到了！到一楼了！”'),
    narr('然后是更前面的人喊：“不对，这里还是楼梯！”'),
    narr('人群挤在拐角处，像一群找不到出口的羊。'),
    say('方镜', '都停下！别走了！'),
    narr('你撞上前面的人，停了下来。'),
    narr('终于有人打开了手机灯。'),
    narr('十几道微弱的光，只照得亮脚下一米。')
  ],
  next: 'c2'
});

nd('c2', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 二楼半',
  scene: 'stairwell', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你们停在三楼和二楼之间的拐角。'),
    narr('你数过了：从灯灭开始，你们又往下走了至少三层。'),
    say('杨间', '灯灭之前，我们刚过三楼。再下一层就该到一楼了。'),
    say('杨间', '可从那之后，我们又走了三层。'),
    say('杨间', '这栋楼没有地下室。'),
    narr('黑暗里安静了几秒。'),
    say('张伟', '……杨间，你能不能别说这么恐怖的话。'),
    narr('有人开始哭。'),
    narr('手机灯照出去一米，前面还是黑的。')
  ],
  observe: [
    { id: 'o_floor', label: '楼层标识', x: 14, y: 44,
      text: '墙上刷着一个褪色的“2”。\n\n你们刚才已经经过这个数字两次了。',
      effects: { clues: ['no_basement'], stats: { sanity: 2 } } },
    { id: 'o_window2', label: '窗', x: 76, y: 30,
      text: '窗户外面没有操场，没有树，没有路灯。\n\n只有黑。',
      effects: { clues: ['ghost_domain'] } },
    { id: 'o_foot', label: '脚印', x: 46, y: 62,
      text: '台阶上的灰里，有一串脚印，往下的。\n\n是一个人的，来回走了很多遍。',
      effects: { stats: { knock: 1 }, clues: ['ghost_slave'] } }
  ],
  choices: [
    { text: '继续往下走。', next: 'c2a', tell: { sub: ['光少了一格'] }, effects: { stats: { knock: 2, survivors: -1 } } },
    { text: '往回走，往上。', next: 'c2up', effects: { stats: { knock: 1 } } },
    { text: '停在这里，让所有人别动。', next: 'c3' }
  ]
});

nd('c2a', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell', rotAfter: '23:20', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('“再走一层试试。”有人说。'),
    narr('于是你们又走了一层。'),
    narr('楼梯没有尽头。'),
    narr('你数到第九层的时候，前面的人忽然停了下来。'),
    say('赵磊', '……你们看。'),
    narr('手机灯照过去。'),
    narr('楼梯拐角站着一个人。'),
    narr('背对着你们，直挺挺的，像一具被立起来的尸体。'),
    narr('是赵强。'),
    narr('他转过头来——'),
    { who: '', text: '身子没有动。脑袋转了一百八十度。', fx: 'shake', sfx: 'scare' },
    narr('一双死灰的眼睛，麻木地看着你们。')
  ],
  observe: [
    { id: 'o_zhao', label: '赵强', x: 50, y: 44,
      text: '他的脖子上有一圈青紫色的痕。\n\n像被一只手，从后面掐住，提起来过。',
      effects: { codex: ['g_hand'], clues: ['ghost_slave'], stats: { sanity: -4 } } }
  ],
  choices: [
    { text: '后退，绕开他，往上走。', next: 'c2up', effects: { clues: ['ghost_slave'] } },
    { text: '再往下走。', next: 'c2b', tell: { sub: ['水声变近了'] }, effects: { stats: { survivors: -1, knock: 2 } } }
  ]
});

nd('c2up', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell_mirror', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('“往上走。”你说。'),
    narr('有人骂你疯了。但这里没人有更好的主意。'),
    narr('你们掉头往上。'),
    narr('一层。两层。三层。'),
    narr('……然后你们停住了。'),
    narr('前面的拐角处，站着一排人。'),
    narr('背对着你们，一动不动。'),
    narr('那是刚才掉下塌陷地板的同学。'),
    narr('他们应该在三楼。'),
    narr('你们却在一路往上走的时候，遇到了他们。')
  ],
  choices: [
    { text: '“别管他们，继续往上！”', next: 'c2c', effects: { stats: { knock: 1 } } },
    { text: '去碰一碰其中一个人。', next: 'c2touch', effects: { stats: { corruption: 8, battery: -10, survivors: -1, sanity: -10 } } }
  ]
});

nd('c2touch', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell_mirror', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你伸出手，碰了碰那个同学的肩。'),
    narr('他的身体像一块冻了很久的肉。'),
    narr('然后，他的脑袋慢慢地转了过来。'),
    narr('你听见自己血液结冰的声音。'),
    { who: '', text: '你猛地缩回手，往后退。', fx: 'shake' },
    narr('他没有追上来。'),
    narr('他只是看着你，嘴角慢慢地咧开。'),
    narr('像在笑。'),
    say('杨间', '~走。快走。~')
  ],
  choices: [
    { text: '退回去，往下走。', next: 'c2c', effects: { stats: { knock: 2 }, flags: { touched_dead: true }, clues: ['ghost_slave'] } }
  ]
});

nd('c2b', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell', rotAfter: '23:20', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你们继续往下。'),
    narr('十一层。十二层。十三层。'),
    narr('楼梯间的墙开始渗水，墙面上长出黑色的霉斑。空气里有股腐烂的甜味。'),
    narr('你忽然意识到一件事：'),
    narr('你们不是在往下走。'),
    narr('你们是在*往下沉*。'),
    { who: '', text: '脚下的台阶，已经不再是台阶了。', fx: 'ghost', sfx: 'whisper' },
    narr('它变成了某种柔软的、有弹性的东西。'),
    narr('像舌头。')
  ],
  choices: [
    { text: '停下。转身。往回跑。', next: 'c2c', effects: { stats: { knock: 2 } } },
    { text: '继续往下。', next: 'ff_c2b', tell: { sub: ['脚下的台阶变软了'] } }
  ]
});

nd('c2d', {
  chapter: '第二幕 · 楼梯', place: '不存在的地方',
  scene: 'stairwell', rotAfter: '23:20', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你听见有人在数数。'),
    narr('“十七……十八……十九……”'),
    narr('是你自己的声音。'),
    narr('你停下来，数数声却没有停。'),
    narr('它在下一层，继续往下数。')
  ],
  enter: { set: { survivors: 0 } },
  choices: [
    { text: '我不数了。数到第几层都一样。', ending: 'e_stairs' }
  ]
});

nd('c2c', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 二楼半',
  scene: 'corridor_2f', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你带着人退回那个拐角。'),
    narr('黑暗里，所有人都在喘气。'),
    narr('然后，你听见了水声。'),
    { who: '', text: '嘀嗒。嘀嗒。', sfx: 'step' },
    narr('像水龙头没关紧。'),
    say('杨间', '~有水声，就说明附近有厕所。~'),
    narr('三楼和二楼之间，有一个厕所。'),
    narr('你朝水声的方向看过去。'),
    narr('厕所的门，开着一条缝。'),
    narr('门后的玻璃窗上，映着一个高大人形的轮廓。')
  ],
  /* 原来这里是 next:'c3'；改成选项，好让"数到放弃"这条线只能被主动走进去（A 表 #8） */
  choices: [
    { text: '（朝那扇开着的门走过去。）', next: 'c3' },
    { text: '（站着不动，等它数完。）', next: 'c2d' },
    /* 幻觉选项：错乱档才出现。它"省一步"，但省掉的正是你唯一能看清厕所的时间。 */
    { text: '门后面有人在叫我的名字。', next: 'c3', when: { maxSanity: 34 },
      sanityHint: '……有人在叫我。', effects: { stats: { knock: 3, sanity: -6 }, flags: { heard_name: true } } }
  ]
});

nd('c3', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 二楼半',
  scene: 'corridor_2f', rotAfter: '23:35', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    say('张伟', '谁，谁在里面？'),
    narr('没人回答。'),
    { who: '', text: '嘎——', sfx: 'door' },
    narr('门被从里面推开。'),
    narr('一只惨白的手臂伸了出来，搭在门框上。'),
    say('方镜', '不是人。这是另外一只鬼。'),
    narr('所有人都在后退。'),
    narr('你也想退。'),
    narr('可就在这时，你的后领被人一把揪住。'),
    { who: '', text: '是方镜。', fx: 'shake', sfx: 'scare' },
    say('方镜', '既然你什么都不知道，那就给我去死吧。'),
    narr('他用尽全力，把你往那扇门里推。'),
    narr('你的脚在地面上擦出两道痕。'),
    narr('那只惨白的手，已经朝你伸了过来。')
  ],
  choices: [
    { text: '抓住方镜的衣领，把他一起拖进来。', next: 'c4a', tell: { sub: ['纸'] }, effects: { stats: { corruption: 3, sanity: -5 }, flags: { grabbed_fangjing: true }, clues: ['fangjing_future'] } },
    { text: '抓住段鹏和郑飞的手。', next: 'c4b', effects: { flags: { dragged_others: true } } },
    { text: '松开手，抱住头。', next: 'c4c' }
  ]
});

nd('c4a', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你反手抓住方镜的衣领。'),
    narr('他没想到你还有这一手，脸色变了。'),
    say('方镜', '放手！'),
    narr('你死死抓着。指甲划破了他的手臂。'),
    narr('他猛地一挣，衣服撕开一道口子。'),
    narr('你被甩开，撞进那扇门里。'),
    narr('最后一眼，你看见他退开，脸上有一个很奇怪的表情。'),
    narr('不是得意。'),
    narr('是害怕。'),
    { who: '', text: '门在你身后关上。', fx: 'shake', sfx: 'door' }
  ],
  next: 'd1'
});

nd('c4b', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你抓住最近的两只手。'),
    narr('段鹏，郑飞。'),
    say('段鹏', '你干什么！放开我！'),
    say('杨间', '要死一起死。'),
    narr('那只惨白的手掐住你的肩膀。'),
    narr('冰冷的、僵直的力量，把你往后拖。'),
    narr('你抓着他们，他们抓着你。'),
    narr('三个人一起被拖进了黑暗里。'),
    { who: '', text: '门砰地关上。', fx: 'shake', sfx: 'door' }
  ],
  next: 'd1'
});

nd('c4c', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你松开手，抱住头。'),
    narr('那只手掐住你的肩膀，把你拖了进去。'),
    narr('你没有抓任何人。'),
    narr('身后传来方镜的声音：“关门！”'),
    narr('然后门就关上了。'),
    { who: '', text: '黑暗。', fx: 'ghost', sfx: 'door' }
  ],
  next: 'd1'
});

/* =========================================================
   第四幕 · 厕所
   ========================================================= */
nd('d1', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('冰冷，黑暗，还有嘀嗒、嘀嗒的滴水声。'),
    narr('你被扔在地上。'),
    narr('肩膀已经没有知觉了。'),
    narr('那种冷从肩膀漫上来，一寸一寸，像有人在你身体里灌冰水。'),
    narr('你挣扎着坐起来，摸到了墙。'),
    narr('冰冷的瓷砖，斑斑驳驳，有些坑洼，散发着一股腐烂的味道。'),
    narr('你顺着墙摸。'),
    narr('左边是墙。右边也是墙。'),
    narr('门不见了。'),
    narr('这间厕所有多大？'),
    narr('——你摸了很久，都没有摸到头。')
  ],
  observe: [
    { id: 'o_door', label: '门的位置', x: 20, y: 46,
      text: '你记得门在那边。\n\n你摸过去，只有一面墙。\n\n墙上有一道很浅的凹痕，像被人用指甲抠过。',
      effects: { clues: ['ghost_domain'] } },
    { id: 'o_sink', label: '水龙头', x: 17, y: 60,
      text: '嘀嗒。嘀嗒。\n\n水一直在滴。\n\n在这片什么都不对的地方，它是唯一一个“位置不变”的东西。',
      effects: { clues: ['drip'], stats: { sanity: 4 } } }
  ],
  choices: [
    { text: '摸黑找门。', next: 'd2', effects: { stats: { knock: 1 } } },
    { text: '顺着水声走。', next: 'd2', effects: { clues: ['drip'] } },
    { text: '打开手机灯。', next: 'd2', when: { minBattery: 1 }, lockedHint: '手机已经没电了', effects: { stats: { battery: -20 }, flags: { used_light: true } } },
    /* 周目专属：你知道这面墙上没有门 */
    { text: '别摸了。门不在这里——它在等你开门。', next: 'd2', when: { clue: 'no_basement' }, lockedHint: '这栋楼到底几层，我还没数清', effects: { flags: { knew_the_wall: true }, stats: { sanity: 4 } } }
  ]
});

nd('d2', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', rotAfter: '23:45', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  enter: { clues: ['battery'] },
  lines: [
    { who: '', text: '一只手，搭上了你的肩膀。', fx: 'shake', sfx: 'scare' },
    narr('冰冷。僵硬。'),
    narr('你猛地回头，什么都没有。'),
    narr('可那只手还在。'),
    narr('手指收紧，你的骨头发出轻微的响声。'),
    narr('半边身子已经麻了。'),
    narr('你摸出手机。'),
    narr('屏幕亮起，电量：*7%*。'),
    narr('屏幕上显示的不是桌面。'),
    narr('是那个论坛帖子。'),
    narr('最后一页。'),
    narr('音频文件，就在那里。')
  ],
  choices: [
    { text: '点开那段敲门声。', next: 'd3audio', when: { item: 'audio', minBattery: 1 }, lockedHint: '手机里没有那段录音——或者它已经没电了', effects: { stats: { knock: 3, sanity: -10 }, items: { audio: -1 }, clues: ['audio_trap', 'knock_rhythm'], fx: 'ghost' } },
    { text: '用力挣扎。', next: 'd3struggle' }
  ]
});

nd('d3audio', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', rotAfter: '23:45', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('“咚——咚咚。”'),
    narr('敲门声在黑暗里响起来。'),
    narr('你听见自己的心跳几乎停了。'),
    narr('然后——'),
    narr('那只抓着你的手，像被烫了一下，迅速缩了回去。'),
    narr('冰冷和麻木从身体里退开。'),
    narr('你瘫坐在地上，大口喘气。'),
    say('杨间', '~……它对敲门声有反应。~'),
    narr('你忽然明白了一件事。'),
    narr('周正说过：能对付鬼的，只有鬼。'),
    narr('那只手不是怕你的手机。'),
    narr('它是怕——*另一个更可怕的东西*。')
  ],
  next: 'd4'
});

nd('d3struggle', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', rotAfter: '23:45', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你用尽全身力气挣扎。'),
    narr('没有用。'),
    narr('那力量纹丝不动，像被铁钉钉住了一样。'),
    narr('手机从手里滑出去，屏幕亮着，照着天花板。'),
    narr('你看见了。'),
    narr('天花板上有手印。'),
    narr('密密麻麻，一层叠着一层，全是手印。'),
    narr('有人在这里挣扎过。'),
    narr('很多人。'),
    narr('你的意识开始模糊。'),
    narr('那只手拖着你，往黑暗深处退。'),
    narr('屏幕上还亮着那个帖子。'),
    narr('音频文件就在那里。'),
    narr('你伸出另一只手，指尖停在播放键上。'),
    say('杨间', '~……不。~'),
    narr('你没有点。'),
    narr('不是因为不怕死。'),
    narr('是因为你忽然想明白了一件事——'),
    narr('听见它，就是答应它。'),
    { who: '', text: '那只手猛地停住了。', fx: 'shake' },
    narr('像是被什么东西烫到，五指一根根松开。'),
    narr('你摔在地上，咳出一口血。'),
    narr('黑暗深处，有什么比那只手更可怕的东西，正安静地待着。'),
    narr('它没有过来。'),
    narr('它只是把那只手，吓退了。')
  ],
  next: 'd4'
});

nd('d4', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'void_dark', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你扶着墙站起来。'),
    narr('嘀嗒，嘀嗒。'),
    narr('水声还在。你顺着水声走。'),
    narr('可是走着走着，你发现这不是厕所了。'),
    narr('墙没有了尽头。地面没有了边界。'),
    narr('你走了二十分钟，没有碰到一个马桶，没有碰到一扇门。'),
    narr('你看了看手机。'),
    narr('电量：5%。'),
    narr('屏幕上弹出一行字：*为防止手机自动关机，请及时充电。*'),
    say('杨间', '~……该死的。~'),
    narr('你把屏幕按灭，想省点电。'),
    narr('黑暗里，你听见了脚步声。'),
    { who: '', text: '踏。踏。', sfx: 'step' },
    narr('从你身后传来。')
  ],
  choices: [
    { text: '加快脚步，往前跑。', next: 'd5', effects: { stats: { knock: 1 } } },
    /* 有 knock_rule 才知道"静下来装空屋子"是对的；没有就只是站在那儿挨一下 */
    { text: '屏住呼吸，一动不动。', next: 'd5', when: { clue: 'knock_rule', minSanity: 40 }, sanityHint: '我连自己的呼吸都数不清了',
      lockedHint: '我还不知道怎么让他以为这间屋子是空的',
      effects: { stats: { knock: -2, clock: 10, sanity: 8 }, flags: { held_breath: true } } },
    { text: '靠墙站住，来不及想。', next: 'ff_d4stop', tell: { sub: ['敲门慢了一拍'] } },
    { text: '不动了。就这样。', next: 'd4stop', when: { minCorruption: 60 }, lockedHint: '我还想再走两步' },
    { text: '回头看。', next: 'd4look', effects: { stats: { knock: 1 } } }
  ]
});

nd('d4look', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你打开手机灯，回头。'),
    narr('灯光只照得亮一米。'),
    narr('后面什么都没有。'),
    narr('但脚步声没有停。'),
    { who: '', text: '踏。踏。', sfx: 'step' },
    narr('而且更近了。'),
    narr('你把手机举在身前，一步一步往后退。'),
    narr('退着退着，脚后跟撞到了什么。'),
    narr('你低头。'),
    narr('一个人躺在地上。'),
    narr('睁着眼睛，张着嘴。'),
    narr('是段鹏。')
  ],
  next: 'd5'
});

nd('d4stop', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你靠住墙，屏住呼吸。'),
    narr('脚步声停了。'),
    narr('就停在你身后。'),
    narr('你不敢回头。'),
    narr('你能感觉到一股阴冷的寒气，贴着你的后颈。'),
    narr('然后，一只冰冷的手，落在了你的后脑上。'),
    narr('很轻。像在安抚。'),
    { who: '', text: '你的意识断了一瞬。', fx: 'flash', sfx: 'scare' },
    narr('再睁开眼的时候，你站在一片黑暗的正中央。'),
    narr('身边什么都没有了。'),
    narr('连滴水声都没有。'),
    narr('你张了张嘴，发现自己发不出声音。')
  ],
  choices: [
    { text: '不动了。就这样。', ending: 'e_door' }
  ]
});

nd('d5', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'void_dark', rotAfter: '00:00', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('你往前跑。'),
    narr('脚步声紧紧跟着，始终在你身后一米。'),
    narr('不快，也不慢。'),
    narr('你加快，它也加快。你放慢，它也放慢。'),
    narr('它像是在等什么。'),
    { who: '', text: '手机屏幕自动亮了起来。', fx: 'flash' },
    narr('电量：*1%*。'),
    narr('“正在自动关机。”'),
    narr('屏幕熄灭的同一刻，身后那股阴寒猛地贴了上来。'),
    narr('一只手掠过你的耳旁，掐向你的脖子。'),
    narr('冰冷的手指，已经碰到了皮肤。'),
    narr('然后——'),
    narr('黑暗的尽头，出现了一点红光。')
  ],
  choices: [
    { text: '朝那点红光跑。', next: 'd6', effects: { stats: { knock: 1, sanity: -8 } } },
    { text: '我不跑了。我要看清他是什么。', ending: 'e_door' }
  ]
});

nd('d6', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'void_dark', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  lines: [
    narr('红光越来越近。'),
    narr('身后的脚步声忽然停了。'),
    narr('那只手僵在你的脖子上，没有掐下去。'),
    narr('它退了。'),
    narr('你拼命跑，跑到红光前面，才停下来。'),
    narr('——那是什么？'),
    narr('灯泡？玻璃珠？'),
    narr('你伸出手，摸了一下。'),
    { who: '', text: '剧烈的刺痛。', fx: 'shake', sfx: 'scare' },
    narr('你猛地缩回手。'),
    narr('可是它已经黏在了你的手背上。'),
    narr('一颗红色的珠子，在你手背的皮肤下面蠕动。'),
    narr('然后钻开一道口子，没入了皮肉里。'),
    { who: '', text: '疼痛像抽筋扒皮，像碾碎灵魂。', style: 'blood', fx: 'flash', sfx: 'rise' },
    narr('你倒在地上，浑身抽搐。'),
    narr('不知道过了多久。'),
    narr('疼痛退去的时候，你发现——'),
    narr('黑暗退了。'),
    narr('周围的一切，都能看见了。')
  ],
  choices: [
    { text: '站起来，看清这里。', next: 'd7', effects: { stats: { eyes: 1, corruption: 8, sanity: -6 }, flags: { has_eye: true }, clues: ['eye_rule'], codex: ['g_guiyan'] } }
  ]
});

nd('d7', {
  chapter: '第三幕 · 眼睛', place: '白骨树下 · 无名之地',
  scene: 'bone_tree', rotAfter: '00:10', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('眼前是一棵树。'),
    narr('一棵苍白的、像骨头长成的树。'),
    narr('树上挂着破烂的人皮，脏臭的布条，还有干尸的脑袋。'),
    narr('树枝上系着几张纸幡，没有风，却在轻轻地动。'),
    narr('树干上，躺着一个东西。'),
    narr('一个人形。四米高。'),
    narr('由黑暗凝聚而成，没有五官，脸的位置是一个凹口。'),
    narr('它倒挂在树上，脑袋朝下。胸口钉着一根成人手臂粗细的棺材钉。'),
    narr('锈迹斑斑，仿佛一碰就会断。'),
    { who: '', text: '嘀嗒。嘀嗒。', sfx: 'step' },
    narr('钉子下面，正在滴出黑色的血。'),
    narr('——原来你一路听见的滴水声，是这个。'),
    narr('你看了看手背。'),
    narr('皮肉裂开，一颗红色的眼珠，正在转动。'),
    narr('而你的脑海里，多出了一个视角。')
  ],
  observe: [
    { id: 't_tree', label: '白骨树', x: 48, y: 32,
      text: '树皮是灰白色的，摸上去像磨过的骨头。\n\n树根下面，埋着很多东西。\n\n你没有细看。',
      effects: { clues: ['ghost_domain'], codex: ['g_shadow'] } },
    { id: 't_nail', label: '棺材钉', x: 43, y: 52,
      text: '钉子上缠着几缕头发。\n\n头发是黑色的，很长，很新。\n\n钉它的人，好像并不久远。',
      effects: { stats: { corruption: 4 }, clues: ['eye_rule'] } },
    { id: 't_skins', label: '人皮', x: 30, y: 26,
      text: '人皮上还留着一些花纹。\n\n你看清了：是字。\n\n有人把字写在了自己身上，然后被挂在了这里。',
      effects: { clues: ['paper_rule'], codex: ['g_shadow'], stats: { sanity: -4 } } },
    { id: 't_eye', label: '手背上的眼', x: 82, y: 60,
      text: '它眨了一下。\n\n你的脑袋里，同时闪过两个画面：一个是你眼前的树，另一个——是你自己的后脑勺。',
      effects: { clues: ['eye_rule'] } }
  ],
  choices: [
    { text: '立刻离开这里。', next: 'd8', effects: { flags: { left_tree: true } } },
    { text: '走近那个四米高的黑影。', next: 'd7a', tell: { sub: ['骨头里有声音'] } },
    { text: '伸手，摸一摸树干。', next: 'd7b', tell: { sub: ['树皮底下在跳'] } }
  ]
});

nd('d7a', {
  chapter: '第三幕 · 眼睛', place: '白骨树下 · 无名之地',
  scene: 'bone_tree', rotAfter: '00:10', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('你朝那棵树走过去。'),
    narr('一步。两步。'),
    narr('走到第三步的时候，那个倒挂着的黑影，动了。'),
    { who: '', text: '不是身体动。是那个凹口——脸的凹口——转向了你。', fx: 'shake', sfx: 'scare' },
    narr('你腿一软，跪在了地上。'),
    narr('手背上的眼睛剧痛，像被人用针从里面挑了一下。'),
    narr('你听见了一个声音。'),
    narr('不是从耳朵里进来的。是从骨头里。'),
    { who: '', text: '“……帮我……把钉子……”', style: 'whisper', fx: 'flash' },
    narr('你连滚带爬地后退。'),
    narr('一直退到看不见那棵树。')
  ],
  choices: [
    { text: '回头，找那扇门。', next: 'd8', effects: { stats: { corruption: 12, sanity: -10 }, flags: { heard_shadow: true }, codex: ['g_shadow'] } }
  ]
});

nd('d7b', {
  chapter: '第三幕 · 眼睛', place: '白骨树下 · 无名之地',
  scene: 'bone_tree', rotAfter: '00:10', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('你伸手，按在树干上。'),
    narr('树皮很凉。'),
    narr('——然后，树皮下面有什么东西，回应了你。'),
    narr('一下，一下。'),
    narr('心跳。'),
    narr('这棵树在跳。'),
    narr('你猛地抽回手。'),
    narr('树皮上留下了一个手掌大的印子，印子里面，有一颗眼珠在看你。'),
    narr('你转身就跑。'),
    narr('跑了很久，才想起来回头。'),
    narr('那棵树已经不在了。'),
    narr('但它看你的那只眼睛，好像还在。')
  ],
  choices: [
    { text: '……找门。', next: 'd8', effects: { stats: { corruption: 16, sanity: -12 }, clues: ['eye_rule'], codex: ['g_shadow'] } }
  ]
});

nd('d8', {
  chapter: '第三幕 · 眼睛', place: '第七中学 · 五楼 · 走廊',
  scene: 'corridor_dark', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 90 }],
  lines: [
    narr('你回头。'),
    narr('那扇门就在你身后。'),
    narr('——厕所的门。'),
    narr('原来它一直离你这么近。'),
    narr('你推开门，走了进去。'),
    narr('门后是走廊。'),
    narr('熟悉的走廊。'),
    narr('你逃出来的那间教室，就在旁边。'),
    narr('你回到了五楼。'),
    say('杨间', '~……~'),
    narr('你低头看自己的手背。'),
    narr('皮肉已经愈合了一半，只剩一道细红线。'),
    narr('红线下面，有什么东西，正在眨。')
  ],
  next: 'act4'
});

/* =========================================================
   Fail-forward 分支（A 表 #5 / #7）
   ---------------------------------------------------------
   原来 c2a→c2b→c2d、c2b→c2d 是一条"一步踩空就进结局"的链。
   现在踩空的下一脚会受伤、掉资源、少一个人，但人还活着，退回 c2c 继续。
   c2d（e_stairs）只剩 c2c 的主动入口。
   ========================================================= */
nd('ff_c2b', {
  chapter: '第二幕 · 楼梯', place: '第七中学 · 教学楼 · 楼梯间',
  scene: 'stairwell', rotAfter: '23:20', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  enter: { stats: { battery: -10, corruption: 10 }, flags: { ankle_hurt: true } },
  lines: [
    narr('水没过了脚踝。'),
    narr('不是水。比水稠，比水凉。'),
    narr('手机在我手里啪地响了一声，屏幕暗下去半格。'),
    narr('我低头看脚——脚踝上缠着一圈东西，像头发，也像手指。'),
    narr('我踹了两下才挣开。'),
    narr('再抬头的时候，楼梯又变回了楼梯。'),
    narr('只是我走不快了。')
  ],
  next: 'c2c'
});

/* A 表 #10：没有 knock_rule 时的"屏息"不再是即死，而是被抓伤 */
nd('ff_d4stop', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 教学楼 · 厕所',
  scene: 'toilet', rotAfter: '23:45', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  enter: { stats: { corruption: 15, battery: -10, survivors: -2 }, flags: { touched_neck: true } },
  lines: [
    narr('我靠住墙，把呼吸压到最低。'),
    narr('脚步声停了。'),
    narr('就停在我身后。'),
    narr('我感觉到一股寒气贴着后颈爬上来——不是风。'),
    { who: '', text: '一只手落在我的后脑上。', fx: 'shake', sfx: 'scare' },
    narr('很轻。像在安抚。'),
    narr('然后那五根手指收紧了。'),
    narr('我听见有人在我身后叹气，很不耐烦，像一个找不到东西的人。'),
    narr('它放开我，走了。'),
    narr('黑暗里有人替我叫了一声。叫到一半断了。'),
    narr('我摸了一下后颈，摸到五个凹进去的坑。')
  ],
  next: 'd5'
});
