/* =========================================================
   恐怖复苏 · 敲门  —  世界设定、人物、档案、结局
   以及 第一幕、第二幕 剧情节点
   ========================================================= */
'use strict';

/* ---------------- 人物 ---------------- */
const CHARACTERS = {
  yangjian:     { name: '杨间',   kind: 'human', art: 'yangjian' },
  yangjian_eye: { name: '杨间',   kind: 'human', art: 'yangjian_eye' },
  zhangwei:     { name: '张伟',   kind: 'human', art: 'zhangwei' },
  miaoshan:     { name: '苗小善', kind: 'human', art: 'miaoshan' },
  wangshanshan: { name: '王珊珊', kind: 'human', art: 'wangshanshan' },
  zhouzheng:    { name: '周正',   kind: 'human', art: 'zhouzheng' },
  fangjing:     { name: '方镜',   kind: 'human', art: 'fangjing' },
  laoren:       { name: '老人',   kind: 'ghost', art: 'laoren' },
  guiying:      { name: '鬼婴',   kind: 'ghost', art: 'guiying' },
  xulaoshi:     { name: '徐老师', kind: 'human', voice: true },

  /* 无立绘的“声音”角色：只出现在台词里 */
  leidian:      { name: '雷电法王', kind: 'human', voice: true },
  operator:     { name: '接线员',   kind: 'human', voice: true },
  zhaolei:      { name: '赵磊',     kind: 'human', voice: true },
  qianwanhao:   { name: '钱万豪',   kind: 'human', voice: true },
  duanpeng:     { name: '段鹏',     kind: 'human', voice: true },
  sulei:        { name: '苏蕾',     kind: 'human', voice: true },
  sunren:       { name: '孙仁',     kind: 'human', voice: true },
  liuqi:        { name: '刘奇',     kind: 'human', voice: true }
};

