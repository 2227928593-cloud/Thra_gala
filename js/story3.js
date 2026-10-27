/* =========================================================
   第五幕 · 鬼婴
   第六幕 · 操场与校门
   第七幕 · 步行街（结局）
   ========================================================= */
'use strict';

/* =========================================================
   第五幕 · 鬼婴
   ========================================================= */
nd('act4', {
  actCard: { id: 'act4', kicker: '第三幕', title: '鬼婴', sub: '六月二十二日 · 00:20 · 教学楼 五楼' },
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 五楼 · 走廊',
  scene: 'corridor_dark', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'zhouzheng', art: 'zhouzheng_dying', pos: 'right', scale: 88 }],
  lines: [
    narr('走廊上有人。'),
    narr('靠着墙，坐着。'),
    narr('灰色风衣，消瘦得只剩骨头。'),
    narr('是周正。'),
    say('周正', '咳……咳咳。'),
    narr('他抬起头，布满血丝的眼睛警惕地看着你。'),
    say('周正', '是你。你怎么会从教室里走出来。'),
    say('杨间', '我被一只鬼抓进了厕所。找到路出来，推开门就到了这里。'),
    say('周正', '鬼域的原因。那东西不想放你们走。'),
    say('周正', '不过一个鬼域，只会有一只厉鬼。那个黑衫老人已经离开了。你遇到的，是鬼奴。'),
    say('杨间', '鬼奴是什么？'),
    say('周正', '在鬼域里被厉鬼杀死的人，死后会变成受它驱使的东西。'),
    say('周正', '没有厉鬼那么恐怖，但对付你们这些普通人，足够了。')
  ],
  observe: [
    { id: 'z_belly', label: '他的肚子', x: 50, y: 62,
      text: '风衣下面，肚皮鼓得几乎透明。\n\n里面有个东西在动。\n\n很小，像蜷缩着的婴儿。',
      effects: { codex: ['g_guiying'], clues: ['ghost_slave'], stats: { sanity: -3 } } },
    { id: 'z_hand', label: '他的手', x: 45, y: 56,
      text: '手指在抖，指甲泛着不正常的灰青色。\n\n那不是活人的颜色。',
      effects: { clues: ['only_ghost'] } }
  ],
  choices: [
    { text: '“周先生，你还好么？”', next: 'e1' },
    { text: '先看看他手里拿着什么。', next: 'e1', effects: { clues: ['find_rule'] } }
  ]
});

nd('e1', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 五楼 · 走廊',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'zhouzheng', art: 'zhouzheng_dying', pos: 'right', scale: 90 }],
  lines: [
    narr('周正从怀里拿出一个东西，丢了过来。'),
    narr('一个类似对讲机的东西，黑色的，上面有一个小小的屏幕。'),
    say('周正', '国际刑警标配的卫星定位手机。拿着，赶紧走。'),
    say('周正', '你要是能走出这鬼地方，事后会有人联系你。你如实把这里的情况告诉接头的人。'),
    say('杨间', '那你呢？'),
    say('周正', '我的极限已经到了。刚才拖住那个老人的时候，用多了厉鬼的力量。'),
    say('周正', '那玩意马上就要复苏了。'),
    say('杨间', '复苏？'),
    say('周正', '能驾驭厉鬼之力的人，叫驭鬼者。可鬼也会逐渐驾驭人。'),
    say('周正', '像我这种不人不鬼的存在，活着本来就是一种折磨。'),
    { who: '', text: '他忽然惨叫起来，倒在地上抽搐。', fx: 'shake', sfx: 'scare' },
    narr('风衣敞开。'),
    narr('肚皮高高鼓起，比怀孕的女人还大。几乎是透明的。'),
    narr('里面蜷着一个四五岁孩子大小的婴儿。'),
    narr('青黑色。手掌长着锋利的指甲。一双眼睛漆黑如墨，没有瞳孔。'),
    narr('它在里面蠕动，撕扯，想撕开肚皮出来。'),
    say('周正', '鬼婴。档案上是这样命名的。'),
    say('周正', '一开始它只有拇指大小。我用一次厉鬼的力量，它就长一分。就算不用，它也会长。'),
    say('周正', '我肚子里的肠子、内脏，都被它吃干净了。每天夜里，我都会被它啃食内脏的痛，痛醒。'),
    say('周正', '现在我的肚子里只剩下一个空空的肚皮。换别人早就死了。可我死不掉。'),
    say('周正', '……死，反而是解脱。')
  ],
  choices: [
    { text: '接过电话。“我记住了。”', next: 'e2', effects: { items: { phone: 1 }, clues: ['only_ghost', 'ghost_slave'], codex: ['p_zhouzheng', 'g_guiying'], flags: { zhou_talked: true } } },
    { text: '“有什么办法能活下去？”', next: 'e1b' }
  ]
});

nd('e1b', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 五楼 · 走廊',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'zhouzheng', art: 'zhouzheng_dying', pos: 'right', scale: 90 }],
  lines: [
    say('周正', '活下去？'),
    narr('他笑了一下，嘴角有血流出来。'),
    say('周正', '你知道自己现在是什么东西么？'),
    say('周正', '你身体里也有一只鬼。它让你看得见黑暗里的东西，也正在一点一点，把你吃掉。'),
    say('周正', '到了最后，你不是在用它。是它在用你。'),
    say('杨间', '……'),
    say('周正', '所以，哪有什么活下去的办法。只有活得久一点的办法。'),
    say('周正', '少用它的力量。每一次，都在给它喂食。'),
    say('周正', '还有——记住，你已经不是普通人了。你已经死了。从被那只鬼碰到的第一刻起，你就已经死了。'),
    say('周正', '现在活着的，只是它借给你的一点时间。')
  ],
  choices: [
    { text: '接过电话。', next: 'e2', effects: { items: { phone: 1 }, clues: ['only_ghost', 'ghost_slave'], codex: ['p_zhouzheng', 'g_guiying'], flags: { zhou_talked: true, knows_dead: true } } }
  ]
});

