# 🦞 ClawHouse - 龙虾领养馆

基于 [neta-skills](https://github.com/talesofai/neta-skills) 的龙虾领养体验。用户回答 Soul 问题，系统从 Neta 已有角色中匹配灵魂原型，生成龙虾形象。

## 核心流程

```
用户回答Soul问题 → 匹配Neta角色 → 选择形象模式 → 生成龙虾 → 完成领养
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

### 一键领养（推荐）

```bash
# 龙虾化模式
npm start adopt -- --personality "温柔" --aesthetic "梦幻" --wish "治愈" --mode "lobster"

# 保留原型模式
npm start adopt -- --personality "高冷" --aesthetic "酷炫" --wish "战斗" --mode "original"
```

### 分步操作

```bash
# 第一步：匹配灵魂
npm start match_soul -- --personality "温柔" --aesthetic "梦幻" --wish "治愈"

# 第二步：生成形象（用上一步返回的角色信息）
npm start generate_lobster -- --character_uuid "xxx" --character_name "角色名" --mode "lobster"
```

## 🎮 好玩的例子

### 例子1：关羽变龙虾 🦞⚔️

> "青龙偃月刀？不，现在是青龙偃月钳。"

```bash
npm start adopt -- --personality "高冷" --aesthetic "华丽" --wish "战斗" --mode "lobster"
```

**Soul档案**：高冷 × 华丽 × 战斗
**匹配角色**：关羽 — Neta上的三国武将
**生成效果**：身披龙虾甲壳铠甲的关羽，手持龙虾钳形武器，在海底珊瑚宫殿中威风凛凛

关羽的忠义之魂注入龙虾体内，红色甲壳如同赤兔马的鬃毛，触须飘动如同美髯公的长须。这只龙虾，义薄云天。

---

### 例子2：孙悟空变龙虾 🦞🔥

> "俺老孙来也！...等等，怎么变成虾了？"

```bash
npm start adopt -- --personality "活泼" --aesthetic "酷炫" --wish "霸气" --mode "lobster"
```

**Soul档案**：活泼 × 酷炫 × 霸气
**匹配角色**：孙悟空 — Neta上有41个版本的齐天大圣
**生成效果**：龙虾化的孙悟空，金色甲壳闪闪发光，头戴紧箍咒，手持如意金箍棒（虾钳版），在海底大闹龙宫

大圣的不羁灵魂遇上龙虾的坚硬外壳，简直是天作之合。毕竟，龙宫本来就是他的主场。

---

### 例子3：哪吒保留原型 🦞🌊

> "我命由我不由天！...我选择不变成虾。"

```bash
npm start adopt -- --personality "可爱" --aesthetic "梦幻" --wish "神秘" --mode "original"
```

**Soul档案**：可爱 × 梦幻 × 神秘
**匹配角色**：哪吒 — Neta上有96个版本的三太子
**生成效果**：保留哪吒原型，置身于梦幻海底世界，脚踩风火轮在珊瑚丛中穿梭，混天绫在水中飘舞

用 `original` 模式，哪吒保持本来的样子，只是来到了海底世界做客。毕竟他爹李靖和龙王有过节，来海底串个门也合理。

---

## Soul 问答选项

### 性格 (personality)
| 选项 | 描述 | 搜索关键词 |
|------|------|-----------|
| 温柔 | 温暖、治愈、善良 | 温柔 |
| 活泼 | 开朗、调皮、热情 | 活泼 |
| 高冷 | 傲娇、独立、自信 | 高冷 |
| 暗黑 | 深邃、神秘、力量 | 暗黑 |
| 可爱 | 萌系、甜美、天真 | 可爱 |

### 审美 (aesthetic)
| 选项 | 描述 | 搜索关键词 |
|------|------|-----------|
| 梦幻 | 柔和、梦幻、仙气 | 梦幻 |
| 酷炫 | 酷、暗黑、赛博 | 酷 |
| 华丽 | 闪亮、华丽、贵族 | 华丽 |
| 清新 | 自然、清新、淡雅 | 清新 |
| 独特 | 奇怪、个性、前卫 | 个性 |

### 愿望 (wish)
| 选项 | 描述 | 搜索关键词 |
|------|------|-----------|
| 神秘 | 探索未知的深海 | 神秘 |
| 文艺 | 创作属于自己的歌 | 文艺 |
| 战斗 | 成为最强的龙虾战士 | 战斗 |
| 治愈 | 拥有一个温暖的窝 | 治愈 |
| 霸气 | 成为海底之王 | 霸气 |

## 形象模式

### 🦞 lobster（龙虾化）
将匹配到的角色龙虾化，融合龙虾甲壳、触须等特征，放置在海底宫殿场景中。

**Prompt模板**：
```
@角色名, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, {审美}风格, 高质量插画
```

### 👤 original（保留原型）
保留角色原本的形象风格，只添加海底场景背景。

**Prompt模板**：
```
@角色名, 海底珊瑚宫殿背景, 水下光影, {审美}风格, 高质量插画
```

## 输出示例

```json
{
  "lobster": {
    "soul": {
      "personality": "高冷",
      "aesthetic": "华丽",
      "wish": "战斗"
    },
    "character": {
      "uuid": "a35e04da-...",
      "name": "关羽",
      "avatar_img": "https://oss.talesofai.cn/..."
    },
    "image": {
      "task_uuid": "aedd6893-...",
      "task_status": "SUCCESS",
      "artifacts": [{
        "uuid": "aedd6893-...",
        "status": "SUCCESS",
        "url": "https://oss.talesofai.cn/picture/aedd6893-....webp",
        "image_detail": { "height": 2048, "width": 2048 }
      }]
    },
    "mode": "lobster"
  }
}
```

## 项目结构

```
clawhouse/
├── SKILL.md                    # 技能描述（neta-skills标准格式）
├── README.md
├── package.json                # @neta/skills-lobster-house
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
│           ├── match_soul      # 匹配灵魂原型
│           ├── generate_lobster # 生成龙虾形象
│           └── adopt           # 一键领养
└── references/
```

## 命令列表

| 命令 | 说明 | 必需参数 |
|------|------|---------|
| `match_soul` | 匹配灵魂原型 | `--personality` `--aesthetic` `--wish` |
| `generate_lobster` | 生成龙虾形象 | `--character_uuid` `--character_name` `--mode` |
| `adopt` | 一键领养 | `--personality` `--aesthetic` `--wish` `--mode` |

## License

MIT