/* ---------------- 档案 ---------------- */
const CODEX = {
  clue: [
    { id: 'knock_rhythm', name: '一长两短', text: '咚——咚咚。敲门声有着固定的节奏：一长，两短，再隔一会儿，重复。像有人在门外数着什么。', links: ['knock_rule', 'audio_trap'] },
    { id: 'knock_rule', name: '敲门的时间', text: '老人不会推门。他只是在门外敲。在论坛那个故事里，他敲了很久之后才进来——所以敲门本身，是在计时。', links: ['knock_rhythm', 'no_answer'] },
    { id: 'ghost_domain', name: '鬼域', text: '被鬼影响、扭曲、独占的空间。鬼域内的时间、距离、光线都不正常，活人极易迷路。能走出鬼域的，只有另一个鬼域。', links: ['no_basement', 'only_ghost'] },
    { id: 'ghost_dead', name: '鬼无法被杀死', text: '周正在黑板上写下的第一句话。刀、火、子弹、核武，对鬼都没有意义。', links: ['only_ghost', 'find_rule'] },
    { id: 'only_ghost', name: '能对付鬼的只有鬼', text: '周正在黑板上写下的第二句话。想活命，只能借另一种更可怕的东西。', links: ['ghost_dead', 'eye_rule'] },
    { id: 'find_rule', name: '洞察鬼的规律', text: '周正在黑板上写下的第三句话。每种鬼都有固定的杀人方式，像程序。找到它，才有活路。', links: ['ghost_dead', 'ghost_domain'] },
    { id: 'photo', name: '老人照片', text: '论坛里那张照片：黑色长衫，褐色皮肤，尸斑，一只死灰、空洞的眼睛。看照片不会招来他——这一点后来被证实了。', links: ['audio_trap'] },
    { id: 'audio_trap', name: '会招鬼的音频', text: '那段录音里的敲门声是一个坐标。听过的人，会被他找上门。发帖的人其实早就死了——后半段是鬼在打字。', links: ['knock_rhythm', 'forum_trap'] },
    { id: 'forum_trap', name: '整个帖子都是陷阱', text: '雷电法王在“第一道门”被敲响时就已经死了。之后那些错字、那半小时的停顿、那个留在楼里的号码，都不是人留下的。', links: ['audio_trap', 'phone_ring'] },
    { id: 'phone_ring', name: '被接通的电话', text: '电话能打出去，却没有人声。铃声会在学校某处响起，然后被“接起”。接起之后，敲门声会从听筒里传出来。', links: ['no_answer', 'forum_trap'] },
    { id: 'no_answer', name: '不能接的电话', text: '来电显示可以是任何人：138……、王老师、你自己的号码。接通的不是线路，是门。', links: ['phone_ring', 'knock_rule'] },
    { id: 'no_basement', name: '没有地下室', text: '教学楼只有五层。可你数着台阶往下走，已经走过了七层、八层——脚下还在继续。', links: ['ghost_domain', 'drip'] },
    { id: 'drip', name: '滴水声', text: '厕所的水龙头没关紧。嘀嗒，嘀嗒。在这片鬼域里，它是唯一不会骗人的方位。', links: ['no_basement', 'ghost_slave'] },
    { id: 'battery', name: '只剩 7%', text: '手机电量所剩无几。那盏灯是你唯一能看破黑暗的东西，也是一只随时会熄灭的眼睛。', links: ['eye_rule'] },
    { id: 'ghost_slave', name: '鬼奴', text: '周正说：在鬼域里被厉鬼杀死的人，会变成受它驱使的鬼奴。它们不是人，也不是完整的鬼，只是手。', links: ['ghost_domain', 'drip'] },
    { id: 'eye_rule', name: '眼睛与鬼域', text: '眼睛越多，红光照得越远。红色光芒覆盖的地方，就是属于你的鬼域——但要撑开它，需要六只。', links: ['only_ghost', 'ghost_slave'] },
    { id: 'fangjing_future', name: '方镜知道未来', text: '他知道今晚会发生什么，知道你未来会杀了他。那些信息来自一张人皮纸。', links: ['paper_rule'] },
    { id: 'paper_rule', name: '会自己写字的纸', text: '纸上的字会自己消失，也会自己长出来。它换一个主人，就抹掉上一个主人的字。它写下的“未来”，未必是未来。', links: ['fangjing_future', 'eighth'] },
    { id: 'guiying_mark', name: '青黑手印', text: '鬼婴留在王珊珊后颈上的手掌印。青黑色正沿着皮肤蔓延——像传染，也像记号。', links: ['ghost_slave', 'eye_rule'] },
    { id: 'eighth', name: '第八个人', text: '五点三十一分，八个人离开了高校。可班里原本有四十几个人。', links: ['paper_rule'] },
    /* ---- 第四幕之后的新增观察点带出的线索（见 gdd §4.2 / §12） ---- */
    { id: 'saw_sixth', name: '第六只还没有睁眼', text: '手臂上的五只眼睛都睁着，深浅不一。第六只闭在更深的地方，眼皮底下有东西在动。\n\n它不是长出来的。我在它那个位置按了一下，它往里缩了缩，像在躲。', links: ['eye_rule', 'eighth'] },
    { id: 'wang_no_shadow', name: '没有影子的人', text: '晨光把所有人的影子都拉得很长，只有她没有。\n\n她抓着我的袖子，指节是白的。她还在跟我说谢谢。', links: ['eighth', 'guiying_mark'] },
    { id: 'watch_eight', name: '表背面的 8', text: '苗小善的卡通表停在四点零五分，秒针一直在抖，不走。\n\n背面有一个用圆珠笔写的「8」，笔画很用力，像写的时候手在抖。她说她不记得写过。', links: ['eighth', 'knock_rule'] },
    { id: 'counted_steps', name: '十二块地砖', text: '他走过的地方，水渍干了，灰也没了——不是踩脏，是被收走。\n\n我数了数：十二块干净的地砖，一块挨着一块。他还要再走一步。', links: ['knock_rule', 'knock_rhythm'] }
  ],

  ghost: [
    { id: 'g_qiaomen', name: '鬼敲门', en: 'KNOCKING · A', text: '身穿黑色长衫的老人，浑身尸斑，眼珠死灰。他极少奔跑，只是一步一步地走，像在散步，也像在收租。\n\n国际刑警档案：代号「鬼敲门」，恐怖程度：A，灾难级。\n\n规则：敲门——一长两短，固定频率。他不推门，只等门里的人自己把门打开。他敲第一道门的时候，门后就已经有人死了。\n\n他的鬼域会腐蚀一切：墙皮剥落、书本腐烂、水泥风化，整座学校都沉在里面。\n\n传播方式只有声音：听过那段敲门声的人，都会被他找上门。照片不会。' },
    { id: 'g_guiying', name: '鬼婴', en: 'INFANT', text: '从周正腹中爬出的青黑色婴儿，四肢细长，眼睛漆黑无瞳，能像蜘蛛一样贴墙爬行。\n它会成长。接触过它的人，身上会留下青黑色的手印。' },
    { id: 'g_guiyan', name: '鬼眼', en: 'GHOST EYE', text: '藏在鬼域深处的一颗红色眼珠。它钻入皮肉，在身体上睁开。\n它能看破黑暗与幻象；每被刺激一次，就会多睁开一只。\n眼睛越多，它复苏得越快——直到它成为这具身体的主人。' },
    { id: 'g_shadow', name: '树上的黑影', en: 'SHADOW', text: '白骨树上倒挂着一个四米高、没有面孔的影子。胸口钉着一根锈迹斑斑的棺材钉，黑色的血一滴一滴落下。\n你有一种直觉：它比门外那个老人，更不该被惊醒。' },
    { id: 'g_hand', name: '惨白的手', en: 'THE HAND', text: '从厕所门后伸出的手，冰冷、僵直、力大无穷。被它抓住的地方会一寸寸失去知觉。\n它是鬼奴——死在这片鬼域里的人留下的东西。' }
  ],

  person: [
    { id: 'p_yangjian', name: '杨间', en: 'YANG JIAN', text: '大昌市第七中学高三学生。父母普通，家住城东，租的房子。\n成绩中等，话不多，看事情时比同龄人冷静得可怕——方镜说，这叫“天赋”。' },
    { id: 'p_zhangwei', name: '张伟', en: 'ZHANG WEI', text: '杨间的同桌，绰号“阳痿”，英文名沃德吉尔·英邦邦。\n嘴碎、怕死、爱吹牛，但在真正要命的时候，他从没丢下过谁。' },
    { id: 'p_miaoshan', name: '苗小善', en: 'MIAO XIAOSHAN', text: '杨间的同桌。从初中就认识，安静，记性好，手腕上戴着一块卡通表。\n她是那种会在所有人都慌掉的时候，还记得提醒你“刚才电话还能打通”的人。' },
    { id: 'p_wangshanshan', name: '王珊珊', en: 'WANG SHANSHAN', text: '同班同学，练过舞蹈，腰细腿长。\n鬼婴在她后颈留下了一个青黑色的手印。从那以后，她总是下意识地贴着杨间走。' },
    { id: 'p_zhouzheng', name: '周正', en: 'ZHOU ZHENG', text: '隶属亚洲分区的国际刑警，代号“鬼婴”。\n消瘦得只剩骨头，风衣下却挺着一个鼓起的肚子。他是驭鬼者——用鬼的力量对付鬼，也被鬼一点点吃掉。' },
    { id: 'p_fangjing', name: '方镜', en: 'FANG JING', text: '同班同学。今晚之前，他只是个普通学生。\n今晚之后，他成了一个知道“未来”的人——并且认定，未来的杨间会杀死他。' },
    { id: 'p_xulaoshi', name: '徐老师', en: 'TEACHER XU', text: '高三班主任。第一个在鬼域里消失的人。\n她只是打开后门，走出去看了一眼。' }
  ],

  memory: [
    { id: 'm_531', name: '五点三十一分', text: '“五点三十一分：我活下来了……一共八个，我离开了高校……嘿嘿。”\n——羊皮纸上最后一行字。那个笑脸，你不确定是谁画的。' },
    { id: 'm_english', name: '沃德吉尔·英邦邦', text: '张伟的英文名。他说这是他在补习班学到的。\n后来他坚持用它来验证你是不是鬼——并且认为这是一个绝妙的暗号。' },
    { id: 'm_letter', name: '遗书', text: '“如果通讯断了，就说明我已经死了。遗书还请替我转交给我父母。就这样，我要开始行动了。”\n——周正，对着卫星电话说的最后一句话。' },
    { id: 'm_handprint', name: '她的手', text: '王珊珊抓住你胳膊的时候，力气大得不像一个刚被勒住脖子的人。\n她没有说谢谢。她只是一直没有松手。' },
    { id: 'm_paper_you', name: '纸上的你', text: '“我叫杨间，当你看到这封信的时候我已经死了，我是十年后的你……”\n你看着那行字一笔一划地长出来，像有人在纸的背面，用你的笔迹，写着你的死。' },
    { id: 'm_second_time', name: '第二次的门', text: '你回到了同一个夜里。\n\n床、充电线、屏幕上那个标题很朴素的帖子，全都在原位。你知道录音里有什么，知道走廊尽头有什么，知道五点三十的时候会发生什么。\n\n知道这些没用。门还是那扇门，它等的从来不是"不知情的人"。\n\n——但这一次，你至少可以先低头，看看自己的手。' }
  ]
};