nd('e2', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 五楼 · 走廊',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'zhouzheng', art: 'zhouzheng_dying', pos: 'right', scale: 90 }],
  lines: [
    narr('你把电话握在手里，站起来。'),
    say('周正', '对了。小心你班上那个叫方镜的学生。'),
    say('周正', '之前我遇到他了。他有很大的古怪，不太像是人。'),
    say('周正', '有关他的事，我已经上报了。今后会有人调查。别相信他说的什么未来之类鬼话。'),
    say('周正', '研究所做过这种实验。没有人可以从未来回到现在。'),
    narr('你想问什么，可他已经没有力气了。'),
    say('周正', '走。'),
    say('周正', '快走。'),
    { who: '', text: '撕拉——', fx: 'shake', sfx: 'scare' },
    narr('肚皮被撕开了。'),
    narr('一只青黑色的婴儿手臂伸了出来。'),
    narr('然后是一颗脑袋。'),
    narr('它像一个刚出生的孩子一样，好奇地东张西望。'),
    narr('只是那双漆黑的眸子里，透出来的是一种诡异和邪性。'),
    { who: '', text: '“哇嘎嘎——”', sfx: 'scare', fx: 'flash' },
    narr('你转身就跑。'),
    narr('身后，周正的脸慢慢失去了神采。'),
    say('周正', '爸……妈……对，对不起。')
  ],
  choices: [
    { text: '往下跑。', next: 'e3' }
  ]
});

nd('e3', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 四楼 · 楼梯口',
  scene: 'stairwell', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('楼梯里已经没有黑暗了。'),
    narr('很昏暗，但看得清。'),
    narr('你一路往下。四楼，三楼……'),
    narr('没有迷路。'),
    narr('你忽然明白过来：不是鬼域消失了。'),
    narr('是你能看破它了。'),
    narr('——手背上的那只眼睛。'),
    say('杨间', '~这也是一只鬼。~'),
    narr('那你现在，是什么？'),
    narr('二楼。'),
    narr('楼梯口站着几个同学，背对着你，一动不动。'),
    narr('是之前跟着方镜走的那几个。'),
    say('杨间', '赵强？'),
    narr('赵强转过身来。')
  ],
  next: 'e4'
});

nd('e4', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 二楼 · 走廊',
  scene: 'corridor_2f', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  enter: { codex: ['m_english'] },
  lines: [
    narr('他的身体没有动。'),
    narr('脑袋转了一百八十度。'),
    narr('一双死灰的眼睛，麻木地看着你。'),
    narr('然后，又缓缓转了回去。'),
    narr('像什么都没发生。'),
    say('杨间', '~死人。~'),
    narr('你绕开他们，继续走。'),
    narr('走廊尽头，有几个手机灯在晃。'),
    say('张伟', '谁！谁在前面！'),
    say('杨间', '别紧张，是我，杨间。'),
    say('张伟', '站住！你别过来！你说你是杨间，你能证明么？万一你是鬼变的呢？'),
    narr('你差点被气笑。'),
    say('杨间', '张伟，这都什么时候了，你就不能少啰嗦两句？'),
    say('张伟', '不行！我的英文名叫什么？只能回答一次，答错了你就不是人！'),
    narr('黑暗里安静了一秒。'),
    say('杨间', '……沃德吉尔·英邦邦。'),
    narr('张伟长出一口气。'),
    say('张伟', '看来真的是你。吓我一跳，还好我学会了对暗号。')
  ],
  choices: [
    { text: '“行了。跟我走，别走散。”', next: 'e5' },
    { text: '“你的英文名真难听。”', next: 'e5', effects: { flags: { joked: true } } }
  ]
});

nd('e5', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 二楼 · 走廊',
  scene: 'corridor_dark', rotAfter: '00:30', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'zhangwei', pos: 'center', scale: 88 }, { id: 'wangshanshan', pos: 'right', scale: 88 }],
  lines: [
    narr('张伟、苗小善、王珊珊、赵磊……还有几个同学。'),
    narr('人不多。'),
    narr('有人抓住你的手，手心全是汗。'),
    say('张伟', '杨间，你手上怎么这么多汗？'),
    say('杨间', '……那是你的手。'),
    say('张伟', '汗？我手上怎么会是汗，这分明是尿好不好。童子尿，驱邪用的，还热乎着呢。'),
    say('杨间', '滚。'),
    { who: '', text: '“哇嘎嘎——”', sfx: 'scare', fx: 'shake' },
    narr('所有人都僵住了。'),
    narr('声音从楼梯间传来。'),
    narr('由远及近。'),
    say('杨间', '走。那东西追过来了。'),
    narr('你们冲向一楼。'),
    narr('就在这时，一个青黑色的东西顺着墙壁爬了下来。'),
    narr('像一只蜘蛛。'),
    narr('它的速度快得不正常。'),
    narr('它从你头顶掠过，扑向了——'),
    { who: '', text: '王珊珊。', fx: 'flash', sfx: 'scare' }
  ],
  next: 'e6'
});

nd('e6', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 一楼 · 楼梯口',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'wangshanshan', pos: 'right', scale: 90 }],
  enter: { codex: ['p_wangshanshan'] },
  lines: [
    narr('两条细长的手臂，从后面抱住了王珊珊的脖子。'),
    narr('像一条围巾，也像一条绞索。'),
    narr('她睁大眼睛，说不出话。'),
    narr('她的手朝你伸过来。'),
    say('王珊珊', '咯……救……救救我……'),
    narr('她的脸憋得发红，眼睛开始翻白。'),
    narr('鬼婴的皮肤接触到她的地方，正在慢慢黏在一起。'),
    narr('所有人都在后退。'),
    narr('苗小善尖叫，张伟去拉，被鬼婴一眼瞪得僵在原地。'),
    narr('你只剩下几秒钟。'),
    say('杨间', '~如果我现在走，我和方镜，有什么区别？~')
  ],
  choices: [
    { text: '冲过去，一拳砸在鬼婴脸上。', next: 'e7', tell: { sub: ['有人替你挡了一下'] },
      effects: { flags: { saved_wang: true }, stats: { survivors: -1 }, clues: ['guiying_mark'] } },
    { text: '“张伟！拉她！我来引开它！”', next: 'e7b', when: { flag: 'zhangwei_ok' }, lockedHint: '张伟已经吓傻了，你叫不动他' },
    { text: '转身，跑。', next: 'e7r', tell: { sub: ['她伸出了手'] }, effects: { flags: { left_wang: true }, stats: { sanity: -8 } } }
  ]
});

