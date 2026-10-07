"""Builds data/hsk1-3-categories.json: every HSK word in exactly one learning group.
Groups follow part of speech, with large noun and verb groups split by topic.
Run: python3 scripts/build_categories.py  (validates full coverage before writing)."""
import json, sys, os

ROOT = os.path.join(os.path.dirname(__file__), '..')

# Display order of groups (a group only appears if a level has words in it)
NAMES = {
    'P': 'Pronouns', 'Q': 'Question Words', 'GR': 'Greetings & Phrases',
    'PQ': 'Pronouns & Question Words',
    'NUM': 'Numbers', 'MW': 'Measure Words', 'NMW': 'Numbers & Measure Words',
    'PF': 'Nouns: People & Family', 'T': 'Nouns: Time & Dates',
    'PL': 'Nouns: Places & Directions', 'FD': 'Nouns: Food & Drink',
    'OBJ': 'Nouns: Clothes & Objects', 'SCH': 'Nouns: School & Work',
    'TECH': 'Nouns: Technology & Media', 'TR': 'Nouns: Transport & Travel',
    'TT': 'Nouns: Transport & Technology',
    'NAT': 'Nature, Weather & Animals', 'BODY': 'Body & Health',
    'IDEA': 'Nouns: Ideas & Other Things',
    'V1': 'Verbs: Everyday Actions', 'V2': 'Verbs: Moving Around',
    'V3': 'Verbs: Talking & Social', 'V4': 'Verbs: Thinking & Learning',
    'V5': 'Sports & Hobbies', 'V6': 'Verbs: Feelings',
    'V7': 'Verbs: Want, Can & Should', 'V67': 'Verbs: Feelings, Wishes & Abilities',
    'ADJ': 'Adjectives', 'ADJT': 'Adjectives: Describing Things',
    'ADJP': 'Adjectives: Describing People',
    'COL': 'Colors', 'ADV': 'Adverbs', 'G': 'Grammar Words',
}
ORDER = list(NAMES.keys())

HSK1 = {
 'P': '我 我们 你 他 她 这 那',
 'Q': '哪 哪儿 谁 什么 多少 几 怎么 怎么样',
 'GR': '谢谢 不客气 再见 对不起 没关系 喂 请',
 'NUM': '一 二 三 四 五 六 七 八 九 十 零',
 'MW': '个 岁 本 些 块',
 'PF': '爸爸 妈妈 儿子 女儿 老师 学生 同学 朋友 医生 先生 小姐 人 名字',
 'T': '今天 明天 昨天 上午 中午 下午 年 月 号 星期 点 分钟 现在 时候',
 'PL': '家 学校 饭店 商店 医院 中国 北京 上 下 前面 后面 里',
 'FD': '水 菜 米饭 水果 苹果 茶',
 'OBJ': '衣服 杯子 钱 桌子 椅子 东西',
 'SCH': '书 汉语 字',
 'TT': '电视 电脑 电影 飞机 出租车',
 'NAT': '天气 猫 狗 下雨',
 'V1': '是 有 吃 喝 睡觉 做 买 开 坐 住 工作 看 听 看见',
 'V2': '来 回 去',
 'V3': '说 叫 打电话 认识',
 'V4': '读 写 学习',
 'V67': '爱 喜欢 想 会 能',
 'ADJ': '好 大 小 多 少 冷 热 高兴 漂亮',
 'ADV': '不 没 很 太 都 一点儿',
 'G': '和 在 的 了 吗 呢',
}

HSK2 = {
 'P': '大家 您 它 每',
 'NUM': '百 两 千 第一',
 'MW': '次 件 一下',
 'PF': '弟弟 哥哥 姐姐 妹妹 妻子 丈夫 孩子 男人 女人 服务员',
 'T': '去年 生日 时间 晚上 小时 早上 日',
 'PL': '房间 旁边 外 右边 左边',
 'FD': '鸡蛋 咖啡 牛奶 西瓜 羊肉 鱼',
 'OBJ': '门 手表 报纸 手机',
 'SCH': '公司 教室 课 考试 题',
 'TR': '公共汽车 机场 路 票 火车站',
 'NAT': '晴 雪 阴',
 'BODY': '身体 生病 眼睛 药',
 'IDEA': '事情 问题 意思',
 'V1': '穿 开始 卖 起床 上班 完 洗 休息 找 等 笑',
 'V2': '出 到 进 走',
 'V3': '帮助 告诉 给 介绍 让 送 问 姓 说话',
 'V4': '懂 觉得 知道 准备',
 'V5': '唱歌 打篮球 旅游 跑步 跳舞 玩 游泳 运动 踢足球',
 'V7': '希望 可能 可以 要',
 'ADJT': '便宜 错 贵 好吃 近 快 慢 新 远 长 高',
 'ADJP': '快乐 累 忙',
 'COL': '白 黑 红 颜色',
 'ADV': '别 非常 还 就 也 一起 已经 再 真 正在 最',
 'G': '吧 比 从 得 离 所以 因为 着 往 过 对',
}