/* 主线推理链：档案里按顺序显示，用来把散落的线索连成"你是怎么想明白的"。
   每一步挂 1–2 条线索；线索齐了这一步才会点亮。 */
const CLUE_CHAIN = [
  { step: '声音是坐标', clues: ['knock_rhythm', 'audio_trap'], note: '听过的人，会被找上门' },
  { step: '他不推门，只等人开门', clues: ['knock_rule', 'no_answer'], note: '门开了，他才进来' },
  { step: '跑不出去', clues: ['ghost_domain', 'no_basement'], note: '整栋楼都在鬼域里' },
  { step: '鬼域只能用鬼域破', clues: ['only_ghost'], note: '周正写在黑板上的第二句' },
  { step: '凑够六只眼睛', clues: ['eye_rule'], note: '咬下一只，吞下去' },
  { step: '那张纸在撒谎', clues: ['paper_rule'], note: '它写着"一共八个"' }
];
window.CLUE_CHAIN = CLUE_CHAIN;

/* ---------------- 结局 ---------------- */
const ENDINGS = [
  { id: 'e_door', no: 1, name: '门后的第十三次', kicker: '结局 · 一', hint: '你听见了敲门声，你选择了等待。',
    body: '敲门声在第十三次之后停了。\n\n你抬起头，门开着。走廊里空无一人，只有一盏灯在很远的地方亮着，像一只没有闭合的眼睛。\n\n后来警方在第七中学的教室里找到了四十多具尸体。他们的死状一模一样：睁着眼睛，张着嘴，脸上没有任何表情。\n\n卷宗最后一页写着四个字：暂无凶手。' },
  { id: 'e_stairs', no: 2, name: '永远的五楼', kicker: '结局 · 二', hint: '有些楼梯，是没有尽头的。',
    body: '你数到了第十七层。\n\n脚下还有台阶。\n\n你停下来，听见自己的呼吸在楼道里撞出回声——不止一个。有人在上一层跟着你，也有人在下一层等着你。\n\n天亮的时候，救援队在教学楼里什么都没找到。只在三楼半的楼梯拐角，发现了一只磨破的校鞋。\n\n它朝下的方向。' },
  { id: 'e_alone', no: 3, name: '一个人走出校门', kicker: '结局 · 三', hint: '你活下来了，代价是别的。',
    body: '你一个人走出了鬼域。\n\n校门外的天已经亮了，马路上有早班的公交车驶过，车窗里的人都低着头看手机。没有人抬头看你。\n\n你回头望了一眼第七中学。教学楼安静、干净，像什么都没发生过。\n\n你把手插进口袋里，摸到一颗还在跳动的、温热的东西。你决定不看它。\n\n从那天起，你再也没有听见过敲门声。但每个夜里，你都会醒一次。' },
  { id: 'e_absorb', no: 4, name: '成为鬼', kicker: '结局 · 四', hint: '你以为你在驾驭它。',
    body: '最后一只眼睛在额头上睁开的时候，你已经不太记得自己叫什么了。\n\n你记得黑板上的三句话，记得一长两短的节奏，记得有人在你耳边喊“杨间”。\n\n但那声音越来越远，像隔着很深的水。\n\n第二天，第七中学多了一条传闻：夜里有学生在空教室里听见脚步声，跟着走，就会走到一片永远走不出去的走廊。\n\n那里有个人，一直在找门。' },
  { id: 'e_eighth', no: 5, name: '第八个人', kicker: '结局 · 五', hint: '七道影子，六个人。',
    body: '五点三十一分，红光熄灭。\n\n你们落在步行街的砖地上。你数了三遍：六个人。\n\n可你记得很清楚——在红光熄灭前的最后一秒，王珊珊就站在你身后。她朝你伸着手。\n\n你没有拉住。\n\n她低下头，看着自己的手，好像也不明白为什么没有抓住。\n\n后来你翻开人皮纸。上面写着：一共八个。\n\n现在你知道它把谁算进去了。\n\n——很多年后，你在另一座城市的街上，看见一个练过舞蹈的女人背影。她转过身，后颈上有一个青黑色的手印。\n\n她问你：杨间，你怎么才来？' },
  { id: 'e_written', no: 6, name: '被写下的人', kicker: '结局 · 六', hint: '纸上写着你会死。你信了。',
    body: '你把那张人皮纸贴在心口，按照它说的做。\n\n凌晨五点三十分，最后一扇门在你面前打开。你走进去，门在身后合拢，声音很轻，像纸翻过一页。\n\n纸上的字迹慢慢变了。\n\n“六月二十二日凌晨五点三十分，杨间死了。”\n\n“六月二十二日，我们捡到了一张新的人皮纸。”\n\n“它说，它叫杨间。”' },
  { id: 'e_true', no: 7, name: '五点三十一分', kicker: '结局 · 七', hint: '活着，并且带着人一起。',
    body: '你咬下了手臂上的那只眼睛。\n\n血腥味在嘴里炸开的时候，你想起了周正肚皮里的鬼婴，想起了方镜的冷笑，想起了几十个同学。\n\n然后，红光亮了起来。\n\n不是灯，不是手机，是从你裂开的皮肤下面透出来的光。黑暗像水一样退开，惨白的手一根根缩了回去。那个穿黑衫的老人停下脚步，第一次，往后退了一步。\n\n五点三十一分。\n\n你们落在大昌市步行街的砖地上。天快亮了，路灯还没熄。张伟坐在地上哭，苗小善抱着膝盖，王珊珊抓着你的胳膊不肯松手。\n\n你数了一遍：七个人。张伟，苗小善，赵磊，孙仁，刘奇，王珊珊，还有你。\n\n人皮纸上写着“一共八个”。你又数了一遍，还是七个。\n\n你决定，不再数第四次。\n\n——第一卷 · 完——' }
];

/* ---------------- 节点容器 ---------------- */
const START = {
  meta: { start: 'act1', startClock: '22:10' },
  nodes: {}
};
window.STORY = START;

function nd(id, obj) {
  obj.id = id;
  START.nodes[id] = obj;
  return obj;
}
window.nd = nd;

const narr = (text, o = {}) => Object.assign({ who: '', text }, o);
const say = (who, text, o = {}) => Object.assign({ who, text }, o);

