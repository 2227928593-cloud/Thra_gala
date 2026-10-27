/* =========================================================
   终幕 · 步行街
   ========================================================= */
'use strict';

nd('act6', {
  pace: 'still',
  actCard: { id: 'act6', kicker: '终幕', title: '五点三十一分', sub: '六月二十二日 · 大昌市步行街' },
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('路灯亮了。'),
    narr('猩红色的光。'),
    narr('灯罩里的圆形灯泡上，映出一只一只红色的眼睛，像印上去的印花。'),
    narr('然后，灯闪了一下。'),
    { who: '', text: '一切恢复了原样。', fx: 'flash' },
    narr('空荡荡的步行街上，多出了七个人。'),
    narr('有男有女，年纪很轻，都是学生。'),
    narr('他们脸色苍白，浑身发抖，眼睛里全是恐惧。'),
    narr('——像刚从水里捞上来。')
  ],
  route: s => (s.flags.left_wang ? 'g1b' : 'g1')
});

nd('g1', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  enter: { set: { survivors: 7, clock: 331 }, flags: { escaped: true }, stats: { corruption: 5 } },
  lines: [
    narr('你跌坐在地上，靠着一家店铺的玻璃门。'),
    narr('皮肤上要裂开一样的疼痛，正在慢慢退去。'),
    narr('你抬起手。'),
    narr('手臂上的伤口已经不见了。'),
    narr('皮肉下面，有一个眼睛形状的轮廓藏着，随时都可能冒出来。'),
    { who: '', text: '你嘴里还留着一股铁锈一样的血腥味。', when: { flag: 'ate_eye' } },
    { who: '', text: '——那是你自己的血。', when: { flag: 'ate_eye' } },
    say('杨间', '~……不是梦。~'),
    say('张伟', '这里是哪？'),
    say('苗小善', '好……好像是步行街。'),
    say('张伟', '就是步行街！我从小在这里玩，不会认错的！'),
    narr('他忽然站起来，指着远处。'),
    say('张伟', '你们看！路灯是亮的！天也是亮的！那边还有车！我听见喇叭声了！'),
    narr('他笑着笑着，眼泪就下来了。'),
    narr('赵磊也站了起来，又蹲下去，抱着头。'),
    narr('远处，天边有一道很淡的白。'),
    narr('太阳快出来了。')
  ],
  observe: [
    { id: 'o_end_lamp', label: '路灯罩', x: 24, y: 18, light: 0, risk: 0,
      text: '路灯罩玻璃上的眼睛是印上去的印花，我数了三只。盯久了，最上面那只眨了一下。我再看，它又不动了。玻璃很干净，干净得像有人刚擦过。',
      effects: { clues: ['eye_rule'], codex: ['g_guiyan'], stats: { corruption: 2 } } }
  ],
  choices: [
    { text: '数一数，还剩几个人。', next: 'g2' }
  ]
});

nd('g1b', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  enter: { set: { survivors: 6, clock: 331 }, flags: { escaped: true, missing_one: true }, stats: { corruption: 5 } },
  lines: [
    narr('路灯闪了一下，一切恢复原样。'),
    narr('空荡荡的步行街上，多了几个人。'),
    narr('你跌坐在地上，靠着玻璃门，喘了很久。'),
    narr('张伟在数人。'),
    say('张伟', '一，二，三，四……'),
    narr('他数到第七个，停了下来。'),
    say('张伟', '……七个人。'),
    narr('没有人说话。'),
    narr('红光熄灭前的最后一秒，你清楚地看见，王珊珊就站在你身后。'),
    narr('她朝你伸着手。'),
    narr('你没有拉住。'),
    narr('——可是刚才在路上，你明明数到了八道影子。')
  ],
  choices: [
    { text: '“……走吧。”', next: 'g2' }
  ]
});

