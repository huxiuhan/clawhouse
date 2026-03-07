# 🦞 龙虾领养馆 (Lobster Adoption House)

基于 Neta 角色库的龙虾领养体验。用户回答 Soul 问题，系统从 Neta 已有角色中匹配灵魂原型，生成龙虾形象。

## 核心流程

```
用户回答Soul问题 → 匹配Neta角色 → 选择形象模式 → 生成龙虾 → 完成领养
```

## 安装

```bash
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

# 第二步：生成形象
npm start generate_lobster -- --character_uuid "xxx" --character_name "角色名" --mode "lobster"
```

## Soul 问答选项

### 性格 (personality)
| 选项 | 描述 |
|------|------|
| 温柔 | 温暖、治愈、善良 |
| 活泼 | 开朗、调皮、热情 |
| 高冷 | 傲娇、独立、自信 |
| 暗黑 | 深邃、神秘、力量 |
| 可爱 | 萌系、甜美、天真 |

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

## 形象模式

### 🦞 lobster（龙虾化）
将匹配到的角色龙虾化，融合龙虾甲壳、触须等特征，放置在海底宫殿场景中。

### 👤 original（保留原型）
保留角色原本的形象风格，只添加海底场景背景。

## 输出示例

```json
{
  "lobster": {
    "soul": {
      "personality": "温柔",
      "aesthetic": "梦幻",
      "wish": "治愈"
    },
    "character": {
      "uuid": "12ed9619-1df8-4c99-8db7-a0a72c7367f2",
      "name": "小陆#猫耳正太",
      "avatar_img": "https://oss.talesofai.cn/..."
    },
    "image": {
      "task_uuid": "e1424cd4-...",
      "task_status": "SUCCESS",
      "artifacts": [...]
    },
    "mode": "lobster"
  }
}
```

## 项目结构

```
lobster-house/
├── SKILL.md              # 技能描述文件
├── README.md             # 项目说明
├── package.json          # 依赖配置
├── tsconfig.json         # TypeScript配置
├── .env.example          # 环境变量模板
├── .env                  # 环境变量（不提交）
├── src/
│   ├── cli.ts            # CLI入口
│   ├── apis/             # Neta API封装（复用neta-skills）
│   ├── utils/            # 工具函数（复用neta-skills）
│   └── commands/
│       ├── factory.ts    # 命令工厂（复用neta-skills）
│       ├── load.ts       # 命令加载器（复用neta-skills）
│       ├── schema.ts     # 数据Schema（复用neta-skills）
│       └── lobster/      # 龙虾领养馆命令
│           ├── match_soul.cmd.ts          # 匹配灵魂
│           ├── match_soul.cmd.zh_cn.yml
│           ├── generate_lobster.cmd.ts    # 生成形象
│           ├── generate_lobster.cmd.zh_cn.yml
│           ├── adopt.cmd.ts               # 一键领养
│           └── adopt.cmd.zh_cn.yml
├── references/           # 参考文档
├── scripts/              # 构建脚本
└── bin/                  # 编译输出
```

## 依赖

本项目复用 `@neta/skills-neta` 的 API 封装和工具函数，保持与 neta-skills 生态的兼容性。

## License

MIT