/* =========================================================
   第一幕 · 论坛
   ========================================================= */
nd('act1', {
  actCard: { id: 'act1', kicker: '序幕', title: '论坛里的鬼故事', sub: '六月二十日 · 深夜 · 22:10' },
  chapter: '序幕 · 论坛', place: '大昌市 · 城东出租屋',
  scene: 'room_night', mood: '',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  enter: { codex: ['p_yangjian'] },
  lines: [
    narr('六月二十日，夜里十点十分。'),
    narr('你叫杨间，大昌市第七中学高三学生。这个时间，你本该在背英语单词，但你躺在床上，侧着身，手机连着充电线——像全国所有高三学生一样，用最后一点自由换取一点睡意。'),
    narr('屏幕的光把你的脸照得发青。你随手点开一个点击率很高的帖子。'),
    narr('标题很朴素：*我是某省第三中医院的一名坐诊医生，和你们说一件事。*'),
    narr('楼主网名叫“雷电法王”。'),
    say('杨间', '~又是标题党。~'),
    narr('你往下翻，回帖一水的插科打诨。你点了“只看楼主”，屏幕一下子干净了。'),
  ],
  choices: [
    { text: '往下读。反正也睡不着。', next: 'p2' },
    { text: '关掉手机。明天还要早起。', next: 'p2b', effects: { flags: { reluctant: true } } }
  ]
});
nd('p2b', {
  chapter: '序幕 · 论坛', place: '大昌市 · 城东出租屋',
  scene: 'room_night',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('你把手机扣在胸口，闭上眼睛。'),
    narr('黑暗里，空调外机在响，楼下有人在吵架，远处一辆洒水车唱着走调的歌开过去。'),
    narr('三分钟以后，你又把手机翻了过来。'),
    say('杨间', '~就看一眼。~'),
    narr('——人总是这样，越不该看的东西，越想知道它写了什么。')
  ],
  next: 'p2'
});

nd('p2', {
  chapter: '序幕 · 论坛', place: '外省 · 第三中医院 · 急诊室外',
  scene: 'hospital', mood: '',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('雷电法王说，上个礼拜轮到他值夜。'),
    narr('十一点多，救护车送来一个老人——从五楼掉下来的。人早没气了。'),
    narr('可是尸体的温度不对。那晚二十二度，老人的体温比常温低了十度不止。以他的经验，这个老人死了不止一天。'),
    narr('“我当时就报了警。”'),
    narr('帖子断在这里，更新在两小时之后。'),
    say('雷电法王', '“抱歉，刚才有人敲门，问了一下那件事的情况。不是警察，也不像记者，但有国家的证件，说是什么刑警。”'),
    narr('你的手指停在屏幕上。'),
    say('杨间', '~刑警？~')
  ],
  observe: [
    { id: 'o_temp', label: '尸温', x: 23, y: 50,
      text: '“死后十小时，常温下一个小时降一度。”\n\n他算得很仔细，仔细得不像一个只想讲鬼故事的人。',
      effects: { clues: ['photo'] } },
    { id: 'o_doctor', label: '发帖时间', x: 41, y: 24,
      text: '这条更新比上一条晚了两个小时。\n\n两个小时里，他遇到了一个自称刑警的人。那个人，后来你在讲台上见到了。',
      effects: { clues: ['phone_ring'] } }
  ],
  choices: [
    { text: '继续往下翻。', next: 'p3' }
  ]
});

nd('p3', {
  chapter: '序幕 · 论坛', place: '外省 · 第三中医院 · 停尸间',
  scene: 'morgue', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('第二天上午，医院的人说：停尸房里那具老人的尸体，不见了。'),
    narr('监控全调了出来，没找到尸体，也没找到人。'),
    narr('有个病人说，他看见那个老人自己走出了停尸间。护士长说，神经科的方医生准备给这位病人加大用药量。'),
    narr('“果然，没有相信那位病人的话是正确的。”'),
    narr('帖子又断了一下。'),
    say('雷电法王', '“但我要说的不是这个，而是晚上我坐诊的时候，发生的一件事情。”'),
    { who: '', text: '你咽了口唾沫，把被子往上拉了拉。', fx: 'dread' }
  ],
  next: 'p4'
});

nd('p4', {
  chapter: '序幕 · 论坛', place: '外省 · 第三中医院 · 急诊室外',
  scene: 'hospital', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('凌晨两点一刻，他在急诊室里打游戏，突然感觉到一股寒意——和停尸间里那种感觉一模一样。'),
    narr('他抬起头。'),
    narr('那个已经死了两天的老人，正一步一步，从急诊室门外走过去。'),
    narr('他拍了照。照片就在帖子下面。'),
    narr('照片是清晰的。隔着玻璃窗，一个穿黑色连体长衫的老人，干瘦，皮肤呈褐色，斑斑点点。'),
    narr('他的一只眼睛露在镜头里。'),
    { who: '', text: '*死灰，空洞，没有一丝神采，带着一种骇然的死寂。*', style: '', fx: 'ghost' },
    say('杨间', '~……~'),
    narr('你盯着那张照片，看了很久。'),
    narr('越看，越觉得那不是一张照片，而是一扇窗。窗子那边，有什么东西，正好也朝这边看。')
  ],
  observe: [
    { id: 'o_eye', label: '那只眼睛', x: 22, y: 38,
      text: '照片上只有一只眼睛是清楚的。另一只藏在阴影里。\n\n你忽然想到——他为什么只露一只？',
      effects: { clues: ['photo'], codex: ['g_qiaomen'] } },
    { id: 'o_spots', label: '尸斑', x: 24, y: 56,
      text: '褐色皮肤上的斑点，是尸斑。\n\n尸斑只长在死人身上。这是一具尸体。一具会走路的尸体。',
      effects: { clues: ['photo'] } }
  ],
  choices: [
    { text: '往下翻，看看楼主还说了什么。', next: 'p5' }
  ]
});

