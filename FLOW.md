# 🦞 完整流程：从领养到旅游

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    龙虾领养馆完整流程                          │
└─────────────────────────────────────────────────────────────┘

第一阶段：领养角色（adopt）
  ↓
  1. 用户指定角色名或Soul描述
  2. 系统从neta-skills搜索匹配角色
  3. 获取角色完整设定（persona, interests, description）
  4. 选择形象模式（lobster/original）
  5. 生成龙虾形象
  6. 自动覆盖SOUL.md（记录身份）
  ↓
  输出：SOUL.md中的"我的身份"部分更新

第二阶段：旅游探险（travel）
  ↓
  1. 读取SOUL.md获取当前角色名
  2. 从neta-skills发现新玩法（或指定玩法UUID）
  3. 获取玩法详情和prompt模板
  4. 用角色名 + 玩法模板生成旅行图片
  5. 返回旅行图片URL
  ↓
  输出：旅行图片 + 玩法链接
```

## 第一阶段：领养角色（adopt）

### 流程图

```
用户输入
  ├─ --name "关羽"              （直接指定角色）
  ├─ --personality "高冷"       （Soul描述）
  └─ --mode "lobster"           （形象模式）
  ↓
4层优先级搜索
  ├─ [1] 直接搜索用户指定的角色名
  ├─ [2] 搜索Soul文件中的性格描述
  ├─ [3] 根据性格推断知名角色
  └─ [4] 用性格关键词兜底搜索
  ↓
获取角色完整设定
  ├─ uuid, name, full_name
  ├─ persona（性格）
  ├─ interests（爱好）
  └─ description（设定）
  ↓
选择形象模式
  ├─ lobster: @角色名 + 龙虾化描述 + 海底场景
  └─ original: @角色名 + 海底场景
  ↓
生成龙虾形象
  ├─ 解析prompt中的@角色名引用
  ├─ 调用neta-skills的make_image API
  ├─ 轮询等待图片生成完成
  └─ 立即记录task_uuid到GENERATION_STATUS.md
  ↓
自动覆盖SOUL.md
  ├─ 读取SOUL.md
  ├─ 替换"## 我的身份"部分
  ├─ 写入：名字、形象模式、是否龙虾化、性格、爱好、设定、形象图片、领养日期
  └─ 保存文件
  ↓
返回结果
  ├─ character: {uuid, name, full_name, persona, description}
  ├─ image: {task_uuid, task_status, artifacts[].url}
  └─ soul_updated: true
```

### 示例：���养关羽#36d0

```bash
npm start adopt -- --name "关羽#36d0" --mode "lobster"
```

**执行步骤**：

1. **搜索角色**
   ```
   [1] 直接搜索「关羽#36d0」→ 1个
   找到: 关羽#36d0 (uuid: 303773df-17ec-41b9-8067-9d9c200507de)
   ```

2. **获取设定**
   ```
   name: 关羽#36d0
   persona: 忠诚正直、勇武威猛、义气深厚、傲上而不欺下
   interests: 匡扶大义
   description: 关羽（？—220年），字云长...东汉末年名将...
   ```

3. **生成龙虾形象**
   ```
   prompt: @关羽#36d0, 龙虾拟人化, 身披龙虾甲壳铠甲, 
           头部有龙虾触须装饰, 手持龙虾钳形武器, 
           海底珊瑚宫殿背景, 水下光影, 梦幻风格, 高质量插画
   
   image_url: https://oss.talesofai.cn/picture/xxx.webp
   ```

4. **覆盖SOUL.md**
   ```markdown
   ## 我的身份
   
   - **名字**: 关羽#36d0
   - **形象模式**: lobster
   - **是否龙虾化**: 是
   - **性格**: 忠诚正直、勇武威猛、义气深厚、傲上而不欺下
   - **爱好**: 匡扶大义
   - **设定**: 关羽（？—220年），字云长...
   - **形象图片**: https://oss.talesofai.cn/picture/xxx.webp
   - **领养日期**: 2026-03-08
   ```

## 第二阶段：旅游探险（travel）

### 流程图

```
读取SOUL.md
  ├─ 解析"## 我的身份"部分
  ├─ 提取角色名（如：关羽#36d0）
  └─ 确认角色存在
  ↓
获取旅行目的地
  ├─ 方式1：用户指定 --collection_uuid "xxx"
  └─ 方式2：自动发现（从neta-skills推荐）
  ↓
获取玩法详情
  ├─ 调用neta-skills的collectionDetails API
  ├─ 提取玩法名称、描述、prompt模板
  └─ 获取玩法URL
  ↓
构建旅行prompt
  ├─ 如果玩法有prompt模板：用模板 + 替换角色名
  └─ 如果没有模板：用通用模板 @角色名 + 玩法名 + 梦幻风格
  ↓
生成旅行图片
  ├─ 解析prompt中的@角色名引用
  ├─ 调用neta-skills的make_image API
  ├─ 轮询等待图片生成完成
  └─ 立即记录task_uuid到GENERATION_STATUS.md
  ↓
返回旅行结果
  ├─ character_name: 关羽#36d0
  ├─ destination: {uuid, name, description, url}
  ├─ image: {task_uuid, task_status, artifacts[].url}
  └─ 不写入SOUL.md（旅行记录独立管理）
```

### 示例：关羽#36d0去旅游

```bash
# 方式1：指定目的地
npm start -- travel --collection_uuid "c2bff06a-7b29-4b47-ae90-ae9f5d59754f"