nd('e7', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 一楼 · 楼梯口',
  scene: 'corridor_dark', rotAfter: '00:30', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'guiying', pos: 'center', scale: 60 }],
  lines: [
    narr('你冲了过去。'),
    narr('一拳砸在那颗青黑色的脑袋上。'),
    narr('鬼婴的脑袋瘪下去一块，却没有受伤。'),
    narr('它慢慢地转过头，漆黑的眼睛看着你。'),
    { who: '', text: '“哇嘎嘎——”', fx: 'shake', sfx: 'scare' },
    narr('它松开王珊珊，扑向你。'),
    narr('那张嘴裂开，超过人的极限，一口吞下了你半截手臂。'),
    narr('冰冷，粘稠，像被吸进一个黑洞。'),
    narr('你整个人都在往那张嘴里滑。'),
    say('杨间', '~要被吃了。~'),
    narr('然后——'),
    { who: '', text: '手臂上传来一阵刺痛。像皮肉被硬生生撕开。', style: 'blood', fx: 'flash', sfx: 'rise' },
    narr('鬼婴惨叫一声，把你的手臂吐了出来。'),
    narr('它掉在地上，往后爬，很快消失在楼梯上。'),
    narr('你跪在地上，痛得浑身抽搐。'),
    narr('被吞下的那半截手臂上，皮肤正在裂开。'),
    narr('一颗、两颗、三颗、四颗红色的眼珠，从伤口里冒出来。')
  ],
  choices: [
    { text: '咬紧牙，撑过去。', next: 'e8', effects: { stats: { eyes: 4, corruption: 18, sanity: -15 }, clues: ['eye_rule', 'guiying_mark'], codex: ['g_guiyan', 'g_guiying'] } }
  ]
});

nd('e7b', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 一楼 · 楼梯口',
  scene: 'corridor_dark', rotAfter: '00:30', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'guiying', pos: 'center', scale: 60 }],
  lines: [
    narr('“张伟！拉她！”'),
    say('张伟', '我我我我我……'),
    narr('他还在抖，却真的冲了上去。'),
    narr('他抓住王珊珊的手臂，用尽全身力气往后拖。'),
    narr('鬼婴被扯得歪了一下。'),
    narr('就这一下，你冲到了。'),
    narr('一拳。'),
    { who: '', text: '“哇嘎嘎——”', fx: 'shake', sfx: 'scare' },
    narr('鬼婴松开王珊珊，扑向你，一口吞下你的手臂。'),
    narr('疼痛。'),
    narr('然后是眼睛。'),
    narr('一颗、两颗、三颗、四颗。'),
    narr('鬼婴被逼退，逃进了黑暗。')
  ],
  choices: [
    { text: '撑住。', next: 'e8', effects: { stats: { eyes: 4, corruption: 18, sanity: -15 }, flags: { saved_wang: true, zhangwei_brave: true }, clues: ['eye_rule', 'guiying_mark'], codex: ['g_guiyan', 'g_guiying'] } }
  ]
});

nd('e7r', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 一楼 · 楼梯口',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }],
  lines: [
    narr('你转身跑了。'),
    narr('身后传来王珊珊最后一声呼喊。'),
    narr('很短。'),
    narr('然后就没有声音了。'),
    narr('你一直跑到教学楼门口才停下。'),
    narr('夜风灌进肺里，你扶着膝盖，剧烈地喘。'),
    narr('张伟追了上来，站在你旁边，一句话都没说。'),
    narr('过了很久，他才开口。'),
    say('张伟', '……杨间。'),
    say('张伟', '你刚才，为什么不救她？'),
    narr('你张了张嘴。'),
    narr('没有发出声音。'),
    narr('你手背上的那只眼睛，冷冷地看着这一切。')
  ],
  choices: [
    { text: '“我救不了。”', next: 'e8r', effects: { stats: { corruption: 6 } } },
    { text: '“因为我不想死。”', next: 'e8r', effects: { flags: { honest_cold: true }, stats: { corruption: 6 } } }
  ]
});

nd('e8', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 一楼 · 楼梯口',
  scene: 'corridor_dark', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'wangshanshan', art: 'wangshanshan_marked', pos: 'right', scale: 90 }],
  lines: [
    narr('疼痛慢慢退了。'),
    narr('你低头看自己的手臂。'),
    narr('五只红色的眼睛，整整齐齐地排在皮肉下面，然后一只一只，闭上了。'),
    narr('王珊珊瘫坐在地上，捂着脖子。'),
    narr('她后颈上，有一个青黑色的手掌印。'),
    narr('像刺青。'),
    narr('而且那颜色，正在往周围蔓延。'),
    say('王珊珊', '杨间……'),
    narr('她抬头看你，眼睛红得厉害。'),
    say('王珊珊', '谢谢。'),
    narr('你看着她脖子上的手印。'),
    narr('你决定不说。'),
    narr('至少现在不说。')
  ],
  choices: [
    { text: '把她扶起来。“能走么？”', next: 'act5', effects: { flags: { wang_bond: true }, stats: { sanity: 5 } } },
    { text: '“跟上。别掉队。”', next: 'act5' }
  ]
});

nd('e8r', {
  chapter: '第三幕 · 鬼婴', place: '第七中学 · 一楼 · 楼梯口',
  scene: 'corridor_dark', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'guiying', pos: 'right', scale: 58, dim: true }],
  enter: { stats: { eyes: 4, corruption: 18 }, clues: ['eye_rule', 'guiying_mark'], codex: ['g_guiyan', 'g_guiying'] },
  lines: [
    narr('没有人再说话。'),
    narr('你低头看自己的手臂。'),
    narr('只有一只眼睛，手背上的那只。'),
    narr('它眨了一下。'),
    narr('——那个声音又响了。'),
    { who: '', text: '“哇嘎嘎——”', fx: 'shake', sfx: 'scare' },
    narr('它从黑暗里爬出来，比刚才大了一点。'),
    narr('它没有去找王珊珊。'),
    narr('它朝你来了。'),
    narr('你想躲。'),
    narr('它一口咬住了你的手臂。'),
    narr('冰冷，粘稠，像被吸进一个黑洞。'),
    { who: '', text: '皮肉被硬生生撕开的剧痛。', style: 'blood', fx: 'flash', sfx: 'rise' },
    narr('你惨叫出声，跪在地上。'),
    narr('然后它像被烫到一样，松开口，逃回了黑暗里。'),
    narr('被咬开的那半截手臂上，皮肉正在裂开。'),
    narr('一颗、两颗、三颗、四颗红色的眼珠，冒了出来。'),
    narr('你喘着气，看着自己的手。'),
    narr('——原来不管你怎么选，它都会找上你。'),
    narr('区别只是：谁替你挡在前面。'),
    narr('你把手插进口袋，往操场走。'),
    narr('身后跟着的人，比刚才少了一个。')
  ],
  next: 'act5'
});

/* =========================================================
   第六幕 · 操场与校门
   ========================================================= */
