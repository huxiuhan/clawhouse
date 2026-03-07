# 🦞 ClawHouse - 龙虾领养馆

基于 [neta-skills](https://github.com/talesofai/neta-skills) 的龙虾领养体验。用户指定角色或回答 Soul 问题，系统从 Neta 角色库中匹配灵魂原型，生成龙虾形象。

## 核心流程

```
用户输入角色名/Soul描述
    ↓
4层优先级搜索匹配Neta角色
    ↓
获取角色完整设定和参考图
    ↓
选择形象模式（龙虾化/保留原型）
    ↓
生成龙虾形象
    ↓
完成领养
```

## 依赖

本项目依赖 [neta-skills](https://github.com/talesofai/neta-skills) 的 API 封装和工具函数：

- `apis/` — 复用 `@neta/skills-neta` 的 Neta API 客户端（角色搜索、图片生成、prompt解析等）
- `utils/` — 复用 `@neta/skills-neta` 的工具函数（轮询、错误处理、元数据解析等）
- `commands/factory.ts` + `load.ts` + `schema.ts` — 复用 neta-skills 的命令框架

项目结构完全兼容 neta-skills 标准 skill 仓库规范，可作为独立 skill 安装使用。

## 安装

```bash
git clone git@github.com:huxiuhan/clawhouse.git
cd clawhouse
npm install
cp .env.example .env
# 编辑 .env 填入 NETA_TOKEN
```

## 使用

### 直接指定角色领养（推荐）

```bash
# 关羽变龙虾
npm start adopt -- --name "关羽" --mode "lobster"

# 孙悟空变龙虾
npm start adopt -- --name "孙悟空" --mode "lobster"

# 哪吒保留原型
npm start adopt -- --name "哪吒" --mode "original"
```

### 通过Soul问答匹配

```bash
npm start adopt -- --personality "高冷" --aesthetic "华丽" --wish "战斗" --mode "lobster"
```

### 分步操作

```bash
# 第一步：匹配灵魂
npm start match_soul -- --name "关羽" --personality "高冷"

# 第二步：生成形象
npm start generate_lobster -- --character_uuid "xxx" --character_name "关羽" --mode "lobster"
```

## 🔍 4层搜索优先级

角色匹配按以下优先级依次搜索，找到即停：

| 优先级 | 搜索方式 | 示例 |
|--------|---------|------|
| **1. 直接输入** | 用户指定的角色名 | `--name "关羽"` → 搜索"关羽" |
| **2. Soul描述** | 用户Soul文件中的性格描述 | Soul文件写"忠义勇猛" → 搜索"忠义勇猛" |
| **3. 知名角色猜测** | 根据性格推断的知名角色 | 高冷 → 猜测"关羽""诸葛亮""赵云" |
| **4. 关键词兜底** | 直接用性格关键词搜索 | 高冷 → 搜索"高冷" |

## 🎮 示例效果

以下示例均使用 neta-skills 实际生成，完整步骤如下：

### 例子1：关羽龙虾化 ⚔️🦞

**Step 1** — 搜索角色：
```bash
npm start match_soul -- --name "关羽"
# 找到: 关羽 (a35e04da), 关羽#36d0 (303773df), 汉寿亭侯 关羽 (f23b1a19)...
```

**Step 2** — 获取角色设定：
```bash
npm start -- request_character_or_elementum --uuid "a35e04da-af43-4781-a83a-e6fa17c2b011"
# 关羽: 美髯、丹凤眼、青龙偃月刀、忠义刚正
```

**Step 3** — 用角色参考图 + 龙虾化prompt生成：
```
参考图-全图参考-{角色头像UUID}, 龙虾甲壳铠甲, 海底龙宫背景, 华丽风格, 高质量插画
```

**生成结果**：

![关羽龙虾化](https://oss.talesofai.cn/picture/e17f0277-1bdf-4074-a050-47ee754aae28.webp)

> 青龙偃月刀？不，现在是青龙偃月钳。

---

### 例子2：孙悟空龙虾化 🔥🦞

**Step 1** — 搜索角色：
```bash
npm start match_soul -- --name "孙悟空"
# 找到: 孙悟空 (9bf276ab), 共41个版本
```

**Step 2** — 获取角色设定：
```bash
npm start -- request_character_or_elementum --uuid "9bf276ab-7b48-433e-a696-084c3a2276b8"
# 孙悟空: 毛脸猴头、金色眼睛、金色战甲、金箍棒、斗战圣佛
```

**Step 3** — 用角色参考图 + 龙虾化prompt生成：
```
参考图-全图参考-{角色头像UUID}, 龙虾甲壳铠甲, 海底龙宫背景, 酷炫风格, 高质量插画
```

**生成结果**：

![孙悟空龙虾化](https://oss.talesofai.cn/picture/5c78b5c0-402b-4be9-b99e-7d90a8b3c258.webp)

> 大闹龙宫？这次是真的住进去了。

---

### 例子3：哪吒保留原型 🌊👤

**Step 1** — 搜索角色：
```bash
npm start match_soul -- --name "哪吒"
# 找到: 哪吒 (73888dd1), 共96个版本
```

**Step 2** — 获取角色设定：
```bash
npm start -- request_character_or_elementum --uuid "73888dd1-91b5-472a-a1cc-eeaf22a66c6b"
# 哪吒: 眼圈漆黑、两团发髻、痞气顽童、混天绫、风火轮
```

**Step 3** — 用 `original` 模式，保留原型 + 海底场景：
```
@哪吒, 在海底世界漫步, 珊瑚和鱼群环绕, 梦幻水下光影, 高质量插画
```

**生成结果**：

![哪吒保留原型](https://oss.talesofai.cn/picture/3cff026b-5797-4512-a47a-10399070052f.webp)

> 我命由我不由天！但我可以选择不变成虾。

---

## 🧠 Soul建议

领养完成后，系统会根据角色设定自动生成Soul建议，提醒用户将自己的Soul更新为与角色一致：

```json
{
  "soul_suggestion": {
    "message": "🦞 领养成功！建议将你的Soul更新为与「关羽」一致：\n\n性格: 忠义刚正，骄傲自负，勇猛无畏，重情守诺\n爱好: 研读《春秋》、练习武艺、忠义之道\n\n这样你的龙虾会更有灵魂哦！",
    "recommended_persona": "忠义刚正，骄傲自负，勇猛无畏，重情守诺",
    "recommended_interests": "研读《春秋》、练习武艺、忠义之道"
  }
}
```

---

## 形象模式

### 🦞 lobster（龙虾化）
用角色参考图 + 龙虾化描述生成。融合角色特征和龙虾元素。

**Prompt模板**：
```
参考图-全图参考-{角色头像UUID}, 龙虾甲壳铠甲, 海底龙宫背景, {审美}风格, 高质量插画
```

### 👤 original（保留原型）
用 `@角色名` 引用，保留角色原本形象，只添加海底场景。

**Prompt模板**：
```
@角色名, 海底珊瑚宫殿背景, 水下光影, {审美}风格, 高质量插画
```

## Soul 问答选项

### 性格 (personality)
| 选项 | 描述 | 猜测的知名角色 |
|------|------|---------------|
| 温柔 | 温暖、治愈、善良 | 白龙马、貂蝉、织女 |
| 活泼 | 开朗、调皮、热情 | 孙悟空、哪吒 |
| 高冷 | 傲娇、独立、自信 | 关羽、诸葛亮、赵云 |
| 暗黑 | 深邃、神秘、力量 | 曹操、吕布、白骨精 |
| 可爱 | 萌系、甜美、天真 | 哪吒、小龙女、玉兔 |

### 审美 (aesthetic)
| 选项 | 描述 |
|------|------|
| 梦幻 | 柔和、梦幻、仙气 |
| 酷炫 | 酷、暗黑、赛博 |
| 华丽 | 闪亮、华丽、贵族 |
| 清新 | 自然、清新、淡雅 |
| 独特 | 奇怪、个性、前卫 |

### 愿望 (wish)
| 选项 | 描述 |
|------|------|
| 神秘 | 探索未知的深海 |
| 文艺 | 创作属于自己的歌 |
| 战斗 | 成为最强的龙虾战士 |
| 治愈 | 拥有一个温暖的窝 |
| 霸气 | 成为海底之王 |

## 项目结构

```
clawhouse/
├── SKILL.md                    # 技能描述（neta-skills标准格式）
├── README.md
├── package.json                # @neta/skills-clawhouse
├── .env.example
├── tsconfig.json
├── src/
│   ├── cli.ts                  # CLI入口
│   ├── apis/                   # Neta API封装（依赖neta-skills）
│   ├── utils/                  # 工具函数（依赖neta-skills）
│   └── commands/
│       ├── factory.ts          # 命令工厂（依赖neta-skills）
│       ├── load.ts             # 命令加载器（依赖neta-skills）
│       ├── schema.ts           # 数据Schema（依赖neta-skills）
│       └── lobster/            # 🦞 龙虾领养馆命令
│           ├── match_soul      # 匹配灵魂原型（4层搜索）
│           ├── generate_lobster # 生成龙虾形象
│           └── adopt           # 一键领养
└── references/
```

## License

MIT