nd('p5', {
  chapter: '序幕 · 论坛', place: '大昌市 · 城东出租屋',
  scene: 'room_night', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('帖子继续。'),
    say('雷电法王', '“等等，好像又有人在敲门。估计是警察找我录口供，我去去就回。”'),
    narr('一分钟之后，他又发了：'),
    say('雷电法王', '“该死的，该死的，是那个从医院跑出去的那个老人，那东西站在我家门口敲门，我在猫眼里看的清清楚楚，现在我怎么办？”'),
    narr('“我报警了，可是现在怎么办？那东西还在敲门。”'),
    narr('“不好，刚才我家客厅的灯突然熄灭了。”'),
    narr('“我客厅里传来了脚步声……我不敢开门。”'),
    narr('“脚步声走到了我的房门外，停了下来。”'),
    narr('“我把声音录下来了。如果我出事了，请好心人报警：138……”'),
    narr('下面挂着一个音频文件。')
  ],
  choices: [
    { text: '点开那个音频。', next: 'p6', tell: { pre: '耳机线在桌上轻轻弹了一下，像有人从另一头拽了拽。' }, effects: { flags: { listened: true }, items: { audio: 1 }, stats: { knock: 4, battery: -10, sanity: -8 }, clues: ['audio_trap', 'knock_rhythm'], codex: ['g_qiaomen'], fx: 'ghost' }, toast: '你听见了敲门声', toastKind: 'warn' },
    { text: '不点。把手机扣在枕头上。', next: 'p6b', effects: { flags: { no_listen: true }, stats: { sanity: 3 } } },
  ]
});

nd('p6', {
  chapter: '序幕 · 论坛', place: '大昌市 · 城东出租屋',
  scene: 'room_night', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    { who: '', text: '咚——咚咚。', sfx: 'knock', fx: 'shake' },
    narr('手机的外放不大，那个声音却像直接敲在你的胸腔上。'),
    { who: '', text: '咚——咚咚。', sfx: 'knock' },
    narr('一长，两短。间隔精确得像有人在用秒表计时。'),
    narr('录音里能听见医生的呼吸，越来越急；能听见他挪动椅子的声音；能听见——'),
    narr('门把手转动的声音。'),
    narr('然后录音断了。'),
    say('杨间', '~……假的吧。~'),
    narr('你退出播放，翻到帖子的最后一行。'),
    { who: '', text: '“那老人进来了……”', fx: 'flash', style: 'blood' }
  ],
  next: 'p7'
});

nd('p6b', {
  chapter: '序幕 · 论坛', place: '大昌市 · 城东出租屋',
  scene: 'room_night', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('你没敢点。你只是把帖子翻到最后。'),
    narr('最后一行写着：'),
    { who: '', text: '“那老人进来了……”', fx: 'flash', style: 'blood' },
    narr('下面挂着一个音频文件，播放量是四万七千。'),
    say('杨间', '~四万七千个人听过了。~'),
    narr('你忽然觉得，那个数字不太对劲。'),
    narr('——四万七千个人，听见了同一种敲门声。'),
    narr('你没有点开它。'),
    narr('你把手机扣在胸口，盯着天花板。'),
    narr('四万七千。'),
    narr('这个数字在你脑子里转了很久。'),
    narr('你没有听见那个声音。'),
    narr('你是安全的。'),
    narr('你这样告诉自己。'),
    { who: '', text: '可是那一夜，你一直睁着眼睛，等自己的门被敲响。', style: 'whisper' }
  ],
  next: 'p7'
});

nd('p7', {
  chapter: '序幕 · 论坛', place: '大昌市 · 城东出租屋',
  scene: 'room_night', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'right', scale: 86 }],
  lines: [
    narr('帖子到这里就结束了。'),
    narr('你翻了翻回复，最新的一条是三天前的：“楼主还在吗？”'),
    narr('没有人回答。'),
    narr('你把手机扣在枕头上，闭上眼。'),
    narr('黑暗里，你数了数自己的心跳。'),
    narr('一下，两下，三下。'),
    narr('——在三下之后，你听见楼下单元门响了一声。'),
    narr('有人进来了。'),
    narr('很慢的脚步声，一层一层，往上走。'),
    say('杨间', '~只是邻居。~'),
    narr('脚步声在你的楼层停了几秒。然后继续往上。'),
    narr('你睁开眼，盯着天花板，一直到天亮。'),
    { who: '', text: '你没敢告诉任何人：那天晚上，你一直在等自己的门被敲响。', style: 'whisper' }
  ],
  next: 'act2'
});

/* =========================================================
   第二幕 · 晚自习
   ========================================================= */
nd('act2', {
  actCard: { id: 'act2', kicker: '第一幕', title: '临时讲课', sub: '六月二十一日 · 20:00 · 第七中学 高三（二）班' },
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom_early', mood: '',
  cast: [{ id: 'yangjian', pos: 'center', scale: 88 }, { id: 'zhangwei', pos: 'right', scale: 86 }],
  enter: { codex: ['p_zhangwei'] },
  lines: [
    narr('第二天，你顶着一对黑眼圈去上学。'),
    narr('整整一天，你都在打哈欠。可每次快要睡着，那张照片就会浮出来——一个穿黑衫的老人，站在玻璃窗外，一只死灰的眼睛。'),
    narr('晚自习八点。教室里闷热，风扇转得有气无力。'),
    say('张伟', '嘿，嘿嘿，杨间，借一部说话。'),
    narr('你侧过头。张伟，你的同桌，绰号“阳痿”——高一入学点名时，老师把他名字念成了“杨伟”，这个绰号就跟他跟了三年。'),
    say('杨间', '阳痿，什么借一部说话。'),
    say('张伟', '别装了，看你一整天打哈欠，昨晚肯定做羞羞的事情了。有什么好资源，赶紧分享。'),
    say('杨间', '爽你个头。我昨晚看了一个鬼故事，看晚了。'),
    say('张伟', '鬼故事？说到鬼故事——你们知道前阵子市里一个小区的事么？一夜之间二十几个人集体上吊，挂在防盗窗上，跟晒腊肉一样。'),
    narr('他掏出手机，翻出一张照片。'),
    narr('照片是傍晚拍的，光线很暗。阳台的防盗窗上，密密麻麻挂着一排人形。'),
    narr('最奇怪的是——脑袋在防盗窗里面，身体在下面。防盗窗的空隙，根本容不下一个成年人穿过去。'),
    narr('而且每一颗脑袋都向后仰着，脖子像是被折断了。'),
    { who: '张伟', text: '对了……昨晚那个帖子，我也看了。', when: { flag: 'no_listen' } },
    { who: '张伟', text: '……算了，没什么。', when: { flag: 'no_listen' } }
  ],
  observe: [
    { id: 'o_neck', label: '折断的脖子', x: 52, y: 58,
      text: '所有尸体的脸都朝着同一个方向。\n\n不是楼下，是楼上。',
      effects: { clues: ['ghost_domain'] } },
    { id: 'o_window', label: '防盗窗', x: 60, y: 62,
      text: '人是怎么从那个空隙里出去的？\n\n除非，他们不是“出去”的。',
      effects: { clues: ['find_rule'] } }
  ],
  choices: [
    { text: '把照片仔细看一遍。', next: 'p8', effects: { clues: ['ghost_dead'] } },
    { text: '把手机推回去。“别看了，晦气。”', next: 'p8' }
  ]
});

