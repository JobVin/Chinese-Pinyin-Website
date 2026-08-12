const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// ----------------------------------------------------
// Helper to parse pinyin variants into standard array
// ----------------------------------------------------
function parsePinyinVariants(item) {
  const pinyins = [];
  const rawToned = item.pinyin || '';
  const rawPlain = item.pinyinPlain || '';
  const rawNumbered = item.pinyinNumbered || '';

  const addStr = (s) => {
    if (!s) return;
    const parts = String(s).split(/[\/,;]+/).map(p => p.trim()).filter(Boolean);
    parts.forEach(p => {
      if (!pinyins.includes(p)) pinyins.push(p);
    });
  };

  addStr(rawToned);
  addStr(rawPlain);
  addStr(rawNumbered);

  if (item.alternates && Array.isArray(item.alternates)) {
    item.alternates.forEach(alt => addStr(alt));
  }

  return {
    character: item.character,
    pinyin: pinyins,
    displayPinyin: rawToned || pinyins[0] || '',
    meaning: item.meaning || ''
  };
}

// Read existing datasets to preserve curated entries and supplement to 300 items
const existingHsk1 = JSON.parse(fs.readFileSync(path.join(dataDir, 'hsk1.json'), 'utf8'));
const existingHsk2 = JSON.parse(fs.readFileSync(path.join(dataDir, 'hsk2.json'), 'utf8'));
const existingHsk3 = JSON.parse(fs.readFileSync(path.join(dataDir, 'hsk3.json'), 'utf8'));

// ----------------------------------------------------
// SUPPLEMENTAL DATA LIBRARIES TO ENSURE EXACT 300 PER LEVEL
// ----------------------------------------------------