HSK3 = {
 'PQ': '别人 其他 自己 为什么',
 'NMW': '半 万 层 段 分 角 刻 口 辆 米 双 条 位 种 公斤 元 张',
 'PF': '阿姨 经理 客人 邻居 奶奶 叔叔 司机 同事 校长 爷爷',
 'T': '春 冬 刚才 过去 季节 节日 秋 夏 一会儿 以后 以前 周末 最近 后来 最后',
 'PL': '北方 宾馆 超市 城市 厨房 地方 东 附近 公园 国家 花园 街道 楼 南 世界 图书馆 洗手间 西 银行 中间 黄河',
 'FD': '菜单 蛋糕 果汁 面包 面条 啤酒 葡萄 糖 香蕉 饮料',
 'OBJ': '包 冰箱 衬衫 灯 电梯 空调 裤子 筷子 礼物 帽子 盘子 裙子 伞 碗 鞋 信 眼镜 瓶子 信用卡 皮鞋',
 'SCH': '班 办公室 成绩 词语 黑板 会议 句子 历史 年级 普通话 铅笔 数学 字典 作业 笔记本 词典 中文',
 'TECH': '电子 节目 新闻 音乐 照片 照相机 电子邮件',
 'TR': '地铁 地图 护照 行李箱 站 船 自行车',
 'NAT': '草 动物 河 花 鸟 树 太阳 熊猫 月亮 云 马 刮风',
 'BODY': '鼻子 耳朵 发烧 感冒 健康 脚 脸 疼 头发 腿 嘴 个子',
 'IDEA': '办法 故事 关系 环境 机会 声音 水平 文化 习惯 兴趣 作用',
 'V1': '变化 出现 打扫 带 放 刮 关 换 检查 接 结束 拿 上网 使 刷 完成 洗澡 像 小心 用 请假 试 刷牙 迟到',
 'V2': '搬 经过 离开 骑 起来 起飞',
 'V3': '祝 欢迎 帮忙 表示 参加 见面 讲 结婚 借 举行 同意 要求 影响 遇到 照顾 发 聊天 回答',
 'V4': '打算 发现 复习 记得 教 解决 决定 了解 练习 明白 认为 提高 忘记 相信 选择 以为 注意 留学',
 'V5': '爱好 比赛 表演 锻炼 画 爬山 体育 游戏',
 'V6': '担心 放心 关心 害怕 哭 生气 着急 感兴趣',
 'V7': '必须 敢 需要 应该 愿意',
 'ADJT': '安静 差 低 短 方便 干净 坏 简单 久 旧 难 奇怪 清楚 容易 甜 相同 新鲜 一般 一样 有名 重要 主要',
 'ADJP': '矮 饱 聪明 饿 可爱 渴 老 满意 难过 年轻 努力 胖 热情 认真 瘦 舒服',
 'COL': '黄 蓝 绿',
 'ADV': '比较 才 当然 多么 更 极 几乎 经常 马上 其实 特别 突然 先 一边 一定 一共 一直 又 越 只 终于 总是',
 'G': '啊 把 被 除了 地 而且 根据 跟 关于 还是 或者 然后 如果 虽然 为了 为 向',
}

def build(level, spec):
    data = json.load(open(os.path.join(ROOT, 'data', f'{level}.json'), encoding='utf-8'))
    words = [d['character'] for d in data]
    seen = {}
    problems = []
    for code, text in spec.items():
        if code not in NAMES:
            problems.append(f'unknown group code {code}')
        for w in text.split():
            if w in seen:
                problems.append(f'{w} in both {seen[w]} and {code}')
            seen[w] = code
    missing = [w for w in words if w not in seen]
    extra = [w for w in seen if w not in words]
    if missing: problems.append(f'not categorized: {" ".join(missing)}')
    if extra: problems.append(f'not in {level}.json: {" ".join(extra)}')
    if problems:
        print(f'[FAIL] {level}:'); [print('   ', p) for p in problems]
        return None
    # groups in display order; words keep the dataset's order inside each group
    out = {}
    for code in ORDER:
        group = [w for w in words if seen[w] == code]
        if group:
            out[NAMES[code]] = group
    print(f'[PASS] {level}: {len(words)} words in {len(out)} groups')
    return out

results = {lvl: build(lvl, spec) for lvl, spec in (('hsk1', HSK1), ('hsk2', HSK2), ('hsk3', HSK3))}
if any(v is None for v in results.values()):
    sys.exit(1)
for lvl, cats in results.items():
    with open(os.path.join(ROOT, 'data', f'{lvl}-categories.json'), 'w', encoding='utf-8') as f:
        json.dump(cats, f, ensure_ascii=False, indent=2)
        f.write('\n')
print('Wrote data/hsk1-categories.json, hsk2-categories.json, hsk3-categories.json')