nd('p8', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom_early',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'miaoshan', pos: 'right', scale: 86 }],
  enter: { codex: ['p_miaoshan'] },
  lines: [
    say('苗小善', '你们说，这些东西到底是真的还是假的啊？'),
    narr('苗小善从前面探过头来。她是你的同桌，初中就认识，手腕上戴着一块卡通表。'),
    say('杨间', '网上的故事大多数是假的。除非亲眼见到，否则我不信这世上有鬼。'),
    say('杨间', '……不过真碰上了，还是离远一点比较好。'),
    say('苗小善', '说得也是。'),
    narr('教室的门被推开。班主任徐老师大步走进来。'),
    say('徐老师', '都别说话了。校方临时通知，今天晚自习改成安全宣传课。待会儿讲课的时候，我不希望听到任何人讲话。'),
    say('徐老师', '下面有请周正周先生为我们讲课。大家鼓掌欢迎。')
  ],
  choices: [
    { text: '鼓掌，同时打量这个“周先生”。', next: 'p9' }
  ]
});

nd('p9', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom_early', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('走进来的人穿着灰色风衣，把身体裹得严严实实，还戴着口罩——这可是六月。'),
    narr('他的脸瘦得只剩骨头，颧骨和下颌的轮廓清晰可见。眼睛因此显得格外大，里面布满血丝，像很多天没睡。'),
    narr('可他风衣下的肚子，却高高鼓起。'),
    narr('像挺着一个啤酒肚。可哪有这么瘦的人，长着这样的肚子？'),
    narr('他站上讲台，浑身僵直，目光缓缓扫过教室。'),
    narr('所过之处，所有人都安静了。'),
    say('周正', '同学们，大家好。我叫周正，是一名国际刑警。很高兴，今日能活着站在这里给你们讲课。'),
    narr('“活着”三个字，让你后颈一凉。')
  ],
  observe: [
    { id: 'o_belly', label: '鼓起的肚子', x: 50, y: 62,
      text: '风衣的扣子绷得很紧。\n\n有那么一瞬间，你觉得那肚子动了一下。',
      effects: { clues: ['ghost_slave'], codex: ['p_zhouzheng'] } },
    { id: 'o_eyes', label: '布满血丝的眼睛', x: 48, y: 45,
      text: '眼白里全是红血丝，瞳孔却亮得反常。\n\n那不是熬夜的人的眼睛，那是——很久没有闭过眼的眼睛。',
      effects: { codex: ['p_zhouzheng'], clues: ['find_rule'] } },
    { id: 'o_badge', label: '胸前的证件', x: 54, y: 54,
      text: '一个黑色的小本子，压着国徽。\n\n是真的。至少看起来是真的。',
      effects: {} }
  ],
  choices: [
    { text: '坐直，认真听。', next: 'p10', effects: { flags: { attentive: true } } },
    { text: '趴下补觉。这课听着就不正常。', next: 'p10', effects: { flags: { sleepy: true }, stats: { clock: 5, sanity: -5 } } }
  ]
});

nd('p10', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('周正转身，在黑板上写下一个字。'),
    { who: '', text: '*鬼*', style: 'em', fx: 'flash' },
    narr('粉笔断了。他把断掉的一截捡起来，继续写。'),
    say('周正', '鬼怪传说，自古就有。法国卢浮宫事件，美国别墅幽灵事件，日本停车场鬼影事件，埃及法老诅咒事件……以及我国的封门村事件。'),
    say('周正', '近些年，各国灵异事件呈爆炸式增长。这不是一两次事件的问题，而是在演变成全球性的灾难。'),
    say('周正', '如果这种情况得不到控制，未来……也许整个世界都没有未来。'),
    narr('教室里起了小小的骚动。有人笑，有人交头接耳。'),
    narr('周正没有理会。他又转身，写下第二行字。'),
    { who: '', text: '*鬼无法被杀死。*', style: 'em' },
    say('周正', '将来的某一天，你们也许会撞见它们。请记住：哪怕在极度恐惧之下，也不要想着和那东西拼命。'),
    say('周正', '你们的命在它面前，不值一提。它杀你们，比踩死几只蚂蚁还轻松。'),
    narr('他顿了顿。'),
    say('周正', '能对付鬼的，只有鬼。'),
    { who: '', text: '*能对付鬼的只有鬼。*', style: 'em' }
  ],
  choices: [
    { text: '举手。', next: 'p11', effects: { flags: { asked: true } } },
    { text: '沉默地看着他。', next: 'p11' }
  ]
});

nd('p11', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('周正又写下第三行字。'),
    { who: '', text: '*洞察鬼的规律。*', style: 'em' },
    say('周正', '每一种东西都有规律。鬼也有。'),
    say('周正', '每一种鬼，都有几乎固定的杀人方式和行动方式，就像一段程序：你按下开机键，它才运行；你点下鼠标，它才打开软件。'),
    say('周正', '克服恐惧，洞察鬼的规律，找到破绽——这是普通人被鬼盯上之后，唯一能活下来的机会。'),
    narr('粉笔在黑板上停住。他转过身，用那双布满血丝的眼睛看着你们。'),
    say('周正', '记住。如果被鬼找上，除了这个办法，你们没有任何办法活命。'),
    say('周正', '别心存侥幸。那玩意的恐怖程度，超过你们的想象。'),
    narr('教室里安静了几秒。然后有人小声笑了出来。'),
    narr('“这人有病吧。”'),
    narr('“安全讲课讲鬼故事，学校疯了吧。”'),
    narr('只有你，手心在冒汗。'),
    say('杨间', '~……论坛里的那个帖子。~')
  ],
  choices: [
    { text: '举手提问：你说的这些，是真的？', next: 'p12', effects: { clues: ['ghost_dead', 'only_ghost', 'find_rule'], codex: ['p_zhouzheng'], stats: { sanity: -5 } } },
    { text: '先不问了。看看他到底想干什么。', next: 'p12' }
  ]
});