nd('g2', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_day', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'miaoshan', pos: 'right', scale: 86 }],
  lines: [
    narr('你们在街边坐了整整两个小时。'),
    narr('天亮了。'),
    narr('早点铺子开始开门，蒸笼冒着白气。扫地的环卫工从街那头走过来，看了你们一眼，又低下头继续扫。'),
    narr('好像这一夜什么都没有发生过。'),
    say('张伟', '徐老师，赵强，郑飞，方镜……钱万豪。'),
    say('张伟', '他们应该都已经死了吧。'),
    narr('没有人回答他。'),
    say('孙仁', '……我们班，一共四十多个人。'),
    say('刘奇', '别数了。'),
    narr('孙仁不说话了。'),
    narr('你看了他一眼。'),
    narr('今晚之前，你和他没说过几句话。'),
    say('苗小善', '杨间，那我们现在应该怎么办？'),
    narr('所有人都看着你。'),
    narr('你摸了摸手臂。'),
    say('杨间', '还能怎么办。回家睡觉。'),
    say('赵磊', '发生了这么大的事……学校都闹鬼啊，死了这么多人，我们就这样回家睡觉？'),
    say('杨间', '不然呢？报警？告诉警察学校闹鬼，死了很多人？'),
    say('杨间', '周正就是国际刑警。他死在了学校里。国家一定会派人调查的。'),
    say('杨间', '我们只是学生。好不容易活下来，难道还想牵连进去？'),
    narr('赵磊低下头，不说话了。')
  ],
  choices: [
    { text: '“有件事，你们得记住。”', next: 'g3', effects: { stats: { sanity: 6 } } }
  ]
});

nd('g3', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_day', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'miaoshan', pos: 'center', scale: 84 }, { id: 'wangshanshan', art: 'wangshanshan_marked', pos: 'right', scale: 86 }],
  lines: [
    narr('你打开手机，把那个帖子翻出来。'),
    say('杨间', '看见这个音频文件没有？'),
    say('杨间', '记住，千万，千万别点开它。'),
    say('杨间', '这是敲门声。谁听见了，那个老人就会找上谁。'),
    narr('你把页面往上翻，露出那张照片。'),
    narr('张伟他们惊恐地往后退。'),
    say('杨间', '照片没事。我试过了。'),
    say('杨间', '可怕的是声音。'),
    say('杨间', '这个帖子到现在还没被封。全国听过的人，至少有成千上万。'),
    say('杨间', '接下来，那个老人会游走在各个城市之间，一家一家地敲门。'),
    say('杨间', '昨天晚上的事，会在全国不断上演。'),
    say('杨间', '只是主角不再是我们了。'),
    say('张伟', '……你别说了。我还是个孩子。'),
    narr('有人说：“那手机怎么办？”'),
    narr('所有人像丢瘟疫一样，把手机丢在地上。'),
    say('杨间', '不要给我啊。扔了多浪费。'),
    narr('你把手机一台一台捡起来，拍了拍灰。'),
    say('杨间', '回头当二手机卖了。卖了的钱，我一分都不会给你们。'),
    say('苗小善', '……你还真是一点都没变。'),
    say('杨间', '走了。')
  ],
  next: 'g4'
});

nd('g4', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_day', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'wangshanshan', art: 'wangshanshan_marked', pos: 'right', scale: 88 }],
  lines: [
    narr('你转身要走。'),
    narr('袖子被人拉住了。'),
    say('王珊珊', '带我一起走。'),
    say('杨间', '我要回去睡觉。你要跟我回家睡觉？'),
    say('王珊珊', '……我不介意，到你家借住几天。'),
    narr('周围所有人都睁大了眼睛。'),
    narr('包括你。'),
    narr('王珊珊算不上班花，但也不差。练过舞蹈，腰细，腿长。以前你们不生不熟，话都没说过几句。'),
    narr('可她现在抓着你的袖子，手在抖。'),
    narr('你知道那不是因为喜欢。'),
    narr('是因为她后颈上的那个手印。'),
    narr('她不敢一个人待着。'),
    narr('或者说——她怕自己一个人待着的时候，那个手印会动。')
  ],
  observe: [
    { id: 'o_end_hand', label: '王珊珊的手', x: 60, y: 64, light: 0, risk: 0,
      text: '王珊珊抓着我的袖子，指节是白的。晨光从侧面打过来，把所有人的影子拉得很长。我低头找她的影子，找了很久。她没有。她还在跟我说谢谢。',
      effects: { clues: ['wang_no_shadow'], flags: { wang_no_shadow: true }, stats: { corruption: 4 } } }
  ],
  choices: [
    { text: '“走吧。我家沙发挺大的。”', next: 'g5', effects: { flags: { took_wang_home: true }, codex: ['m_handprint'] } },
    { text: '“我送你回家。到楼下就走。”', next: 'g5', effects: { flags: { walked_wang_home: true } } },
    { text: '“松开。各回各家。”', next: 'g5b', effects: { flags: { pushed_wang_away: true }, stats: { corruption: 8, sanity: -8 } } }
  ]
});

