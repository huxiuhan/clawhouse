# 生成任务追踪（断点续跑）

## 使用规则（OpenClaw 必须执行）

1. 任何 `adopt` / `travel` / `house` 命令只要返回了 `task_uuid`，必须立刻写入本文件。
2. 即使当前状态是 `PENDING` / `TIMEOUT` / `FAILURE`，也要记录，不能等成功后再补。
3. 后续回查到成功时，补上 `最新状态` 和 `图片URL`，并同步到 `README` 案例。
4. 一条任务至少保留：`日期时间`、`命令`、`task_uuid`、`初始状态`、`最新状态`、`图片URL`、`备注`。

## 任务记录表

| 日期时间 | 命令 | task_uuid | 初始状态 | 最新状态 | 图片URL | 备注 |
|---|---|---|---|---|---|---|
| 2026-03-08 22:17 | `npm start -- travel` | `a827727f-f7dc-4ad5-b536-1082b98da5a9` | `PENDING` | `SUCCESS` | `https://oss.talesofai.cn/picture/a827727f-f7dc-4ad5-b536-1082b98da5a9.webp` | 自动发现运动报告玩法 |
| 2026-03-08 23:xx | `npm start -- house --map_style stardew --room_style 温暖` | `0086e608-f654-409f-866e-73a8e2f6e939` | `PENDING` | `SUCCESS` | `https://oss.talesofai.cn/picture/0086e608-f654-409f-866e-73a8e2f6e939.webp` | 最新版像素小屋地图实测 |

## 追加模板（复制这一段）

```markdown
| YYYY-MM-DD HH:mm | `npm start -- <command> ...` | `<task_uuid>` | `PENDING` | `PENDING` |  | <说明> |
```