nd('p12', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'ghost',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('你举起了手。'),
    say('杨间', '周先生，你说的这些……是真的？'),
    narr('全班的目光都转了过来。徐老师在后面皱眉。'),
    narr('周正看着你，看了很久。'),
    say('周正', '你叫什么名字？'),
    say('杨间', '杨间。'),
    say('周正', '杨间。'),
    narr('他重复了一遍，像在记住什么。'),
    say('周正', '是真的。'),
    say('周正', '……我希望对你来说，不是。'),
    narr('他还想说什么，目光却忽然越过你，落在教室后门的玻璃上。'),
    narr('他整个人僵住了。'),
    { who: '', text: '教室的灯，暗了一下。', fx: 'ghost', sfx: 'rise' }
  ],
  next: 'p13'
});

nd('p13', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom_ghost', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'laoren', pos: 'center', scale: 76, dim: true }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    { who: '', text: '你顺着他的目光回头。', fx: 'shake' },
    narr('教室后门外的走廊上，站着一个人。'),
    narr('黑色连体长衫，干瘦，褐色皮肤上布满斑点。'),
    narr('他直挺挺地站在那里，像一具被人立起来的尸体。'),
    narr('一只灰白、死寂的眼睛，正对着教室里面。'),
    { who: '', text: '*是照片上那个老人。*', style: 'blood', fx: 'flash', sfx: 'scare' },
    narr('你猛地站起来，椅子被撞翻在地。'),
    say('徐老师', '杨间！你站起来做什么，还不坐下！'),
    narr('你听不见她。你的耳朵里全是心跳声。'),
    narr('窗外，那片黑暗浓得像墨。它正贴着墙，一点一点往教室里渗。'),
    narr('墙皮开始发黑、卷曲、剥落。'),
    narr('苏蕾尖叫了一声。'),
    narr('她桌上的书本正在泛黄、发霉、腐烂——几秒钟之内，变成了一堆黑色的东西。'),
    say('张伟', '好臭……苏蕾，你桌上怎么有一坨……'),
    say('方镜', '不可能。这个时候学校怎么可能出现鬼域？')
  ],
  next: 'p14'
});

nd('p14', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'fangjing', pos: 'center', scale: 90 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('方镜从座位上弹了起来，脸色铁青，连退好几步。'),
    narr('周正的眼睛一下子眯了起来。'),
    say('周正', '你知道鬼域？'),
    say('方镜', '周正，鬼域的出现意味着什么，你很清楚。学校里有至少一只危险级别的鬼。今天要是处理不好，在校的人一个都别想活着离开——包括你。'),
    say('周正', '你也是驭鬼者？'),
    say('方镜', '这不关你的事。'),
    narr('然后他转过头，看向你。'),
    narr('那眼神让你后背发凉。'),
    say('方镜', '本来打算过几天再收拾你。没想到未来因此发生了变化。'),
    say('方镜', '杨间，今天我把话放在这里：我不会让你成长下去。未来的你太可怕了——鬼神级别的人物说杀就杀，活人禁区说平就平。'),
    say('方镜', '但这一世，你注定会夭折。'),
    narr('全班炸了。'),
    say('张伟', '卧槽，方镜，你这信息量很大啊！未来？上一世？你是穿越的？'),
    narr('你看着方镜，又看了看门外那个一动不动的老人。'),
    say('杨间', '~他认识我。~')
  ],
  observe: [
    { id: 'o_fang', label: '方镜的手', x: 50, y: 58,
      text: '他的手在抖。\n\n不是害怕的抖，是那种把什么东西攥得太紧的抖。',
      effects: { clues: ['fangjing_future'], codex: ['p_fangjing'] } },
    { id: 'o_door', label: '后门', x: 78, y: 44,
      text: '门没有锁，甚至没有关严。\n\n可他为什么不推门进来？',
      effects: { clues: ['knock_rule'] } }
  ],
  choices: [
    { text: '“方镜，你到底知道什么？”', next: 'p15' },
    { text: '不问了。先想办法出去。', next: 'p15', effects: { flags: { cold: true } } }
  ]
});

nd('p15', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'fangjing', pos: 'center', scale: 90 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  enter: { codex: ['m_letter'] },
  lines: [
    narr('方镜没有回答你。'),
    { who: '', text: '咚——咚咚。', sfx: 'knock', fx: 'shake' },
    narr('沉闷的敲门声响起。'),
    narr('像有人拿指节，一下一下叩在你的心脏上。'),
    narr('所有人都停下了动作。'),
    { who: '', text: '咚——咚咚。', sfx: 'knock' },
    narr('你听出来了。'),
    narr('和录音里一模一样。'),
    say('杨间', '~一长，两短。~'),
    narr('周正飞快地掏出一个对讲机一样的东西，按下一个键。'),
    say('周正', '周正。紧急事件。我在大昌市第七高中，校内出现至少一只危险级别的鬼。'),
    narr('电话那头是一个女人的声音，语速很快。'),
    say('接线员', '能对付么？'),
    say('周正', '它已经形成鬼域，开始影响我这里了。外面的灯全灭了，范围比我想的大。'),
    say('接线员', '鬼域……事态升级，不是你能对付的。迅速撤退。'),
    say('周正', '现在走已经晚了。这里学生很多，我要尽可能让他们活着离开。'),
    say('接线员', '以你现在的状态再使用鬼的力量，很危险。到时候那里可能就不止一只鬼了。'),
    say('周正', '没时间了。'),
    say('周正', '接下来我会保持通讯。如果断了，就说明我已经死了。遗书请转交给我父母。'),
    say('周正', '就这样。我要开始行动了。')
  ],
  next: 'p16'
});