nd('g5b', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'left', scale: 86 }, { id: 'wangshanshan', pos: 'right', scale: 88 }],
  lines: [
    narr('你把袖子从她手里抽出来。'),
    say('杨间', '各回各家。'),
    narr('她站在原地，看着你。'),
    narr('没有哭，也没有再伸手。'),
    narr('只是很轻地点了一下头。'),
    say('王珊珊', '……好。'),
    narr('你走出很远，回头看了一眼。'),
    narr('她还站在那里。'),
    narr('手垂在身侧。'),
    narr('后颈上的那个青黑色的手印，在晨光里，像是比刚才大了一圈。')
  ],
  next: 'g5'
});

nd('g5', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_day', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('你站在街口。'),
    narr('绿灯亮了。'),
    narr('早班公交车从你面前开过去，车窗里的人都低着头看手机。'),
    narr('没有人抬头看你。'),
    narr('你忽然觉得，这个世界很陌生。'),
    narr('你摸了摸口袋里那台卫星电话。'),
    narr('它一直很安静。'),
    narr('安静得像在等什么。'),
    { who: '', text: '——你听见了敲门声。', sfx: 'knock', fx: 'flash' },
    narr('很轻。'),
    narr('不是从哪个方向传来的。'),
    narr('是从你自己的手背里。'),
    { who: '', text: '王珊珊走在你身后半步的位置。', when: { flag: 'took_wang_home' } },
    { who: '', text: '你说好只送她到楼下。', when: { flag: 'walked_wang_home' } },
    { who: '', text: '你刚才把她的手从袖子上拿开了。她的手很凉。', when: { flag: 'pushed_wang_away' } }
  ],
  observe: [
    { id: 'o_end_phone', label: '口袋里的卫星电话', x: 44, y: 54, light: 0, risk: 0,
      text: '我把卫星电话从口袋里摸出来。屏幕是黑的，按一下就亮。里面只有一条信息，没有署名：「活着就好。下午三点，人民公园东门。别带别人。」 时间戳是五点三十一。',
      effects: { clues: ['only_ghost'], flags: { phone_msg: true }, stats: { sanity: 3 } } }
  ],
  choices: [
    { text: '把手插进口袋，往前走。', next: 'g6' },
    { text: '低头，看手背。', next: 'g6b', effects: { stats: { corruption: 6, sanity: -10 } } },
    { text: '回头，看一眼第七中学的方向。', next: 'g6c', effects: { flags: { looked_back: true } } }
  ]
});

nd('g6b', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('你低头。'),
    narr('手背的皮肤下面，那颗眼珠正在慢慢地转动。'),
    narr('它看着你。'),
    narr('你也看着它。'),
    narr('你忽然有一个很荒谬的念头：'),
    say('杨间', '~……我们，谁在谁的身体里？~'),
    narr('眼睛眨了一下。'),
    narr('像是在笑。')
  ],
  next: 'g6'
});