nd('act5', {
  pace: 'run',
  actCard: { id: 'act5', kicker: '第四幕', title: '四点零五分', sub: '六月二十二日 · 04:05 · 操场' },
  chapter: '第四幕 · 操场', place: '第七中学 · 操场',
  scene: 'playground', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'miaoshan', pos: 'right', scale: 86 }],
  lines: [
    narr('教学楼外是操场。'),
    narr('灯全灭了，但这里比楼里好得多。至少看得清。'),
    narr('活下来的人瘫坐在地上，谁也站不起来。'),
    narr('张伟数了一遍人。'),
    say('张伟', '一，二，三，四……一班四十几个，现在就剩这么点。'),
    say('张伟', '这生存率，百分之三十。早知道今天我就请假了。上什么学，别人上学要钱，我们上学要命。'),
    say('苗小善', '我的表……怎么是凌晨四点？'),
    say('赵磊', '我手机上也是四点零五分。刚才分明才八点半啊。'),
    narr('你抬头看天。'),
    narr('没有月亮，没有星星。'),
    narr('只有一层阴霾。'),
    say('杨间', '几点不重要。我在想另一件事。'),
    say('杨间', '这里出了这么大的事，时间过去这么久，为什么外面一点反应都没有？'),
    say('苗小善', '我之前报警了。'),
    say('赵磊', '我还打电话给我妈了。'),
    narr('周围安静得可怕。'),
    narr('平时这个点，学校外面应该有车声。现在连一辆车的灯都看不到。'),
    say('杨间', '……因为鬼域还在。'),
    say('杨间', '鬼域的范围不止教学楼。操场也在里面。'),
    say('杨间', '我们要么在笼子里，要么——笼子正跟着那只鬼，一起移动。')
  ],
  observe: [
    { id: 'o_pl_ash', label: '灯柱下的灰', x: 30, y: 38, light: 2, risk: 1,
      text: '我抬头看灯。灯罩里积着一层灰，灰上有一圈干净的圆，边缘很齐。第二根灯柱的灰是满的，没有那个圆。我伸手比了一下，圆比我的脚大一点。',
      effects: { clues: ['ghost_domain'], codex: ['g_qiaomen'] } },
    { id: 'o_pl_watch', label: '苗小善的表', x: 72, y: 52, light: 1, risk: 0,
      text: '苗小善把表摘下来给我。秒针在抖，不走。背面有一道圆珠笔写的痕，是个「8」，笔画很用力，像写的时候手在抖。她说她不记得写过。',
      effects: { clues: ['knock_rule', 'watch_eight'], flags: { watch_eight: true }, stats: { sanity: 3 } } },
    { id: 'o_pl_seven', label: '跑道边坐着的人', x: 46, y: 66, light: 2, risk: 2,
      text: '我在数人。一、二、三……七个。孙仁的校服后襟上有个青黑的小手印，很小，像婴儿的手，他自己不知道。我又数了一遍，还是七个。第三遍的时候我不敢数了。',
      effects: { clues: ['guiying_mark'], flags: { counted_seven: true } } }
  ],
  choices: [
    { text: '“去校门。试一次。”', next: 'f1', effects: { stats: { clock: 40 }, flags: { try_gate: true } } },
    { text: '先坐下，想清楚规则再动。', next: 'f1b', effects: { stats: { clock: 35 }, clues: ['ghost_domain'] } }
  ]
});

nd('f1b', {
  pace: 'run',
  chapter: '第四幕 · 操场', place: '第七中学 · 操场',
  scene: 'playground', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你坐在石墩上。'),
    narr('一路上的事，在脑子里过了一遍。'),
    narr('帖子。照片。音频。敲门。'),
    narr('鬼域。鬼奴。鬼婴。'),
    narr('它们之间一定有一条线，只是你还没看见。'),
    say('杨间', '~周正说，洞察鬼的规律。~'),
    narr('你摸了摸手背。'),
    narr('皮肉下面，那只眼睛动了一下。'),
    narr('像在回应你。')
  ],
  choices: [
    { text: '“去校门。”', next: 'f1', effects: { flags: { try_gate: true }, stats: { sanity: 12 } } }
  ]
});

nd('f1', {
  pace: 'run',
  chapter: '第四幕 · 操场', place: '第七中学 · 校门 · 保安室外',
  scene: 'guard_booth', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('校门口。'),
    narr('保安亭空无一人。门关着。'),
    narr('你下意识地没有靠近任何一扇门。'),
    narr('谁知道打开之后，会有什么东西冒出来。'),
    narr('马路上静悄悄的。'),
    narr('路灯没有亮。没有车。没有人。'),
    narr('路的尽头被一层无尽的黑暗笼罩，像通往地狱的深处。'),
    say('张伟', '我出去看看。'),
    narr('他翻过护栏，走到马路上。'),
    narr('左右看了看。'),
    narr('然后站在原地，很久没有动。'),
    say('张伟', '……杨间。'),
    say('张伟', '没用。走不出去。'),
    narr('他走回来的时候，脸色比刚才更难看了。'),
    say('张伟', '不管是往左还是往右，走一段就全是黑的。像有人把世界剪掉了一块。')
  ],
  observe: [
    { id: 'o_gate_socket', label: '保安亭的插排', x: 20, y: 62, light: 1, risk: 0,
      text: '我摸到保安亭里的插排。开关的红灯还亮着，说明这条线还有电。我把线插上，红灯跳成绿的。亭子里的挂钟停在九点四十，比我的手机慢了六个小时。',
      effects: { stats: { battery: 20 }, codex: ['g_shadow'] } }
  ],
  choices: [
    { text: '“回来。别试了。”', next: 'f2' }
  ]
});

