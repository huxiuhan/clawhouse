---
name: lobster-house
description: |
  龙虾领养馆 - 用户通过回答Soul问题，从Neta已有角色中匹配灵魂原型，生成龙虾形象。
  支持"保留原型"和"龙虾化"两种形象模式。
---

# 龙虾领养馆 Skill

基于Neta角色库的龙虾领养体验。用户回答Soul问题 → 匹配Neta角色 → 生成龙虾形象。

## 前置条件

确保已设置环境变量 `NETA_TOKEN`。

```bash
npm install
```

## 命令使用

### 领养流程

**匹配龙虾灵魂**
```bash
npm start match_soul --personality "温柔" --aesthetic "梦幻" --wish "治愈"
```
根据用户选择的性格、审美、愿望，从Neta角色库中搜索匹配角色。

**生成龙虾形象**
```bash
npm start generate_lobster --character_uuid "xxx" --mode "lobster"
```
基于匹配到的角色生成龙虾形象。
- `mode=original`: 保留角色原型风格
- `mode=lobster`: 龙虾化角色原型

**查看龙虾档案**
```bash
npm start view_profile --lobster_id "001"
```

**完整领养流程（一键）**
```bash
npm start adopt --personality "温柔" --aesthetic "梦幻" --wish "治愈" --mode "lobster"
```

## Soul问答映射

### 性格 (personality)
| 选项 | 搜索关键词 |
|------|-----------|
| 温柔 | 温柔 |
| 活泼 | 活泼 |
| 高冷 | 高冷 |
| 暗黑 | 暗黑 |
| 可爱 | 可爱 |

### 审美 (aesthetic)
| 选项 | 搜索关键词 |
|------|-----------|
| 梦幻 | 梦幻 |
| 酷炫 | 酷 |
| 华丽 | 华丽 |
| 清新 | 清新 |
| 独特 | 个性 |

### 愿望 (wish)
| 选项 | 搜索关键词 |
|------|-----------|
| 神秘 | 神秘 |
| 文艺 | 文艺 |
| 战斗 | 战斗 |
| 治愈 | 治愈 |
| 霸气 | 霸气 |

## 形象生成模式

### original（保留原型）
```
Prompt: @角色名, 海底背景, {审美风格}
```
保留角色原本的形象，只添加海底场景。

### lobster（龙虾化）
```
Prompt: @角色名, 龙虾拟人化, 龙虾甲壳元素, 触须, 海底宫殿背景, {审美风格}
```
将角色龙虾化，融合龙虾特征。

## 参考文档

| 场景 | 文档 |
|------|------|
| 🦞 领养流程 | [adoption-flow.md](./references/adoption-flow.md) |
| 🎨 形象生成 | [image-generation.md](./references/image-generation.md) |
| 👤 角色匹配 | [character-matching.md](./references/character-matching.md) |

## 权限

需要 `NETA_TOKEN` 环境变量。