nd('g6c', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('你回过头。'),
    narr('城市的楼群挡着，看不见第七中学。'),
    narr('但你知道它在那儿。'),
    narr('安静、干净，像什么都没发生过。'),
    narr('再过两个小时，早读铃会响。'),
    narr('会有人发现高三（二）班的门开着，桌椅倒在地上，黑板上有三行粉笔字。'),
    narr('会有人报警。'),
    narr('会有一份卷宗，写着“暂无凶手”。'),
    narr('而你，会回到那间出租屋，睡上一整天。'),
    narr('然后呢？')
  ],
  next: 'g6'
});

nd('g6', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_day', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  enter: { flags: { reached_end: true } },
  lines: [
    narr('你把那台卫星电话从口袋里拿出来。'),
    narr('屏幕是黑的。'),
    narr('你按了一下，它亮了。'),
    narr('上面只有一条信息，没有署名。'),
    { who: '', text: '“活着就好。下午三点，人民公园东门。别带别人。”', style: 'em' },
    narr('你看着那行字，看了很久。'),
    narr('然后你把手机收起来，继续往前走。'),
    narr('身后的步行街开始热闹起来。'),
    narr('有人在吆喝，有人在笑。'),
    narr('很正常的声音。'),
    narr('——只是从这一天起，你再也听不得敲门声。')
  ],
  next: 'g7'
});

nd('g7', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_day', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('天完全亮了。'),
    narr('你在街口停下脚步。'),
    narr('身后是你救下来的人，身前是这座城市。'),
    narr('你还有一只眼睛藏在皮肤下面。'),
    narr('还有一张不知道什么时候会再开口的嘴。'),
    narr('还有一个问题，你一直没有问出口：'),
    say('杨间', '~我到底是人，还是鬼？~')
  ],
  choices: [
    { text: '转过身，和他们一起回去。', next: 'end_true',
      when: { notFlag: 'left_wang', allClues: ['eye_rule', 'saw_sixth', 'ghost_domain', 'no_answer'], minSurvivors: 5 },
      lockedHint: '我还不知道该往哪扇门里走，或者身边已经没那么多手可以拉了' },
    { text: '一个人走开。', next: 'end_alone' },
    { text: '把手背上的眼睛，全部睁开。', next: 'end_absorb', when: { minCorruption: 60 }, lockedHint: '还不够。它们还在等。' },
    { text: '回头去找那个“第八个人”。', next: 'end_eighth', when: { flag: 'left_wang' }, lockedHint: '你身边的人都好好的' }
  ]
});

/* ---------------- 结局节点 ---------------- */
nd('end_true', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('你转过身。'),
    narr('张伟正蹲在路边，拿手机对着早点铺子拍。'),
    say('张伟', '杨间！肉包子！我请！'),
    say('苗小善', '……都什么时候了，你还吃得下。'),
    say('张伟', '就是因为不知道什么时候会死，才要趁活着多吃两个啊。'),
    narr('他说得很轻松。'),
    narr('可他的手一直在抖。'),
    narr('王珊珊站在他们后面，看见你回头，眼睛一下子就亮了。'),
    narr('你朝他们走过去。'),
    narr('晨光落在你们身上，把影子拉得很长。'),
    narr('张伟，苗小善，赵磊，孙仁，刘奇，王珊珊。'),
    narr('还有你。'),
    { who: '', text: '七个人，一个不少。', style: 'em' },
    narr('你摸了摸口袋里的那张人皮纸。'),
    narr('它写着：五点三十一分，我活下来了，一共八个。'),
    narr('你又数了一遍。'),
    narr('还是七个。'),
    narr('你决定，不再数第四次。')
  ],
  next: 'g8'
});

nd('end_alone', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'dawn',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('你把手机塞回口袋，转身走进人流。'),
    narr('张伟在后面喊了一声什么。'),
    narr('你没有听清。'),
    narr('也没有回头。'),
    narr('你需要一个人待一会儿。'),
    narr('需要想清楚，从今天起，自己该怎么活。'),
    narr('手背上的眼睛，静静地睁着。'),
    narr('——它有很多时间。')
  ],
  ending: 'e_alone'
});

