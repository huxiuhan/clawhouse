# 龙虾形象生成任务状态

## 任务目标
生成三个角色的original模式图片作为README示例

## 角色信息

### 1. 敖丙 - original模式
- **UUID**: fe27a0b6-4d90-4b87-ae3d-de83db55fce4
- **模式**: original（保留原型）
- **审美**: 梦幻
- **Prompt**: `@敖丙, 海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画`
- **状态**: 生成中...

### 2. 悟空 - original模式
- **UUID**: 25ec3477-7d56-4200-8761-9b53ab409fe5
- **模式**: original（保留原型）
- **审美**: 梦幻
- **Prompt**: `@悟空, 海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画`
- **状态**: 待生成

### 3. 关羽#36d0 - original模式
- **UUID**: 303773df-17ec-41b9-8067-9d9c200507de
- **模式**: original（保留原型）
- **审美**: 梦幻
- **Prompt**: `@关羽#36d0, 海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画`
- **状态**: 待生成

## 执行命令

```bash
# 敖丙
npm start -- generate_lobster --character_uuid "fe27a0b6-4d90-4b87-ae3d-de83db55fce4" --character_name "敖丙" --mode "original" --aesthetic "梦幻"

# 悟空
npm start -- generate_lobster --character_uuid "25ec3477-7d56-4200-8761-9b53ab409fe5" --character_name "悟空" --mode "original" --aesthetic "梦幻"

# 关羽#36d0
npm start -- generate_lobster --character_uuid "303773df-17ec-41b9-8067-9d9c200507de" --character_name "关羽#36d0" --mode "original" --aesthetic "梦幻"
```

## README更新位置

在README.md的"🎮 示例效果"部分添加三个新示例，格式参考现有的"例子1：关羽龙虾化"、"例子2：敖丙龙虾化"、"例子3：哪吒保留原型"。

### 新增示例模板

```markdown
### 例子4：敖丙保留原型 🌊👤

**生成结果**：

![敖丙保留原型](IMAGE_URL_HERE)

> 龙王之子在海底宫殿中保持优雅。

---

### 例子5：悟空保留原型 🌊👤

**生成结果**：

![悟空保留原型](IMAGE_URL_HERE)

> 齐天大圣在海底也能翻江倒海。

---

### 例子6：关羽#36d0保留原型 ⚔️👤

**生成结果**：

![关羽#36d0保留原型](IMAGE_URL_HERE)

> 美髯公在海底依然忠义刚正。
```

## 注意事项

- 图片生成API有并发限制（同时最多生成数量有上限）
- 每个图片生成需要轮询等待��通常需要1-5分钟
- 生成完成后会返回artifacts数组，包含图片URL
- 需要将返回的图片URL替换到README中的IMAGE_URL_HERE位置