nd('f2', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你坐在校门边的石墩上，掏出张伟的手机。'),
    say('杨间', '你们之前打电话求救过么？'),
    say('赵磊', '打了。电话打得通，但是……没有声音。'),
    say('赵磊', '而且，还被接通了。我不敢再打了。'),
    say('苗小善', '在教室里的时候，电话还能接通。出了教室没多久，就变成这样了。'),
    narr('教室的时候还能接通。出了教室没多久——'),
    narr('那正好是鬼域第二次出现的时候。'),
    narr('你拿出周正给的卫星电话。'),
    narr('你想起论坛里，雷电法王留下的那个号码。'),
    narr('如果那个医生真的出了事，他的手机，现在会在谁手里？'),
    say('杨间', '~试试。~'),
    narr('你按下那串号码。'),
    { who: '', text: '嘟——', sfx: 'phone' },
    narr('通了。'),
    { who: '', text: '叮铃铃，叮铃铃。', fx: 'shake' },
    narr('手机铃声，在寂静的学校里回荡开来。'),
    narr('你握电话的手僵住了。'),
    narr('那个号码的主人，在这所学校里。'),
    narr('教学楼三楼的窗户上，亮起一点微弱的手机光。'),
    narr('窗后站着一个人影。'),
    narr('正在往下看。'),
    { who: '', text: '嘟。', fx: 'flash' },
    narr('电话被接通了。')
  ],
  observe: [
    { id: 'o_gate_window', label: '三楼亮着的窗', x: 66, y: 24, light: 2, risk: 1,
      text: '三楼那扇窗还亮着一点手机的光。窗后的人影贴着玻璃，脸朝下。不是在往下看，是在找。玻璃上有一片手印，正在往下滑，滑到窗台就停住，然后重新出现在最上面。',
      effects: { clues: ['forum_trap'], codex: ['g_hand'] } }
  ],
  choices: [
    { text: '立刻挂断。', next: 'f3', when: { item: 'phone', minSanity: 35 }, lockedHint: '你还没有那台卫星电话', sanityHint: '我按不准那个键了', effects: { stats: { knock: 2, sanity: 5 }, clues: ['phone_ring', 'forum_trap', 'no_answer'], flags: { called_138: true } } },
    /* B1 降级项：理智不足时精确的操作做不到了，只剩粗暴的那一种。
       它照样给 no_answer（真结局门槛），代价是多花电、多花时间、少拿两条旁证。 */
    { text: '把手机扔进黑里。', next: 'f3', when: { item: 'phone', maxSanity: 34 }, sanityHint: '我按不准那个键了', effects: { stats: { battery: -10, clock: 6 }, clues: ['no_answer'], flags: { called_138: true, shook_phone: true } } },
    { text: '听下去。', next: 'f3b', tell: { sub: ['呼吸'] }, effects: { stats: { battery: -5 } } }
  ]
});

nd('f3b', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你没有挂。'),
    narr('听筒里没有呼吸声。'),
    narr('过了很久，传来一个很轻的声音。'),
    narr('像有人在很远的地方，用指节敲了一下木头。'),
    { who: '', text: '咚。', sfx: 'knockSingle', fx: 'shake' },
    narr('然后，又一下。'),
    narr('然后，是两下急促的。'),
    { who: '', text: '咚——咚咚。', sfx: 'knock' },
    narr('门外的黑暗里，有什么东西，抬起了头。'),
    narr('你挂断电话，手在抖。'),
    say('杨间', '~……它会来。~')
  ],
  choices: [
    { text: '把手机扔远。', next: 'f3', effects: { stats: { knock: 5 }, clues: ['phone_ring', 'audio_trap'], codex: ['g_qiaomen'], flags: { called_138: true } } }
  ]
});

nd('f3', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'ghost',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你挂了电话。'),
    narr('还没等你喘口气，卫星电话响了。'),
    narr('来电显示：138……'),
    narr('他打回来了。'),
    { who: '', text: '滴滴，滴滴。', sfx: 'phone' },
    narr('铃声一遍一遍地响。'),
    narr('你没有接。'),
    narr('过了很久，铃声停了。'),
    narr('然后，其他人的手机，一个接一个地响了起来。'),
    { who: '', text: '叮叮叮——叮叮叮——', sfx: 'phone', fx: 'shake' },
    narr('“我爱你，爱着你，就像老鼠爱大米……”'),
    narr('“凉凉月色为你思念成河……”'),
    narr('来电显示，全是 138……'),
    say('杨间', '别接！谁都别接！'),
    narr('就在这时，钱万豪看着自己的手机，脸色一变。'),
    say('钱万豪', '我这个不是 138……是我妈的号码！'),
    narr('他下意识地按下了接听。')
  ],
  choices: [
    { text: '扑过去，抢他的手机。', next: 'f4', effects: { stats: { knock: 1, battery: -10 }, flags: { tried_stop: true, wrist_hurt: true } } },
    { text: '大喊：“挂掉！”', next: 'f4', tell: { sub: ['他听见了你的声音'] }, effects: { stats: { knock: 4, sanity: -4 }, flags: { he_knows_voice: true } } }
  ]
});

nd('f4', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('来不及了。'),
    narr('钱万豪把手机贴在耳朵上。'),
    say('钱万豪', '喂？妈？'),
    narr('听筒里只有嗤嗤的电流声。'),
    narr('然后——'),
    { who: '', text: '咚——咚咚。', sfx: 'knock', fx: 'shake' },
    narr('敲门声，从电话那头传了出来。'),
    narr('和教室外，一模一样。'),
    say('钱万豪', '……妈？'),
    narr('他的手机掉在地上。'),
    narr('屏幕碎了，可电话还通着。'),
    narr('敲门声一遍一遍，从碎裂的屏幕里渗出来。'),
    { who: '', text: '所有人都听见了。', style: 'blood' }
  ],
  choices: [
    { text: '冲过去，关掉那个电话。', next: 'f5', effects: { stats: { knock: 1 }, clues: ['phone_ring'] } },
    { text: '后退，离那个手机远一点。', next: 'f5', effects: { stats: { knock: 6 }, clues: ['phone_ring'], flags: { too_late: true } } }
  ]
});

nd('f5', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', rotAfter: '02:20', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你捡起钱万豪的手机，按掉。'),
    narr('敲门声停了。'),
    narr('可所有人都知道，已经晚了。'),
    narr('赵磊一把揪住钱万豪的衣领。'),
    say('赵磊', '你他妈是不是傻！都说了别接别接！'),
    say('钱万豪', '那……那上面是我妈的号啊……'),
    say('张伟', '之前教室外那个老人是你亲爷爷么？你这么爱他，怎么不去跟他说，让他放过我们？'),
    say('杨间', '够了。'),
    narr('你开口的时候，自己都觉得声音很陌生。'),
    say('杨间', '现在吵架能活下去么？'),
    narr('没人再说话了。'),
    say('苗小善', '杨间……接了电话，会发生什么？'),
    say('杨间', '那个老人会来。'),
    say('杨间', '很快。')
  ],
  choices: [
    { text: '把帖子再看一遍。一定有哪里不对。', next: 'f6', effects: { stats: { clock: 30 } } },
    { text: '“跑。往操场那边跑。”', next: 'f6b', effects: { stats: { clock: 25, knock: 2 } } }
  ]
});