nd('end_absorb', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  enter: { stats: { corruption: 30 }, set: { survivors: 0 } },
  lines: [
    narr('你停下脚步。'),
    narr('把袖子挽起来。'),
    narr('皮肉下面的眼睛，一只，两只，三只……'),
    narr('它们都在看你。'),
    say('杨间', '~让我看看，你们到底能看见什么。~'),
    narr('它们睁开了。'),
    { who: '', text: '全部睁开了。', fx: 'flash', sfx: 'rise' },
    narr('红光从你身上漫出来，盖住了整条街。'),
    narr('街上的行人停下脚步，抬起头。'),
    narr('早点铺的白气停在半空。'),
    narr('一只麻雀从电线上掉下来，落进你的影子里。'),
    narr('你听见很多声音。'),
    narr('很多很多声音。'),
    narr('它们都在叫同一个名字。'),
    narr('——不是你叫的那个。')
  ],
  ending: 'e_absorb'
});

nd('end_eighth', {
  pace: 'still',
  chapter: '终幕 · 步行街', place: '大昌市 · 步行街',
  scene: 'street_dawn', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 86 }],
  lines: [
    narr('你转过身。'),
    narr('“王珊珊。”'),
    narr('没有人回答。'),
    narr('张伟停下脚步，回头看你。'),
    say('张伟', '……你叫谁？'),
    narr('你数了一遍。'),
    narr('一，二，三，四，五，六。'),
    narr('六个人。'),
    narr('可你记得，刚才在这条街上，你数到过七道影子。'),
    narr('——第七道，一直跟在你身后。'),
    narr('你慢慢地转过身。'),
    narr('晨光里，站着一个女孩。'),
    narr('练过舞蹈，腰很细，腿很长。'),
    narr('后颈上有一个青黑色的手印。'),
    narr('她对你笑了一下。'),
    say('王珊珊', '杨间。'),
    say('王珊珊', '你怎么才来？'),
    narr('你低头看那张人皮纸。'),
    narr('上面多了一行新字，墨迹还没干。'),
    { who: '', text: '“五点三十一分，一共八个。”', style: 'blood' },
    narr('现在，你终于知道它把谁算进去了。')
  ],
  ending: 'e_eighth'
});

/* ---------------- 尾声（真结局的最后一幕） ---------------- */
nd('g8', {
  pace: 'still',
  chapter: '尾声 · 三天后', place: '第七中学 · 校门外',
  scene: 'classroom_after', mood: 'dawn',
  cast: [],
  lines: [
    narr('三天后。'),
    narr('第七中学封了校。铁门拉着警戒线，警车停在路边，穿制服的人进进出出。'),
    narr('你混在围观的人群里，抬头看了一眼那栋楼。'),
    narr('高三（二）班的窗户开着，风把窗帘吹了出来。'),
    narr('黑板上的三句话还在。'),
    { who: '', text: '没有人擦掉它们。', style: 'em' },
    narr('你把口袋里的东西数了一遍：七八台手机，一台卫星电话，一张人皮纸。'),
    narr('天很蓝。'),
    narr('蓝得让人觉得，前天晚上什么都没有发生过。'),
    narr('你把帽檐压低了一点，转身走进人流。')
  ],
  ending: 'e_true'
});


/* =========================================================
   缓冲节点 · 第十三下（敲门上限的最后一扇门）
   ---------------------------------------------------------
   由引擎 forcedTarget() 强制转入（标准档 knock ≥ 13）。
   出口必须回到"被打断的那个节点"：引擎在转场前写 state.flags.__k13_back。
   若引擎没写（例如旧存档），退回 d4 兜底。
   ========================================================= */