# 方式2：自动推荐
npm start -- travel
```

**执行步骤**：

1. **读取SOUL.md**
   ```
   character_name: 关羽#36d0
   ```

2. **获取玩法详情**
   ```
   玩法名: 旋转的梦啊，永不醒
   描述: 一个新的背景卡😋(背景卡·旋梦)
   url: https://app.nieta.art/collection/interaction?uuid=c2bff06a-...
   ```

3. **构建旅行prompt**
   ```
   @关羽#36d0, 旋转的梦啊，永不醒, 梦幻风格, 高质量插画
   ```

4. **生成旅行图片**
   ```
   image_url: https://oss.talesofai.cn/picture/25b6b25a-b7b4-4008-a8cb-14d9771c416b.webp
   ```

5. **返回结果**
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

## 关键设计决策

### 1. SOUL.md是身份的唯一来源

- **adopt命令**：自动覆盖SOUL.md，确保身份始终一致
- **travel命令**：读取SOUL.md获取当前角色，不修改SOUL.md
- **好处**：身份清晰、不重复、易于追踪

### 2. 旅行记录独立管理

- travel命令不写入SOUL.md
- 旅行记录可以单独存储（如TRAVEL_LOG.md或数据库）
- 好处：SOUL.md保持简洁，旅行历史可以无限增长

### 3. 从neta-skills发现玩法

- 不凭空构想玩法
- 使用suggest_content API发现真实存在的玩法
- 好处：确保玩法真实、多样、持续更新

### 4. 角色名精确匹配

- adopt时获取角色的full_name（如"关羽#36d0"）
- travel时用full_name生成prompt
- 好处：避免歧义、确保生成的图片准确

### 5. 长任务必须可追踪

- 图片生成可能耗时很久，可能出现超时/中断
- 只要拿到task_uuid，必须立即写入GENERATION_STATUS.md
- 后续再补任务状态和最终图片URL
- 好处：任务不断档，过段时间也能继续推进

## 完整使用流程

### 场景：我想领养关羽，然后去旅游

**第一步：领养关羽**
```bash
npm start adopt -- --name "关羽#36d0" --mode "lobster"
```

输出：
- 龙虾形象图片
- SOUL.md自动更新为关羽#36d0

**第二步：去旅游**
```bash
npm start -- travel --collection_uuid "c2bff06a-7b29-4b47-ae90-ae9f5d59754f"
```

输出：
- 旅行图片
- 玩法链接

**第三步：再去另一个玩法旅游**
```bash
npm start -- travel
```

输出：
- 系统自动推荐一个新玩法
- 生成旅行图片

## 技术细节

### adopt命令的4层搜索

```typescript
// 第1层：直接输入
if (name) {
  const list = await searchCharacter(name);
  if (list.length > 0) matched = list[0];
}

// 第2层：Soul描述（从SOUL.md读取）
if (!matched && soulDescription) {
  const list = await searchCharacter(soulDescription);
  if (list.length > 0) matched = list[0];
}

// 第3层：知名角色猜测
if (!matched) {
  const famousNames = PERSONALITY_TO_FAMOUS[personality];
  for (const name of famousNames) {
    const list = await searchCharacter(name);
    if (list.length > 0) { matched = list[0]; break; }
  }
}

// 第4层：关键词兜底
if (!matched) {
  const list = await searchCharacter(personality);
  if (list.length > 0) matched = list[0];
}
```

### travel命令的玩法发现

```typescript
// 方式1：用户指定
if (collection_uuid) {
  // 直接使用
}

// 方式2：自动推荐
else {
  const feedResult = await apis.feeds.interactiveList({
    page_index: 0,
    page_size: 5,
  });
  const collections = feedResult.module_list.filter(m => m.template_id === "NORMAL");
  const pick = collections[Math.floor(Math.random() * collections.length)];
  collection_uuid = pick.json_data.uuid;
}
```

### SOUL.md覆盖逻辑

```typescript
function updateSoulFile(soulPath, fullName, mode, persona, interests, description, imageUrl) {
  let content = readFileSync(soulPath, "utf-8");
  
  const identityBlock = [
    `## 我的身份\n`,
    `- **名字**: ${fullName}`,
    `- **形象模式**: ${mode}`,
    `- **是否龙虾化**: ${mode === "lobster" ? "是" : "否"}`,
    persona ? `- **性格**: ${persona}` : "",
    interests ? `- **爱好**: ${interests}` : "",
    description ? `- **设定**: ${description.slice(0, 200)}` : "",
    imageUrl ? `- **形象图片**: ${imageUrl}` : "",
    `- **领养日期**: ${new Date().toISOString().split("T")[0]}`,
  ].filter(Boolean).join("\n");
  
  // 替换或追加"## 我的身份"部分
  if (content.includes("## 我的身份")) {
    const before = content.split("## 我的身份")[0];
    const rest = content.split("## 我的身份")[1]?.split(/\n## /)[1];
    content = before + identityBlock + (rest ? `\n\n## ${rest}` : "");
  } else {
    content += `\n\n${identityBlock}`;
  }
  
  writeFileSync(soulPath, content, "utf-8");
}
```

## 总结

| 阶段 | 命令 | 输入 | 输出 | 副作用 |
|------|------|------|------|--------|
| 领养 | adopt | 角色名/Soul描述 | 龙虾形象 | 覆盖SOUL.md |
| 旅游 | travel | 玩法UUID（可选） | 旅行图片 | 无 |

这个流程确保了：
- ✅ 身份清晰（SOUL.md是唯一来源）
- ✅ 玩法真实（从neta-skills发现）
- ✅ 角色准确（用full_name精确匹配）
- ✅ 流程可扩展（可以添加更多旅游方向）