nd('f6b', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 操场',
  scene: 'playground', rotAfter: '02:30', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'laoren', pos: 'right', scale: 80, dim: true }],
  lines: [
    narr('你们跑出去没多远。'),
    narr('学校的方向，涌过来一片浓郁的黑暗。'),
    narr('像潮水，也像一张正在合拢的嘴。'),
    narr('所过之处，树木枯萎，地面腐朽，路灯长出铁锈。'),
    narr('黑暗里，一个穿黑色长衫的老人，正一步一步地走过来。'),
    narr('不紧不慢。'),
    narr('像在散步。'),
    narr('你忽然明白了什么。'),
    say('杨间', '~跑是没有用的。~'),
    narr('你停下脚步。'),
    narr('身后的人撞在你身上，摔了一地。')
  ],
  next: 'f6'
});

nd('f6', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你打开手机，重新翻那个帖子。'),
    narr('雷电法王。坐诊医生。'),
    narr('第一道门。第二道门。'),
    narr('“我把门关上了，所有能打开的灯都打开了，但那老人还在敲门。”'),
    narr('“我客厅里传来了脚步声。”'),
    narr('“那老人进来了。”'),
    narr('他的家，有两道门。'),
    narr('第一道是大门，第二道是房门。'),
    narr('老人敲第一道门的时候——'),
    narr('他已经死了。'),
    narr('后面的帖子，不是他发的。'),
    say('杨间', '~错字。~'),
    narr('你翻到最后几页。'),
    narr('最后几条回帖，错字很多，语序混乱。'),
    narr('而之前的楼主，打字从来一板一眼。'),
    narr('中间，还空了半个小时。'),
    say('杨间', '~后面发帖的，是那只鬼。~'),
    narr('整个帖子，是一个诅咒。'),
    narr('一个会自己传播的诅咒。'),
    narr('听过敲门声的人，都会被他找上门。'),

    /* 分支：你听过 / 你没听过 */
    { who: '', text: '你想起昨晚。', when: { flag: 'listened' } },
    { who: '', text: '那段音频。一长，两短。', when: { flag: 'listened' } },
    say('杨间', '~……他是来找我的。~', { when: { flag: 'listened' } }),

    { who: '', text: '你没有听过。', when: { flag: 'no_listen' } },
    { who: '', text: '但有人听过。', when: { flag: 'no_listen' } },
    say('张伟', '……杨间。', { when: { flag: 'no_listen' } }),
    say('张伟', '昨晚那个帖子，我也看了。', { when: { flag: 'no_listen' } }),
    say('张伟', '我点开了那个音频。', { when: { flag: 'no_listen' } }),
    { who: '', text: '他的声音在抖。', when: { flag: 'no_listen' } },
    say('张伟', '那东西……是来找我的吧？', { when: { flag: 'no_listen' } }),
    { who: '', text: '你看着他。', when: { flag: 'no_listen' } },
    { who: '', text: '你想起他今晚一直跟在你身后，一步都不敢离开。', when: { flag: 'no_listen' } },
    say('杨间', '~……是。~', { when: { flag: 'no_listen' } }),
    { who: '', text: '张伟没有说话，低下头，肩膀在抖。', when: { flag: 'no_listen' } },
    { who: '', text: '你不知道该说什么。', when: { flag: 'no_listen' } },
    { who: '', text: '你只是把他往自己身后拉了拉。', when: { flag: 'no_listen' } },
    { who: '', text: '——他是来找张伟的。', when: { flag: 'no_listen' } },
    { who: '', text: '本来是这样。', when: { flag: 'no_listen' } },
    { who: '', text: '可刚才那通电话里的敲门声，把所有人都卖了。', when: { flag: 'no_listen' } },
    { who: '', text: '现在，他找的不只是张伟了。', when: { flag: 'no_listen' } }
  ],
  choices: [
    { text: '点开线索，把规则串起来。', next: 'f7', when: { minSanity: 45 }, sanityHint: '碎片拼不起来了', effects: { clues: ['forum_trap', 'audio_trap', 'knock_rule'], codex: ['g_qiaomen'], flags: { solved_forum: true }, stats: { sanity: 10 } } },
    /* 幻觉选项：错乱档才出现。承诺"跳过这一节"，而时间正是玩家最缺的。 */
    { text: '我知道那条线在哪——不用想了，走。', next: 'f7', when: { maxSanity: 34 }, sanityHint: '我知道的。我知道的。', effects: { stats: { clock: 20, sanity: -5 }, flags: { guessed_it: true } } },
    { text: '不看了。现在最要紧的是想办法。', next: 'f7' }
  ]
});

nd('f7', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 操场边 · 绿化林',
  scene: 'woods', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你想起了另一个人。'),
    narr('方镜。'),
    narr('他知道未来。'),
    narr('也许，他知道今晚该怎么活。'),
    narr('你掏出张伟的手机，翻到方镜的号码。'),
    narr('手指停在拨号键上。'),
    say('杨间', '~他把我推进了厕所。~'),
    say('杨间', '~但他也知道怎么出去。~'),
    narr('张伟在旁边看着你。'),
    say('张伟', '杨间，你要打给方镜？那家伙……'),
    say('杨间', '我知道。')
  ],
  choices: [
    { text: '拨通方镜的电话。', next: 'f8', effects: { flags: { called_fangjing: true } } },
    { text: '不打了。这种人死了最好。', next: 'f9', effects: { flags: { refused_fangjing: true }, clues: ['fangjing_future'] } }
  ]
});