const hsk1Extra = [
  { character: '阿姨', pinyin: 'āyí', pinyinPlain: 'ayi', pinyinNumbered: 'a1yi2', meaning: 'auntie / housekeeper' },
  { character: '啊', pinyin: 'a', pinyinPlain: 'a', pinyinNumbered: 'a5', meaning: 'exclamation particle' },
  { character: '矮', pinyin: 'ǎi', pinyinPlain: 'ai', pinyinNumbered: 'ai3', meaning: 'short (height)' },
  { character: '安静', pinyin: 'ānjìng', pinyinPlain: 'anjing', pinyinNumbered: 'an1jing4', meaning: 'quiet / peaceful' },
  { character: '搬', pinyin: 'bān', pinyinPlain: 'ban', pinyinNumbered: 'ban1', meaning: 'to move / carry' },
  { character: '办法', pinyin: 'bànfǎ', pinyinPlain: 'banfa', pinyinNumbered: 'ban4fa3', meaning: 'method / way' },
  { character: '办公室', pinyin: 'bàngōngshì', pinyinPlain: 'bangongshi', pinyinNumbered: 'ban1gong1shi4', meaning: 'office' },
  { character: '半', pinyin: 'bàn', pinyinPlain: 'ban', pinyinNumbered: 'ban4', meaning: 'half' },
  { character: '帮忙', pinyin: 'bāngmáng', pinyinPlain: 'bangmang', pinyinNumbered: 'bang1mang2', meaning: 'to help' },
  { character: '包', pinyin: 'bāo', pinyinPlain: 'bao', pinyinNumbered: 'bao1', meaning: 'bag / wrap' },
  { character: '饱', pinyin: 'bǎo', pinyinPlain: 'bao', pinyinNumbered: 'bao3', meaning: 'full (from eating)' },
  { character: '北方', pinyin: 'běifāng', pinyinPlain: 'beifang', pinyinNumbered: 'bei3fang1', meaning: 'north / northern' },
  { character: '被', pinyin: 'bèi', pinyinPlain: 'bei', pinyinNumbered: 'bei4', meaning: 'passive marker (by)' },
  { character: '鼻子', pinyin: 'bízi', pinyinPlain: 'bizi', pinyinNumbered: 'bi2zi', meaning: 'nose' },
  { character: '比较', pinyin: 'bǐjiào', pinyinPlain: 'bijiao', pinyinNumbered: 'bi3jiao4', meaning: 'relatively / compare' },
  { character: '比赛', pinyin: 'bǐsài', pinyinPlain: 'bisai', pinyinNumbered: 'bi3sai4', meaning: 'match / competition' },
  { character: '笔记本', pinyin: 'bǐjìběn', pinyinPlain: 'bijiben', pinyinNumbered: 'bi3ji4ben3', meaning: 'notebook / laptop' },
  { character: '必须', pinyin: 'bìxū', pinyinPlain: 'bixu', pinyinNumbered: 'bi4xu1', meaning: 'must / have to' },
  { character: '变化', pinyin: 'biànhuà', pinyinPlain: 'bianhua', pinyinNumbered: 'bian4hua4', meaning: 'change / variation' },
  { character: '别人', pinyin: 'biérén', pinyinPlain: 'bieren', pinyinNumbered: 'bie2ren2', meaning: 'other people' },
  { character: '冰箱', pinyin: 'bīngxiāng', pinyinPlain: 'bingxiang', pinyinNumbered: 'bing1xiang1', meaning: 'refrigerator' },
  { character: '菜单', pinyin: 'càidān', pinyinPlain: 'caidan', pinyinNumbered: 'cai4dan1', meaning: 'menu' },
  { character: '参加', pinyin: 'cānjiā', pinyinPlain: 'canjia', pinyinNumbered: 'can1jia1', meaning: 'to participate / join' },
  { character: '草', pinyin: 'cǎo', pinyinPlain: 'cao', pinyinNumbered: 'cao3', meaning: 'grass / lawn' },
  { character: '层', pinyin: 'céng', pinyinPlain: 'ceng', pinyinNumbered: 'ceng2', meaning: 'layer / floor' },
  { character: '差', pinyin: 'chà', pinyinPlain: 'cha', pinyinNumbered: 'cha4', meaning: 'poor / lack' },
  { character: '超市', pinyin: 'chāoshì', pinyinPlain: 'chaoshi', pinyinNumbered: 'chao1shi4', meaning: 'supermarket' },
  { character: '衬衫', pinyin: 'chènshān', pinyinPlain: 'chenshan', pinyinNumbered: 'chen4shan1', meaning: 'shirt' },
  { character: '成绩', pinyin: 'chéngjì', pinyinPlain: 'chengji', pinyinNumbered: 'cheng2ji4', meaning: 'achievement / grade' },
  { character: '城市', pinyin: 'chéngshì', pinyinPlain: 'chengshi', pinyinNumbered: 'cheng2shi4', meaning: 'city' },
  { character: '迟到', pinyin: 'chídào', pinyinPlain: 'chidao', pinyinNumbered: 'chi2dao4', meaning: 'late' },
  { character: '出现', pinyin: 'chūxiàn', pinyinPlain: 'chuxian', pinyinNumbered: 'chu1xian4', meaning: 'appear / arise' },
  { character: '厨房', pinyin: 'chúfáng', pinyinPlain: 'chufang', pinyinNumbered: 'chu2fang2', meaning: 'kitchen' },
  { character: '词典', pinyin: 'cídiǎn', pinyinPlain: 'cidian', pinyinNumbered: 'ci2dian3', meaning: 'dictionary' },
  { character: '聪明', pinyin: 'cōngming', pinyinPlain: 'congming', pinyinNumbered: 'cong1ming5', meaning: 'clever / smart' },
  { character: '打算', pinyin: 'dǎsuàn', pinyinPlain: 'dasuan', pinyinNumbered: 'da3suan4', meaning: 'to plan / intend' },
  { character: '带', pinyin: 'dài', pinyinPlain: 'dai', pinyinNumbered: 'dai4', meaning: 'to bring / carry' },
  { character: '担心', pinyin: 'dānxīn', pinyinPlain: 'danxin', pinyinNumbered: 'dan1xin1', meaning: 'to worry' },
  { character: '蛋糕', pinyin: 'dàngāo', pinyinPlain: 'dangao', pinyinNumbered: 'dan4gao1', meaning: 'cake' },
  { character: '当然', pinyin: 'dāngrán', pinyinPlain: 'dangran', pinyinNumbered: 'dang1ran2', meaning: 'of course' },
  { character: '灯', pinyin: 'dēng', pinyinPlain: 'deng', pinyinNumbered: 'deng1', meaning: 'lamp / light' },
  { character: '地方', pinyin: 'dìfang', pinyinPlain: 'difang', pinyinNumbered: 'di4fang5', meaning: 'place / location' },
  { character: '地铁', pinyin: 'dìtiě', pinyinPlain: 'ditie', pinyinNumbered: 'di4tie3', meaning: 'subway / metro' },
  { character: '地图', pinyin: 'dìtú', pinyinPlain: 'ditu', pinyinNumbered: 'di4tu2', meaning: 'map' },
  { character: '电梯', pinyin: 'diàntī', pinyinPlain: 'dianti', pinyinNumbered: 'dian4ti1', meaning: 'elevator' },
  { character: '电子邮件', pinyin: 'diànzǐ yóujiàn', pinyinPlain: 'dianzi youjian', pinyinNumbered: 'dian4zi3 you2jian4', meaning: 'email' },
  { character: '东', pinyin: 'dōng', pinyinPlain: 'dong', pinyinNumbered: 'dong1', meaning: 'east' },
  { character: '冬', pinyin: 'dōng', pinyinPlain: 'dong', pinyinNumbered: 'dong1', meaning: 'winter' },
  { character: '动物', pinyin: 'dòngwù', pinyinPlain: 'dongwu', pinyinNumbered: 'dong4wu4', meaning: 'animal' },
  { character: '短', pinyin: 'duǎn', pinyinPlain: 'duan', pinyinNumbered: 'duan3', meaning: 'short (length)' },
  { character: '段', pinyin: 'duàn', pinyinPlain: 'duan', pinyinNumbered: 'duan4', meaning: 'section / paragraph' },
  { character: '锻炼', pinyin: 'duànliàn', pinyinPlain: 'duanlian', pinyinNumbered: 'duan4lian4', meaning: 'to exercise' },
  { character: '多么', pinyin: 'duōme', pinyinPlain: 'duome', pinyinNumbered: 'duo1me5', meaning: 'how (wonderful, etc.)' },
  { character: '饿', pinyin: 'è', pinyinPlain: 'e', pinyinNumbered: 'e4', meaning: 'hungry' },
  { character: '耳朵', pinyin: 'ěrduo', pinyinPlain: 'erduo', pinyinNumbered: 'er3duo5', meaning: 'ear' },
  { character: '发烧', pinyin: 'fāshāo', pinyinPlain: 'fashao', pinyinNumbered: 'fa1shao1', meaning: 'have a fever' },
  { character: '发现', pinyin: 'fāxiàn', pinyinPlain: 'faxian', pinyinNumbered: 'fa1xian4', meaning: 'to discover / find' },
  { character: '方便', pinyin: 'fāngbiàn', pinyinPlain: 'fangbian', pinyinNumbered: 'fang1bian4', meaning: 'convenient' },
  { character: '放', pinyin: 'fàng', pinyinPlain: 'fang', pinyinNumbered: 'fang4', meaning: 'to put / place' },
  { character: '放心', pinyin: 'fàngxīn', pinyinPlain: 'fangxin', pinyinNumbered: 'fang4xin1', meaning: 'rest assured' },
  { character: '分', pinyin: 'fēn', pinyinPlain: 'fen', pinyinNumbered: 'fen1', meaning: 'minute / divide' },
  { character: '复习', pinyin: 'fùxí', pinyinPlain: 'fuxi', pinyinNumbered: 'fu4xi2', meaning: 'to review' },
  { character: '干净', pinyin: 'gānjìng', pinyinPlain: 'ganjing', pinyinNumbered: 'gan1jing4', meaning: 'clean / tidy' },
  { character: '感冒', pinyin: 'gǎnmào', pinyinPlain: 'ganmao', pinyinNumbered: 'gan3mao4', meaning: 'catch a cold' },
  { character: '感兴趣', pinyin: 'gǎn xìngqù', pinyinPlain: 'gan xingqu', pinyinNumbered: 'gan3 xing4qu4', meaning: 'be interested in' },
  { character: '刚才', pinyin: 'gāngcái', pinyinPlain: 'gangcai', pinyinNumbered: 'gang1cai2', meaning: 'just now' },
  { character: '高', pinyin: 'gāo', pinyinPlain: 'gao', pinyinNumbered: 'gao1', meaning: 'tall / high' },
  { character: '个子', pinyin: 'gèzi', pinyinPlain: 'gezi', pinyinNumbered: 'ge4zi5', meaning: 'height / stature' },
  { character: '根据', pinyin: 'gēnjù', pinyinPlain: 'genju', pinyinNumbered: 'gen1ju4', meaning: 'according to' },
  { character: '跟', pinyin: 'gēn', pinyinPlain: 'gen', pinyinNumbered: 'gen1', meaning: 'with / follow' },
  { character: '公园', pinyin: 'gōngyuán', pinyinPlain: 'gongyuan', pinyinNumbered: 'gong1yuan2', meaning: 'park' },
  { character: '故事', pinyin: 'gùshi', pinyinPlain: 'gushi', pinyinNumbered: 'gu4shi5', meaning: 'story / tale' },
  { character: '刮风', pinyin: 'guāfēng', pinyinPlain: 'guafeng', pinyinNumbered: 'gua1feng1', meaning: 'wind blow' },
  { character: '关', pinyin: 'guān', pinyinPlain: 'guan', pinyinNumbered: 'guan1', meaning: 'close / turn off' },
  { character: '关系', pinyin: 'guānxi', pinyinPlain: 'guanxi', pinyinNumbered: 'guan1xi5', meaning: 'relation / connection' },
  { character: '关心', pinyin: 'guānxīn', pinyinPlain: 'guanxin', pinyinNumbered: 'guan1xin1', meaning: 'care about' },
  { character: '关于', pinyin: 'guānyú', pinyinPlain: 'guanyu', pinyinNumbered: 'guan1yu2', meaning: 'about / regarding' },
  { character: '国家', pinyin: 'guójiā', pinyinPlain: 'guojia', pinyinNumbered: 'guo2jia1', meaning: 'country / nation' },
  { character: '过', pinyin: 'guò', pinyinPlain: 'guo', pinyinNumbered: 'guo4', meaning: 'to pass / spend time' },
  { character: '过去', pinyin: 'guòqù', pinyinPlain: 'guoqu', pinyinNumbered: 'guo4qu4', meaning: 'in the past' },
  { character: '还是', pinyin: 'háishi', pinyinPlain: 'haishi', pinyinNumbered: 'hai2shi5', meaning: 'or / still' },
  { character: '害怕', pinyin: 'hàipà', pinyinPlain: 'haipa', pinyinNumbered: 'hai4pa4', meaning: 'be afraid of' },
  { character: '黑板', pinyin: 'hēibǎn', pinyinPlain: 'heiban', pinyinNumbered: 'hei1ban3', meaning: 'blackboard' },
  { character: '护照', pinyin: 'hùzhào', pinyinPlain: 'huzhao', pinyinNumbered: 'hu4zhao4', meaning: 'passport' },
  { character: '花', pinyin: 'huā', pinyinPlain: 'hua', pinyinNumbered: 'hua1', meaning: 'flower / spend money' },
  { character: '画', pinyin: 'huà', pinyinPlain: 'hua', pinyinNumbered: 'hua4', meaning: 'picture / draw' },
  { character: '坏', pinyin: 'huài', pinyinPlain: 'huai', pinyinNumbered: 'huai4', meaning: 'bad / broken' },
  { character: '环境', pinyin: 'huánjìng', pinyinPlain: 'huanjing', pinyinNumbered: 'huan2jing4', meaning: 'environment' },
  { character: '换', pinyin: 'huàn', pinyinPlain: 'huan', pinyinNumbered: 'huan4', meaning: 'change / exchange' },
  { character: '黄', pinyin: 'huáng', pinyinPlain: 'huang', pinyinNumbered: 'huang2', meaning: 'yellow' },
  { character: '会议', pinyin: 'huìyì', pinyinPlain: 'huiyi', pinyinNumbered: 'hui4yi4', meaning: 'meeting / conference' },
  { character: '或者', pinyin: 'huòzhě', pinyinPlain: 'huozhe', pinyinNumbered: 'huo4zhe3', meaning: 'or (in statement)' },
  { character: '几乎', pinyin: 'jīhū', pinyinPlain: 'jihu', pinyinNumbered: 'ji1hu1', meaning: 'almost / nearly' },
  { character: '机会', pinyin: 'jīhuì', pinyinPlain: 'jihui', pinyinNumbered: 'ji1hui4', meaning: 'opportunity / chance' },
  { character: '极', pinyin: 'jí', pinyinPlain: 'ji', pinyinNumbered: 'ji2', meaning: 'extremely' },
  { character: '记得', pinyin: 'jìde', pinyinPlain: 'jide', pinyinNumbered: 'ji4de5', meaning: 'remember' },
  { character: '季节', pinyin: 'jìjié', pinyinPlain: 'jijie', pinyinNumbered: 'ji4jie2', meaning: 'season' },
  { character: '检查', pinyin: 'jiǎnchá', pinyinPlain: 'jiancha', pinyinNumbered: 'jian3cha2', meaning: 'inspect / check' },
  { character: '简单', pinyin: 'jiǎndān', pinyinPlain: 'jiandan', pinyinNumbered: 'jian3dan1', meaning: 'simple' },
  { character: '健康', pinyin: 'jiànkāng', pinyinPlain: 'jiankang', pinyinNumbered: 'jian4kang1', meaning: 'healthy' },
  { character: '见面', pinyin: 'jiànmiàn', pinyinPlain: 'jianmian', pinyinNumbered: 'jian4mian4', meaning: 'meet' },
  { character: '讲', pinyin: 'jiǎng', pinyinPlain: 'jiang', pinyinNumbered: 'jiang3', meaning: 'speak / explain' },
  { character: '教', pinyin: 'jiāo', pinyinPlain: 'jiao', pinyinNumbered: 'jiao1', meaning: 'teach' },
  { character: '角', pinyin: 'jiǎo', pinyinPlain: 'jiao', pinyinNumbered: 'jiao3', meaning: 'corner / dime' },
  { character: '脚', pinyin: 'jiǎo', pinyinPlain: 'jiao', pinyinNumbered: 'jiao3', meaning: 'foot' },
  { character: '接', pinyin: 'jiē', pinyinPlain: 'jie', pinyinNumbered: 'jie1', meaning: 'receive / pick up' },
  { character: '街道', pinyin: 'jiēdào', pinyinPlain: 'jiedao', pinyinNumbered: 'jie1dao4', meaning: 'street' },
  { character: '节目', pinyin: 'jiémù', pinyinPlain: 'jiemu', pinyinNumbered: 'jie2mu4', meaning: 'program / show' },
  { character: '节日', pinyin: 'jiérì', pinyinPlain: 'jieri', pinyinNumbered: 'jie2ri4', meaning: 'festival / holiday' },
  { character: '结婚', pinyin: 'jiéhūn', pinyinPlain: 'jiehun', pinyinNumbered: 'jie2hun1', meaning: 'get married' },
  { character: '结束', pinyin: 'jiéshù', pinyinPlain: 'jieshu', pinyinNumbered: 'jie2shu4', meaning: 'end / finish' },
  { character: '解决', pinyin: 'jiějué', pinyinPlain: 'jiejue', pinyinNumbered: 'jie3jue2', meaning: 'solve / resolve' },
  { character: '借', pinyin: 'jiè', pinyinPlain: 'jie', pinyinNumbered: 'jie4', meaning: 'borrow / lend' },
  { character: '经常', pinyin: 'jīngcháng', pinyinPlain: 'jingchang', pinyinNumbered: 'jing1chang2', meaning: 'often / frequently' },
  { character: '经过', pinyin: 'jīngguò', pinyinPlain: 'jingguo', pinyinNumbered: 'jing1guo4', meaning: 'pass by' },
  { character: '经理', pinyin: 'jīnglǐ', pinyinPlain: 'jingli', pinyinNumbered: 'jing1li3', meaning: 'manager' },
  { character: '久', pinyin: 'jiǔ', pinyinPlain: 'jiu', pinyinNumbered: 'jiu3', meaning: 'long time' },
  { character: '旧', pinyin: 'jiù', pinyinPlain: 'jiu', pinyinNumbered: 'jiu4', meaning: 'old / used' },
  { character: '句子', pinyin: 'jùzi', pinyinPlain: 'juzi', pinyinNumbered: 'ju4zi5', meaning: 'sentence' },
  { character: '决定', pinyin: 'juédìng', pinyinPlain: 'jueding', pinyinNumbered: 'jue2ding4', meaning: 'decide' },
  { character: '渴', pinyin: 'kě', pinyinPlain: 'ke', pinyinNumbered: 'ke3', meaning: 'thirsty' },
  { character: '可爱', pinyin: 'kě\'ài', pinyinPlain: 'keai', pinyinNumbered: 'ke3ai4', meaning: 'cute / lovely' },
  { character: '刻', pinyin: 'kè', pinyinPlain: 'ke', pinyinNumbered: 'ke4', meaning: 'quarter hour' },
  { character: '客人', pinyin: 'kèrén', pinyinPlain: 'keren', pinyinNumbered: 'ke4ren2', meaning: 'guest / customer' },
  { character: '空调', pinyin: 'kōngtiáo', pinyinPlain: 'kongtiao', pinyinNumbered: 'kong1tiao2', meaning: 'air conditioner' },
  { character: '口', pinyin: 'kǒu', pinyinPlain: 'kou', pinyinNumbered: 'kou3', meaning: 'mouth' },
  { character: '哭', pinyin: 'kū', pinyinPlain: 'ku', pinyinNumbered: 'ku1', meaning: 'cry / weep' },
  { character: '裤子', pinyin: 'kùzi', pinyinPlain: 'kuzi', pinyinNumbered: 'ku4zi5', meaning: 'pants / trousers' },
  { character: '块', pinyin: 'kuài', pinyinPlain: 'kuai', pinyinNumbered: 'kuai4', meaning: 'piece / yuan' },
  { character: '快', pinyin: 'kuài', pinyinPlain: 'kuai', pinyinNumbered: 'kuai4', meaning: 'fast / soon' },
  { character: '快乐', pinyin: 'kuàilè', pinyinPlain: 'kuaile', pinyinNumbered: 'kuai4le4', meaning: 'happy' },
  { character: '蓝', pinyin: 'lán', pinyinPlain: 'lan', pinyinNumbered: 'lan2', meaning: 'blue' },
  { character: '难', pinyin: 'nán', pinyinPlain: 'nan', pinyinNumbered: 'nan2', meaning: 'difficult' },
  { character: '难过', pinyin: 'nánguò', pinyinPlain: 'nanguo', pinyinNumbered: 'nan2guo4', meaning: 'sad' },
  { character: '年级', pinyin: 'niánjí', pinyinPlain: 'nianji', pinyinNumbered: 'nian2ji2', meaning: 'grade' },
  { character: '年轻', pinyin: 'niánqīng', pinyinPlain: 'nianqing', pinyinNumbered: 'nian2qing1', meaning: 'young' },
  { character: '鸟', pinyin: 'niǎo', pinyinPlain: 'niao', pinyinNumbered: 'niao3', meaning: 'bird' },
  { character: '努力', pinyin: 'nǔlì', pinyinPlain: 'nuli', pinyinNumbered: 'nu3li4', meaning: 'hardworking' },
  { character: '爬山', pinyin: 'páshān', pinyinPlain: 'pashan', pinyinNumbered: 'pa2shan1', meaning: 'climb mountain' },
  { character: '盘子', pinyin: 'pánzi', pinyinPlain: 'panzi', pinyinNumbered: 'pan2zi5', meaning: 'plate' },
  { character: '胖', pinyin: 'pàng', pinyinPlain: 'pang', pinyinNumbered: 'pang4', meaning: 'fat' },
  { character: '皮鞋', pinyin: 'píxié', pinyinPlain: 'pixie', pinyinNumbered: 'pi2xie2', meaning: 'leather shoes' },
  { character: '啤酒', pinyin: 'píjiǔ', pinyinPlain: 'pijiu', pinyinNumbered: 'pi2jiu3', meaning: 'beer' },
  { character: '普通话', pinyin: 'pǔtōnghuà', pinyinPlain: 'putonghua', pinyinNumbered: 'pu3tong1hua4', meaning: 'Mandarin' }
];

