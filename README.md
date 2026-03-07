# 🦞 ClawHouse - 龙虾领养馆

基于 [neta-skills](https://github.com/talesofai/neta-skills) 的龙虾领养体验。用户指定角色或回答 Soul 问题，系统从 Neta 角色库中匹配灵魂原型，生成龙虾形象。

## 核心流程

```
用户输入角色名/Soul描述 → 4层优先级匹配Neta角色 → 选择形象模式 → 生成龙虾 → 完成领养
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

# 哪吒变龙虾
npm start adopt -- --name "哪吒" --mode "lobster"

# 保留原型模式
npm start adopt -- --name "哪吒" --mode "original"
```

### 通过Soul问答匹配

```bash
# 不指定角色名，系统自动匹配
npm start adopt -- --personality "高冷" --aesthetic "华丽" --wish "战斗" --mode "lobster"
```

### 分步操作

```bash
# 第一步：匹配灵魂（支持直接输入名字）
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

### 例子1：关羽变龙虾 ⚔️🦞

```bash
npm start adopt -- --name "关羽" --mode "lobster" --aesthetic "华丽"
```

> 青龙偃月刀？不，现在是青龙偃月钳。

![关羽龙虾化](https://oss.talesofai.cn/picture/69ffb06c-57d6-4fb2-9f36-257d723f149e.webp)

---

### 例子2：孙悟空变龙虾 🔥🦞

```bash
npm start adopt -- --name "孙悟空" --mode "lobster" --aesthetic "酷炫"
```

> 俺老孙来也！大闹龙宫？这次是真的住进去了。

![孙悟空龙虾化](https://oss.talesofai.cn/picture/a5bd7fd6-fd55-4b49-931f-137044715f5e.webp)

---

### 例子3：哪吒变龙虾 🌊🦞

```bash
npm start adopt -- --name "哪吒" --mode "lobster" --aesthetic "梦幻"
```

> 我命由我不由天！但我可以选择变成虾。

![哪吒龙虾化](https://oss.talesofai.cn/picture/99106d6f-6f89-4955-a06c-9f4eda3363f7.webp)

---

## 形象模式

### 🦞 lobster（龙虾化）
将角色龙虾化，融合龙虾甲壳、触须等特征。

**Prompt模板**：
```
@角色名, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, {审美}风格, 高质量插画
```

### 👤 original（保留原型）
保留角色原本的形象，只添加海底场景。

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

## 输出示例

```json
{
  "lobster": {
    "soul": { "personality": "高冷", "aesthetic": "华丽", "wish": "战斗" },
    "character": {
      "uuid": "a35e04da-...",
      "name": "关羽",
      "match_source": "直接输入: 关羽"
    },
    "image": {
      "task_status": "SUCCESS",
      "artifacts": [{
        "url": "https://oss.talesofai.cn/picture/69ffb06c-....webp",
        "image_detail": { "height": 2048, "width": 2048 }
      }]
    },
    "mode": "lobster",
    "search_log": ["[1] 直接搜索「关羽」→ 5个"]
  }
}
```

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

## 命令列表

| 命令 | 说明 | 关键参数 |
|------|------|---------|
| `match_soul` | 匹配灵魂原型 | `--name`（可选）`--personality` |
| `generate_lobster` | 生成龙虾形象 | `--character_uuid` `--character_name` `--mode` |
| `adopt` | 一键领养 | `--name`（可选）`--personality` `--mode` |

## License

MIT
