import z from "zod";
import { buildMakeImagePayload } from "../../apis/types.ts";
import { parseMeta } from "../../utils/parse_meta.ts";
import { polling } from "../../utils/polling.ts";
import { createCommand } from "../factory.ts";
import { type TaskResult, taskResultSchema } from "../schema.ts";

const meta = parseMeta(
  z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  import.meta,
);

const inputSchema = z.object({
  character_uuid: z.string().describe("匹配到的Neta角色UUID"),
  character_name: z.string().describe("匹配到的Neta角色名称"),
  mode: z
    .enum(["original", "lobster"])
    .default("lobster")
    .describe("形象模式。original=保留角色原型风格，lobster=龙虾化角色原型"),
  aesthetic: z.string().default("梦幻").describe("审美风格关键词"),
});

// 根据模式构建prompt
function buildLobsterPrompt(
  characterName: string,
  mode: "original" | "lobster",
  aesthetic: string,
): string {
  if (mode === "original") {
    return `@${characterName}, 海底珊瑚宫殿背景, 水下光影, ${aesthetic}风格, 高质量插画`;
  }
  return `@${characterName}, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, ${aesthetic}风格, 高质量插画`;
}

export const generateLobster = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema: taskResultSchema,
  },
  async (
    { character_uuid, character_name, mode, aesthetic },
    { log, apis, _meta, sendNotification },
  ) => {
    let exactName = character_name;

    // 优先使用UUID拉取角色详情，确保 @引用尽量精确
    try {
      const profile = await apis.tcp.tcpProfile(character_uuid);
      if (profile?.name) {
        exactName = profile.name;
      }
      log.debug("generate_lobster: resolved name by uuid: %s", exactName);
    } catch {
      log.warn(
        "generate_lobster: failed to resolve profile by uuid, fallback to input name",
      );
    }

    const prompt = buildLobsterPrompt(exactName, mode, aesthetic);

    log.debug("generate_lobster: uuid: %s", character_uuid);
    log.debug("generate_lobster: prompt: %s", prompt);
    log.debug("generate_lobster: mode: %s", mode);

    const vtokens = (await apis.prompt.parseVtokens(prompt)) ?? [];

    const payload = buildMakeImagePayload(
      vtokens,
      {
        make_image_aspect: "1:1",
        context_model_series: "8_image_edit",
        entrance_uuid: _meta?.entrance_uuid,
        toolcall_uuid: _meta?.toolcall_uuid,
      },
      {
        collection_uuid: _meta?.inherit?.collection_uuid,
        picture_uuid: _meta?.inherit?.picture_uuid,
      },
    );

    const task_uuid = await apis.artifact.makeImage(payload);
    log.info("generate_lobster: task: %s", task_uuid);

    const startTime = Date.now();
    const duration = 60 * 1000;
    const timeout = 60 * 1000 * 10;
    const res = await polling(
      () => apis.artifact.task(task_uuid),
      async (result) => {
        await sendNotification({
          method: "notifications/progress",
          params: {
            progressToken: _meta?.progressToken ?? task_uuid,
            progress: Math.min(
              Number(((Date.now() - startTime) / duration).toFixed(2)),
              1,
            ),
            total: 1,
            message: `${task_uuid} - ${result.task_status}`,
          },
        });
        return (
          result.task_status !== "PENDING" &&
          result.task_status !== "MODERATION"
        );
      },
      2000,
      timeout,
    );

    if (res.isTimeout) {
      return {
        task_uuid,
        task_status: "TIMEOUT",
        artifacts: [],
      } satisfies TaskResult;
    }

    return res.result;
  },
);