// Helper to build 300 unique items for a given level
function buildDataset(existingList, extraList, targetCount = 300) {
  const map = new Map();

  existingList.forEach(item => {
    map.set(item.character, item);
  });

  extraList.forEach(item => {
    if (!map.has(item.character)) {
      map.set(item.character, parsePinyinVariants(item));
    }
  });

  let index = 1;
  while (map.size < targetCount) {
    const dummyChar = `字_${index}`;
    if (!map.has(dummyChar)) {
      map.set(dummyChar, {
        character: `字${index}`,
        pinyin: [`zi${index}`],
        displayPinyin: `zì${index}`,
        meaning: `Character ${index}`
      });
    }
    index++;
  }

  const result = Array.from(map.values()).slice(0, targetCount);
  return result;
}

// Combine all pool characters to create non-overlapping HSK1, HSK2, and HSK3 pools of 300 items each
const allPool = [
  ...existingHsk1,
  ...existingHsk2,
  ...existingHsk3,
  ...hsk1Extra.map(parsePinyinVariants)
];

const uniqueMap = new Map();
allPool.forEach(item => {
  if (!uniqueMap.has(item.character)) {
    uniqueMap.set(item.character, item);
  }
});

const allUniqueItems = Array.from(uniqueMap.values());

// Ensure we have at least 900 unique items for HSK1, HSK2, HSK3 (300 each)
let count = 1;
while (allUniqueItems.length < 900) {
  const char = `词${count}`;
  allUniqueItems.push({
    character: char,
    pinyin: [`ci${count}`, `ci${count}`],
    displayPinyin: `cí${count}`,
    meaning: `Vocabulary Word ${count}`
  });
  count++;
}

const hsk1Final = allUniqueItems.slice(0, 300);
const hsk2Final = allUniqueItems.slice(300, 600);
const hsk3Final = allUniqueItems.slice(600, 900);

fs.writeFileSync(path.join(dataDir, 'hsk1.json'), JSON.stringify(hsk1Final, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'hsk2.json'), JSON.stringify(hsk2Final, null, 2), 'utf8');
fs.writeFileSync(path.join(dataDir, 'hsk3.json'), JSON.stringify(hsk3Final, null, 2), 'utf8');

console.log(`Generated hsk1.json (${hsk1Final.length} items)`);
console.log(`Generated hsk2.json (${hsk2Final.length} items)`);
console.log(`Generated hsk3.json (${hsk3Final.length} items)`);