nd('p16', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'laoren', pos: 'center', scale: 74, dim: true }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  enter: { codex: ['p_xulaoshi'] },
  lines: [
    narr('徐老师大概是受不了了。'),
    say('徐老师', '谁在外面敲门？我去看看。'),
    say('周正', '别出去！'),
    narr('已经晚了。'),
    narr('她拉开后门，迈出去一步。'),
    narr('——然后就不见了。'),
    narr('不是走远，不是被拖走。是那种，你眨了一下眼，画面里就少了一个人的不见。'),
    narr('门外的黑暗像黑雾一样灌了进来。'),
    narr('有几个趴在桌上的同学，一动不动。'),
    narr('他们还睁着眼睛，张着嘴，脸色死灰。'),
    narr('有人去扶，手一碰到就尖叫着退开——冰冷的，僵直的，一具尸体。'),
    narr('一个，两个，三个……'),
    narr('至少有六七个。')
  ],
  observe: [
    { id: 'o_body', label: '趴着的同学', x: 28, y: 62,
      text: '他们死的时候，甚至没有发出声音。\n\n敲门声每响一次，就多一个。',
      effects: { clues: ['knock_rule'], codex: ['g_qiaomen'] } },
    { id: 'o_chalk', label: '黑板上的字', x: 42, y: 34,
      text: '“鬼无法被杀死。能对付鬼的只有鬼。洞察鬼的规律。”\n\n粉笔字被黑暗啃掉了一半。',
      effects: { clues: ['find_rule'] } },
    { id: 'o_zhang', label: '张伟', x: 20, y: 54,
      text: '他缩在桌子底下，抱着头，嘴里念念有词。\n\n听起来像在背英语单词。',
      effects: { flags: { zhangwei_ok: true } } }
  ],
  choices: [
    { text: '“周正！是敲门声！”', next: 'p17', when: { clue: 'knock_rule' }, hint: '（你听出了节奏）', effects: { flags: { spoke_up: true }, stats: { knock: 2 }, clues: ['knock_rule'] } },
    { text: '“周正！那东西在计时——不能让它一直敲！”', next: 'p17', when: { clue: 'knock_rhythm', minSanity: 40 }, lockedHint: '你还没想明白敲门声的规律', sanityHint: '我脑子里有两个人在同时说话', effects: { flags: { spoke_up: true }, clues: ['knock_rule'] } },
    { text: '拉着张伟往后门跑。', next: 'p17b', effects: { stats: { knock: 1 } } },
    { text: '躲到桌子底下，捂住耳朵。', next: 'p17b', effects: { stats: { knock: 4, sanity: -8 }, flags: { hid: true } } }
  ]
});

nd('p17', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', rotAfter: '23:10', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('你喊了出来。全班都看向你。'),
    say('杨间', '那东西是在用敲门声杀人！要是能制止它敲门，或许有用！'),
    narr('周正盯着你，只用了半秒就做了决定。'),
    say('周正', '相信你一回。'),
    { who: '', text: '他撞开大门冲了出去。', fx: 'shake', sfx: 'step' },
    narr('那个瘦得只剩骨架的刑警，像一头出笼的野兽。'),
    narr('他撞倒了门外的老人。'),
    narr('老人的身体倒在地上，手脚以一种不可能的角度摊开，像一具被人随手摆弄的木偶。'),
    narr('周正掀开风衣。'),
    narr('——他的肚皮下面，伸出了一只手。'),
    narr('灰青色，指甲尖锐，从皮肤下面探出来，越伸越长，足足两米，抓住了地上的老人。'),
    narr('灯管滋滋作响。黑暗退了一点。'),
    say('周正', '有用。'),
    narr('然后他的脸色变了。'),
    narr('那个被抓住的老人，缓缓地，站了起来。')
  ],
  choices: [
    { text: '“跑——！”', next: 'p18' }
  ]
});

nd('p17b', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 高三（二）班',
  scene: 'classroom', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 88 }, { id: 'zhouzheng', pos: 'right', scale: 90 }],
  lines: [
    narr('你没有喊。你只是本能地往后躲。'),
    { who: '', text: '咚——咚咚。', sfx: 'knock', fx: 'shake' },
    narr('又一声。'),
    narr('这一次，你旁边的同学倒了下去。'),
    narr('李明的身体砸在地上，睁着眼睛，张着嘴。'),
    narr('你听见有人在哭，有人在喊妈妈。'),
    narr('周正回头看了你一眼。'),
    narr('那一眼里没有责怪，只有一种很平静的、认命的疲惫。'),
    say('周正', '……来不及了。'),
    { who: '', text: '他撞开门，冲了出去。', fx: 'shake', sfx: 'step' }
  ],
  choices: [
    { text: '跟着人群往外跑。', next: 'p18', effects: { stats: { survivors: -6 }, flags: { slow: true } } }
  ]
});

nd('p18', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 楼梯口',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'right', scale: 90 }],
  lines: [
    narr('“想活命的跟我走！”'),
    narr('方镜第一个冲了出去，直奔后门。'),
    narr('全班像被捅了的马蜂窝，跟着他往外涌。'),
    narr('你也跑了。'),
    narr('身后传来周正的吼声：“走！快走！趁着鬼域还没有出现，离开这里！”'),
    { who: '', text: '轰隆——', fx: 'shake', sfx: 'step' },
    narr('被风化的地面塌了。好几个同学直接掉了下去。'),
    narr('张伟、苗小善、苏蕾——'),
    narr('你绕开塌陷的地方，探头往下看。'),
    narr('张伟趴在下一层的地上，捂着屁股直吸气。'),
    narr('苏蕾躺在旁边。'),
    narr('一根染血的钢筋，从她的脖子穿了过去。'),
    narr('她还没有断气，喉咙里发出咯咯的声音。'),
    narr('救护车来不及了。这里也没有救护车。'),
    say('杨间', '~……走。~')
  ],
  choices: [
    { text: '转身，往楼下跑。', next: 'act3', effects: { stats: { survivors: -4 } } },
    { text: '蹲下去，试着把钢筋拔出来。', next: 'p18b', effects: { stats: { clock: 12, corruption: 4, sanity: -6 }, flags: { hand_hurt: true }, clues: ['ghost_dead'] } }
  ]
});

nd('p18b', {
  chapter: '第一幕 · 晚自习', place: '第七中学 · 五楼 · 楼梯口',
  scene: 'corridor_dark', mood: 'blood',
  cast: [{ id: 'yangjian', pos: 'left', scale: 90 }, { id: 'laoren', pos: 'right', scale: 88, dim: true }],
  lines: [
    narr('你蹲下去，双手握住那根钢筋。'),
    narr('苏蕾的眼睛看着你。她的嘴唇动了一下。'),
    say('苏蕾', '……别……'),
    narr('你没听懂她是说“别拔”，还是“别走”。'),
    { who: '', text: '咚——咚咚。', sfx: 'knock', fx: 'shake' },
    narr('敲门声在楼梯间里回荡，近得像贴着你的耳朵。'),
    narr('苏蕾的身体猛地一颤。'),
    narr('然后不动了。'),
    narr('你松开手，站起来。手心里全是她的血。'),
    narr('身后有人在喊你的名字。你回过头。'),
    narr('走廊尽头，那个穿黑衫的老人，正站在黑暗里，看着你。'),
    { who: '', text: '他朝你，走了一步。', fx: 'flash', sfx: 'step' }
  ],
  choices: [
    { text: '跑。', next: 'act3', effects: { stats: { knock: 2, survivors: -4 }, flags: { saw_oldman_close: true } } }
  ]
});