nd('f8', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'woods', rotAfter: '02:30', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('电话响了两声，接通了。'),
    say('方镜', '喂？'),
    say('杨间', '是我，杨间。'),
    narr('电话那头沉默了一秒。'),
    say('方镜', '……你，你不是已经死了么？'),
    say('杨间', '托你的福，我还没死。'),
    say('方镜', '你想干什么？'),
    say('杨间', '你想活命么？'),
    narr('又是一阵沉默。'),
    say('方镜', '……你有办法？'),
    say('杨间', '我成了驭鬼者。你说我有没有办法。'),
    say('方镜', '你快救我出去！之前的事我不是故意的，我也是为了活命！大家同学一场，有什么误会化解不开？'),
    say('杨间', '想让我带你出去，除非你能让我满意。'),
    say('方镜', '你想知道什么？'),
    say('杨间', '周正说你有古怪。教室里有人说你知道未来。'),
    say('方镜', '对。我知道。我有未来的信息。'),
    say('方镜', '你带我出去，我就把未来全告诉你。我有让你活下去的办法——国际研究中心的方法，三个月后才会公开。'),
    say('杨间', '你骗我。周正说没有人能从未来回来。'),
    say('方镜', '我没有未来的记忆！那些信息来自一张羊皮纸！'),
    say('方镜', '是十年后的我送过来的。上面是十年后的我写的字。'),
    narr('你握着电话，心跳快了一拍。'),
    say('杨间', '我要那张羊皮纸。'),
    say('方镜', '不行。那是我的。'),
    say('杨间', '你没有选择。那东西离你很近了。'),
    narr('电话那头传来奔跑的脚步声。'),
    say('方镜', '……给。我给你。'),
    say('方镜', '但你得先救我。我怎么知道你有能力救我？'),
    say('杨间', '往左边走。'),
    narr('你听见他在跑。'),
    say('杨间', '再往右。'),
    narr('脚步声渐渐远了。'),
    say('方镜', '甩掉了……真的甩掉了！'),
    say('杨间', '东西。'),
    say('方镜', '你先带我出去，出去我就给你。'),
    narr('你想了想。'),
    say('杨间', '那你小心一点。它又追上来了。'),
    { who: '', text: '你挂断了电话。', fx: 'flash' }
  ],
  choices: [
    /* 「拿到纸」是 e_written 的唯一入口，所以标准/故事档**不能**设理智门槛。
       噩梦档是专家模式，允许把它变成"要保持清醒才拿得到"。
       不能写成 when:{diff:'nightmare', minSanity:30}——引擎的 diff 是**合取**的，
       那样写等于"只在这档存在"，标准档会直接失去 e_written（实测过）。
       这里用函数条件表达"仅噩梦档要求理智"。 */
    { text: '再打一次。让他把纸丢下。', next: 'f9',
      when: s => !(s.difficulty === 'nightmare' && (s.stats.sanity == null ? 100 : s.stats.sanity) < 30),
      effects: { flags: { got_paper: true }, items: { paper: 1 }, clues: ['fangjing_future', 'paper_rule'], codex: ['p_fangjing'] } },
    { text: '不再打了。让他自生自灭。', next: 'f9', effects: { flags: { fangjing_died: true } } }
  ]
});

nd('f9', {
  pace: 'run',
  chapter: '第四幕 · 校门', place: '第七中学 · 校门',
  scene: 'school_gate', rotAfter: '02:20', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 88 }, { id: 'laoren', pos: 'right', scale: 86 }],
  lines: [
    narr('远处，那片黑暗正在逼近。'),
    narr('一个穿黑色长衫的老人，满脸死灰，一步一步地走来。'),
    narr('每一步，都像踩在你的心脏上。'),
    narr('张伟的眼泪掉了下来。'),
    say('张伟', '杨间……我不想死啊。我还这么年轻，我还是个处男……'),
    say('张伟', '方镜说你以后很牛逼的，你一定有办法的对不对？'),
    say('王珊珊', '我们是不是走不出去了？'),
    say('赵磊', '后面也有！后面也有黑暗！'),
    narr('你低头，看着自己的手。'),
    narr('皮肉下面，眼睛在动。'),
    narr('五点二十九分。'),
    say('杨间', '~还有一分钟。~'),
    /* 敲门累计（包括观察时听见的那些）：听得越多，他越确定你在哪 */
    { who: '', text: '你忽然意识到，这一整夜你听见的敲门声，加起来早就超过了十三下。', when: { minKnock: 13 } },
    { who: '', text: '——他一直不用找。你每一次抬头，都是在回答他。', when: { minKnock: 13 }, style: 'em' },
    { who: '', text: '你摸到了口袋里那张人皮纸。', when: { flag: 'got_paper' } },
    { who: '', text: '上面浮出一行新字：五点三十一分，我活下来了……一共八个。', when: { flag: 'got_paper' }, style: 'blood', effects: { clues: ['eighth'], codex: ['m_531'] } },
    { who: '', text: '“嘿嘿。”', when: { flag: 'got_paper' }, style: 'whisper' },
    { who: '', text: '你不知道那个笑声，是写给谁的。', when: { flag: 'got_paper' } },
    { who: '', text: '纸上的字还在变。', when: { flag: 'got_paper' } },
    { who: '', text: '“我叫杨间，当你看到这封信的时候我已经死了。”', when: { flag: 'got_paper' }, style: 'blood', effects: { codex: ['m_paper_you'] } },
    { who: '', text: '那是你自己的笔迹。', when: { flag: 'got_paper' } },
    { who: '', text: '你把它塞回口袋，没有再打开。', when: { flag: 'got_paper' } }
  ],
  observe: [
    { id: 'o_gate_steps', label: '他走过的地面', x: 34, y: 66, light: 1, risk: 2,
      text: '他走过的地方，地砖上的水渍干了，灰也没了。不是踩脏，是被收走。我数了数：十二块干净的地砖，一块挨着一块。他还要再走一步。',
      effects: { clues: ['ghost_domain', 'counted_steps'], flags: { counted_steps: true }, stats: { sanity: 4 } } }
  ],
  /* 观察入口挂在 renderChoices 里，所以没有 choices 的节点看不到观察点 */
  choices: [
    { text: '……还有一步。', next: 'f10' }
  ]
});

