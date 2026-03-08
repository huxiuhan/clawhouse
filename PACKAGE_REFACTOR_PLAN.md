# 📦 Clawhouse Package配置改进方案

**问题分析**: 2026年3月8日

## 当前问题

### 1. 代码重复
- clawhouse复制了neta-skills的所有API代码（2162行）
- 包括: activity, artifact, collection, feeds, gpt, hashtag, prompt, task, tcp, user, verse等
- 导致维护困难和版本不同步

### 2. 依赖关系不清晰
- package.json中没有声明对neta-skills的依赖
- 实际上依赖neta-skills的API实现
- 但代码是复制而非引用

### 3. 项目结构问题
- 名称: `@neta/skills-clawhouse` - 暗示是neta-skills的一部分
- 但实际上是独立项目
- repository指向neta-skills，但代码是独立的

## 改进方案

### 方案A: 作为neta-skills的子skill（推荐）

**优点**:
- 共享API代码
- 统一版本管理
- 清晰的项目结构

**步骤**:
1. 将clawhouse移到neta-skills/skills/clawhouse/
2. 删除重复的API代码
3. 从neta-skills导入API
4. 更新package.json

**新的package.json**:
```json
{
  "name": "@neta/skills-clawhouse",
  "version": "0.1.0",
  "description": "龙虾领养馆 - 基于Neta角色匹配的龙虾Soul定义技能",
  "type": "module",
  "author": "Neta Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/talesofai/neta-skills.git",
    "directory": "skills/clawhouse"
  },
  "bin": {
    "lobster-house": "bin/cli.js"
  },
  "scripts": {
    "dev": "node src/cli.ts",
    "start": "node bin/cli.js",
    "type-check": "tsc --noEmit",
    "build": "rimraf bin && tsc",
    "postbuild": "node scripts/postbuild.js"
  },
  "dependencies": {
    "@commander-js/extra-typings": "^14.0.0",
    "neta-skills (monorepo workspace package)": "workspace:*",
    "axios": "^1.7.9",
    "commander": "^14.0.0",
    "dotenv": "^16.4.7",
    "dotenv-flow": "^4.1.0",
    "qs": "^6.15.0",
    "yaml": "^2.8.2",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/qs": "^6.14.0",
    "rimraf": "^6.1.3",
    "typescript": "^5.9.3"
  }
}
```

### 方案B: 作为独立项��

**优点**:
- 完全独立
- 可单独发布到npm
- 灵活的版本管理

**步骤**:
1. 保持当前结构
2. 更新package.json中的repository
3. 添加对neta-skills的显式依赖
4. 定期同步API更新

**新的package.json**:
```json
{
  "name": "@neta/skills-clawhouse",
  "version": "0.1.0",
  "description": "龙虾领养馆 - 基于Neta角色匹配的龙虾Soul定义技能",
  "type": "module",
  "author": "Neta Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/talesofai/clawhouse.git"
  },
  "homepage": "https://github.com/talesofai/clawhouse#readme",
  "bugs": {
    "url": "https://github.com/talesofai/clawhouse/issues"
  },
  "bin": {
    "lobster-house": "bin/cli.js"
  },
  "scripts": {
    "dev": "node src/cli.ts",
    "start": "node bin/cli.js",
    "type-check": "tsc --noEmit",
    "build": "rimraf bin && tsc",
    "postbuild": "node scripts/postbuild.js",
    "sync-apis": "node scripts/sync-apis-from-neta-skills.js"
  },
  "dependencies": {
    "@commander-js/extra-typings": "^14.0.0",
    "axios": "^1.7.9",
    "commander": "^14.0.0",
    "dotenv": "^16.4.7",
    "dotenv-flow": "^4.1.0",
    "qs": "^6.15.0",
    "yaml": "^2.8.2",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/qs": "^6.14.0",
    "rimraf": "^6.1.3",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 建议

**推荐方案A**（作为neta-skills的子skill）：

**原因**:
1. ✅ 代码共享，减少重复
2. ✅ 统一版本管理
3. ✅ 清晰的项目结构
4. ✅ 便于维护和更新
5. ✅ 符合neta-skills的skill架构

**实施步骤**:
1. 在neta-skills中创建skills/clawhouse/
2. 移动clawhouse代码
3. 删除重复的API代码
4. 从neta-skills导入API
5. 更新package.json和README
6. 测试所有命令

## 代码迁移示例

**当前**:
```typescript
// src/apis/tcp.ts - 复制的代码
export class TcpApi {
  async searchTCPs(params) { ... }
}
```

**改进后**:
```typescript
// src/apis/index.ts
export { TcpApi } from 'neta-skills/apis';
export type { Apis } from 'neta-skills/apis';
```

## 时间估计

- 方案A实施: 2-3小时
- 方案B实施: 1小时
- 测试: 1小时

---

*文档创建时间: 2026年3月8日 10:16 GMT+8*
*优先级: 中等（不影响当前功能，但影响长期维护）*