nd('k13', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 走廊',
  scene: 'void_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    { who: '', text: '敲门声停了。', sfx: 'knockSingle' },
    narr('停在第十三下。'),
    narr('不是走了。'),
    narr('是手已经按在门上，不用再敲了。'),
    narr('门缝下面有一道光，很细，慢慢变宽。'),
    narr('我听见自己的呼吸。太响了。'),
    { who: '', text: '（他知道我在里面。）', style: 'em' }
  ],
  observe: [
    { id: 'o_k13_dust', label: '门缝下的灰', x: 48, y: 58, light: 1, risk: 2,
      text: '门缝下面的灰里有一个鞋印，很浅。鞋尖朝外，说明他刚才转过身去了。我又看了一眼，鞋尖已经朝着门了。灰是干的，凉得像铁。',
      effects: { clues: ['knock_rule'], flags: { saw_k13_print: true } } }
  ],
  choices: [
    { text: '屏住呼吸，一动不动。', next: 'k13_pass', when: { clue: 'knock_rule' },
      lockedHint: '我还不知道怎么让他以为这间屋子是空的',
      effects: { stats: { knock: -3, clock: 20, survivors: -1 }, toast: '代价 · 他走过去了，但少了一个人', toastKind: 'warn' } },
    { text: '把手机音量开到最大。', next: 'k13_loud', effects: { stats: { knock: 5 } } },
    { text: '推开门。', ending: 'e_door' }
  ]
});

nd('k13_pass', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 走廊',
  scene: 'void_dark', mood: 'void',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('脚步声从门口过去。'),
    narr('一步。两步。三步。'),
    narr('它没有停。'),
    narr('我贴在地上，听见有人在我旁边也在喘——不是我的。'),
    narr('后来我数人，才知道少的是谁。')
  ],
  /* 回到"被打断的那个节点"：引擎在转场前应写 state.flags.__k13_back。
     没人写的时候退回本幕幕首（晕过去、丢了一段记忆），再不行退回 d4。
     两条兜底都不会把玩家送进死路，也不会让时间倒流。 */
  route: s => {
    const back = s.flags.__k13_back;
    if (back && STORY.nodes[back]) return back;
    const act = s.actStart;
    if (act && STORY.nodes[act]) return act;
    return 'd4';
  }
});

nd('k13_loud', {
  chapter: '第三幕 · 黑暗', place: '第七中学 · 走廊',
  scene: 'void_dark', mood: 'blood',
  cast: [{ id: 'yangjian_eye', pos: 'right', scale: 88 }],
  lines: [
    narr('我把音量按到最大。'),
    narr('那段敲门声从口袋里响起来，一长两短。'),
    narr('门缝下的光停了。'),
    narr('然后，光从缝里退了出去。'),
    narr('不是被盖住，是有人弯下腰，把眼睛贴在缝上。'),
    { who: '', text: '他听见我了。', style: 'blood', fx: 'flash', sfx: 'scare' }
  ],
  ending: 'e_door'
});

/* =========================================================
   理智断片（sanity <= 0 时由引擎转入，每幕最多一次）
   ---------------------------------------------------------
   引擎在转场前已经结算：sanity = 40、clock +30、写 __sanity_back。
   所以这个节点**不要再结算那三项**，否则会翻倍。它只负责：
     1) 把「第二次的门」这条档案挂上来（原来挂在已删除的周目内容上）；
     2) 把玩家送回被打断的那个节点。
   ========================================================= */
nd('sanityBreak', {
  chapter: '第三幕 · 黑暗', place: '第七中学',
  scene: 'corridor_dark', mood: 'void',
  cast: [{ id: 'yangjian', pos: 'right', scale: 88 }],
  enter: { codex: ['m_second_time'] },
  lines: [
    { who: '', text: '……', fx: 'flash' },
    narr('我睁开眼。'),
    narr('光是从同一个角度照进来的。墙上的水渍是同一个形状。'),
    narr('我回到了刚才那一格台阶。'),
    { who: '', text: '——但我不记得自己是怎么回来的。', style: 'em' },
    narr('我低头看自己的手。手在抖。'),
    narr('刚才那一段，像被人从中间剪掉了一截。'),
    narr('这一次，我至少可以先看看它。')
  ],
  route: s => s.flags.__sanity_back || s.actStart || 'p3'
});
