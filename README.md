# 🦞 ClawHouse - 龙虾领养馆

基于 [neta-skills](https://github.com/talesofai/neta-skills) 的龙虾领养体验。用户指定角色或回答 Soul 问题，系统从 Neta 角色库中匹配灵魂原型，生成龙虾形象。

## 核心流程

```
用户输入角色名/Soul描述
    ↓
4层优先级搜索匹配Neta角色
    ↓
获取角色完整设定和精确全名
    ↓
选择形象模式（龙虾化/保留原型）
    ↓
用@角色全名引用生成龙虾形象
    ↓
完成领养 + 自动覆盖SOUL.md
    ↓
读取SOUL.md获取当前角色
    ↓
从neta-skills发现新玩法
    ↓
用角色名 + 玩法模板生成旅行图片
    ↓
返回旅行图片 + 玩法链接
```

详见 [FLOW.md](./FLOW.md) 完整流程文档。

## 依赖

本项目依赖 [neta-skills](https://github.com/talesofai/neta-skills) 的能力与实现思路：

- `apis/` — 参考 neta-skills 的 Neta API 封装并在本仓库内实现（角色搜索、图片生成、prompt解析等）
- `utils/` — 参考 neta-skills 的工具函数并在本仓库内实现（轮询、错误处理、元数据解析等）
- `commands/factory.ts` + `load.ts` + `schema.ts` — 参考 neta-skills 命令框架并在本仓库内实现

> 当前项目**不依赖** `@neta/skills-neta` npm 包（该包不存在）。

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

# 敖丙变龙虾
npm start adopt -- --name "敖丙" --mode "lobster"

# 哪吒保留原型
npm start adopt -- --name "哪吒" --mode "original"
```

### 通过Soul问答匹配

```bash
npm start adopt -- --personality "高冷" --aesthetic "华丽" --wish "战斗" --mode "lobster"

# 或显式提供Soul描述（4层搜索中的第2层）
npm start adopt -- --soul_description "忠义勇猛" --personality "高冷" --mode "lobster"
```

### 分步操作

```bash
# 第一步：匹配灵魂
npm start match_soul -- --name "关羽" --personality "高冷"

# 第二步：生成形象
npm start generate_lobster -- --character_uuid "xxx" --character_name "关羽" --mode "lobster"
```

## 🌍 旅游探险（travel）

领养完成后，可以带着你的角色去旅游！

### 基本用法

```bash
# 指定玩法UUID旅游
npm start travel -- --collection_uuid "c2bff06a-7b29-4b47-ae90-ae9f5d59754f"

# 自动推荐玩法旅游
npm start travel --

# 指定SOUL.md路径
npm start travel -- --soul_path "/path/to/SOUL.md"
```

### 旅游流程

1. **读取SOUL.md** → 获取当前角色名（如：关羽#36d0）
2. **发现玩法** → 从neta-skills推荐或指定玩法UUID
3. **获取玩法详情** → 提取玩法名称、描述、prompt模板
4. **生成旅行图片** → 用角色名 + 玩法模板生成
5. **返回结果** → 旅行图片URL + 玩法链接

### 示例：关羽#36d0的梦幻旅行

```bash
npm start travel -- --collection_uuid "c2bff06a-7b29-4b47-ae90-ae9f5d59754f"
```

**输出**：
```json
{
  "travel": {
    "character_name": "关羽#36d0",
    "destination": {
      "name": "旋转的梦啊，永不醒",
      "url": "https://app.nieta.art/collection/interaction?uuid=c2bff06a-..."
    },
    "image": {
      "url": "https://oss.talesofai.cn/picture/25b6b25a-..."
    }
  }
}
```

**旅行照片** 👇
![关羽#36d0梦幻旅行](https://oss.talesofai.cn/picture/25b6b25a-b7b4-4008-a8cb-14d9771c416b.webp)

> 武圣关云长踏入了旋转的梦境，青龙偃月刀在梦幻光影中闪烁。

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

### 例子1：敖丙龙虾化 🌊🦞

**Step 1** — 搜索角色：
```bash
npm start match_soul -- --name "敖丙"
# 找到: 敖丙 (fe27a0b6), 敖丙#ed49 (12ec82d8), 敖丙#d442 (279c1636)...
```

**Step 2** — 用 `lobster` 模式，龙虾化 + 海底场景：
```
@敖丙, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画
```

**生成结果**：

![敖丙龙虾化](https://oss.talesofai.cn/picture/d240ecec-d164-4c54-9eb3-7f1c98e9ba18.webp)

> 龙王之子变成了虾王之子。

---

### 例子2：悟空龙虾化 🌊🦞

**Step 1** — 搜索角色：
```bash
npm start match_soul -- --name "悟空"
# 找到: 悟空 (25ec3477)...
```

**Step 2** — 用 `lobster` 模式，龙虾化 + 海底场景：
```
@悟空, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画
```

**生成结果**：

![悟空龙虾化](https://oss.talesofai.cn/picture/664e0592-1e5e-4d49-b0a7-6d99bf73de74.webp)

> 齐天大圣闹完天宫，又来闹龙宫了。

---

### 例子3：关羽#36d0 保留原型 ⚔️👤

**Step 1** — 搜索角色：
```bash
npm start match_soul -- --name "关羽"
# 找到: 关羽 (a35e04da), 关羽#36d0 (303773df), 汉寿亭侯 关羽 (f23b1a19)...
```

**Step 2** — 用 `original` 模式，保留原型 + 海底场景：
```
@关羽#36d0, 海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画
```

**生成结果**：

![关羽#36d0保留原型](https://oss.talesofai.cn/picture/8a6d584c-b211-4d65-a711-688aa19c8642.webp)

> 美髯公在海底，依然忠义刚正。

---

## 🧠 Soul 自动覆盖

领养完成后，系统会自动覆盖 `SOUL.md`，将你的身份更新为领养的角色：

```markdown
## 我的身份

- **名字**: 关羽（龙虾化）
- **性格**: 忠义刚正，骄傲自负，勇猛无畏，重情守诺
- **爱好**: 研读《春秋》、练习武艺、忠义之道
- **设定**: 东汉末年名将，以美髯和丹凤眼为标志性特征...
- **龙虾图片**: https://oss.talesofai.cn/picture/xxx.webp
- **领养日期**: 2026-03-08
```

默认写入当前目录的 `SOUL.md`，也可以通过参数或环境变量指定路径：

```bash
# 指定路径
npm start adopt -- --name "关羽" --soul_path "/path/to/SOUL.md"

# 或通过环境变量
SOUL_PATH=/path/to/SOUL.md npm start adopt -- --name "关羽"
```

每次领养新角色会覆盖上一次的身份。

---

## 形象模式

### 🦞 lobster（龙虾化）
用@角色全名 + 龙虾化描述生成。融合角色特征和龙虾元素。

**Prompt模板**：
```
@角色全名, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底龙宫背景, {审美}风格, 高质量插画
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