nd('f10', {
  chapter: '第四幕 · 五点三十', place: '第七中学 · 校门',
  scene: 'school_gate', rotAfter: '02:20', mood: 'blood',
  cast: [{ id: 'laoren', pos: 'left', scale: 82 }, { id: 'yangjian_eye', pos: 'right', scale: 92 }],
  lines: [
    /* 超时被拽过来的玩家：让他知道自己是"看没了"，不是游戏出错。
       __timeup 由引擎的 forcedTarget() 置位，只有超时跳转这条路会看到这句。 */
    { who: '', text: '我一直在看。看到天亮了——操场那边，已经来不及了。', when: { flag: '__timeup' }, style: 'em' },
    narr('如果什么都不做，五点三十分，所有人都会死。'),
    narr('你只有一次机会。'),
    narr('你的手按在手臂上。'),
    narr('皮肉下面，五只眼睛，齐齐睁开。'),
    /* 周目：知道结局，也仍然只有一次机会 */
    { who: '', text: '五点三十。', style: 'blood', fx: 'shake', sfx: 'heartbeat' }
  ],
  observe: [
    /* noDim：saw_sixth 全篇唯一来源，不能被电量收缩吞掉（设计 §12.3） */
    { id: 'o_f10_eyes', label: '手臂上的眼睛', x: 70, y: 58, light: 1, risk: 0, noDim: true,
      text: '我数手臂上的眼睛。五只，深浅不一，都睁着。第六只在更深的地方，闭着，眼皮底下有东西在动。它不是长出来的，它是饿的。我用指甲按了一下那一处，它往里缩了缩，像在躲。',
      effects: { clues: ['saw_sixth'], flags: { saw_sixth: true }, stats: { corruption: 4 } } },
    { id: 'o_f10_faces', label: '同学的脸', x: 40, y: 42, light: 1, risk: 1,
      text: '我一张一张看过去。张伟、苗小善、赵磊、孙仁、刘奇、王珊珊……七张脸。看到第五张的时候我停住了：多了一张，不是人，是一张脸贴在他们背后，跟着一起转过来。',
      effects: { clues: ['eighth'], flags: { saw_eighth: true }, stats: { corruption: 6, sanity: -5 } } }
  ],
  choices: [
    { text: '咬下手臂上的一只眼睛，吞下去。', next: 'f11', when: { allClues: ['eye_rule'], minEyes: 5, maxCorruption: 60, minSanity: 30 }, lockedHint: '它们已经在替你数了', sanityHint: '我连哪只眼睛是我的都分不清', effects: { stats: { eyes: 1, corruption: 25, sanity: -20 }, flags: { ate_eye: true } } },
    /* 原为 minEyes:6 —— 进 f10 前眼睛上限是 5，这是个不可达的死选项，现改 5 */
    { text: '把所有人聚在一起，用鬼域罩住他们。', next: 'f11b', when: { allClues: ['eye_rule'], minEyes: 5 }, lockedHint: '我还撑不开那么大一片', effects: { stats: { corruption: 40 }, flags: { shielded_all: true } } },
    { text: '我跑得比他快。', next: 'f12a' },
    { text: '纸上是这么写的。', next: 'f12b', when: { item: 'paper' }, lockedHint: '你没有那张纸' },
    { text: '闭上眼睛，就不用看了。', next: 'f12c' }
  ]
});

nd('f11', {
  chapter: '第四幕 · 五点三十', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'center', scale: 92 }],
  lines: [
    narr('你张开嘴，咬了下去。'),
    { who: '', text: '皮肉被撕开的剧痛，从手臂一直炸到脑子里。', style: 'blood', fx: 'shake', sfx: 'scare' },
    narr('血涌进嘴里。'),
    narr('腥的。也是冰的。'),
    narr('那只眼睛在你的舌头上挣扎了一下，然后不动了。'),
    narr('你咽了下去。'),
    narr('——胃里有什么东西，睁开了。'),
    { who: '', text: '第六只眼睛。', fx: 'flash', sfx: 'rise' },
    narr('手臂上的伤口处，血肉翻动，一只更大的红色眼睛长了出来。'),
    narr('你身上的皮肤正在龟裂。'),
    narr('裂纹里透出红光。'),
    narr('一道。两道。三道。'),
    narr('红光像粘稠的雾，顺着地面漫开。'),
    narr('黑暗被推开了。'),
    narr('惨白的手，一只一只缩了回去。'),
    narr('那个老人停下了脚步。'),
    narr('第一次——'),
    narr('往后退了一步。')
  ],
  route: () => 'act6'
});

nd('f12a', {
  chapter: '第四幕 · 五点三十', place: '大昌市 · 步行街 · 深夜',
  scene: 'street_night', mood: 'void',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你动了。'),
    narr('在所有人反应过来之前，你翻过护栏，冲进了黑暗。'),
    narr('身后有人喊你的名字。'),
    narr('你没有回头。'),
    narr('黑暗淹没了你。'),
    narr('然后——'),
    { who: '', text: '你听见了敲门声。', sfx: 'knock', fx: 'flash' },
    narr('一长，两短。'),
    narr('就在你面前。'),
    narr('门开了。')
  ],
  enter: { set: { survivors: 1 } },
  choices: [
    { text: '（什么也没说。）', ending: 'e_alone' }
  ]
});

nd('f12b', {
  chapter: '第四幕 · 五点三十', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'void',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你掏出那张羊皮纸。'),
    narr('上面已经写满了字。'),
    narr('“五点三十分，杨间站在校门口。”'),
    narr('“他打开了这张纸。”'),
    narr('“他会照做。”'),
    narr('你盯着最后四个字。'),
    narr('纸面上的字迹，正在微微发亮。'),
    narr('像是有一个人，正隔着十年，看着你。'),
    narr('你听见自己说：'),
    say('杨间', '……好。')
  ],
  enter: { set: { survivors: 0 } },
  choices: [
    { text: '照它写的做。', ending: 'e_written' }
  ]
});

nd('f12c', {
  chapter: '第四幕 · 五点三十', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'void',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('你闭上眼睛。'),
    narr('周围的声音一下子变得很远。'),
    narr('敲门声。'),
    narr('一长，两短。'),
    narr('然后是三下、四下、五下。'),
    narr('越来越快。'),
    narr('你数着。'),
    narr('第九下。'),
    narr('第十下。'),
    narr('第十一下。'),
    narr('第十二下。'),
    { who: '', text: '第十三下。', fx: 'flash', sfx: 'knock' },
    narr('门开了。')
  ],
  enter: { set: { survivors: 0 } },
  choices: [
    { text: '（把眼睛闭上。）', ending: 'e_door' }
  ]
});

/* A 表 #23 修复出来的分支：不咬眼睛，改用五只眼睛撑开鬼域罩住所有人。
   原来 f10 第 2 项条件是 minEyes:6，而进 f10 前上限只有 5，是个永远点不动的死选项。 */
nd('f11b', {
  chapter: '第四幕 · 五点三十', place: '第七中学 · 校门',
  scene: 'school_gate', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'center', scale: 92 }],
  lines: [
    narr('我把所有人往中间推。'),
    narr('张伟在骂，苗小善在哭，王珊珊抓住我的胳膊不肯松。'),
    narr('“别散开。”我说。'),
    narr('我闭上眼睛，去够皮肤下面那五只眼睛。'),
    { who: '', text: '它们一起睁开了。', fx: 'flash', sfx: 'rise' },
    narr('疼。'),
    narr('不是皮肉的疼，是有什么东西在往外挤，挤得我骨头都在响。'),
    narr('红光从我身上淌出去，在地上摊开，像一个圈。'),
    narr('圈里的黑暗退开半步。圈外的黑暗往前挪了一步。'),
    narr('那个老人停下来，看着我。'),
    narr('很久。'),
    narr('然后他往后退了一步。'),
    narr('——只有一步。'),
    { who: '', text: '我知道这一步只够撑到天亮。', style: 'em' }
  ],
  route: () => 'act6'
});
