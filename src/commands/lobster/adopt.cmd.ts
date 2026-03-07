import z from "zod";
import { buildMakeImagePayload } from "../../apis/types.ts";
import { parseMeta } from "../../utils/parse_meta.ts";
import { polling } from "../../utils/polling.ts";
import { createCommand } from "../factory.ts";

const meta = parseMeta(
  z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  import.meta,
);

const PERSONALITY_MAP: Record<string, string> = {
  温柔: "温柔", 活泼: "活泼", 高冷: "高冷", 暗黑: "暗黑", 可爱: "可爱",
};
const AESTHETIC_MAP: Record<string, string> = {
  梦幻: "梦幻", 酷炫: "酷", 华丽: "华丽", 清新: "清新", 独特: "个性",
};
const WISH_MAP: Record<string, string> = {
  神秘: "神秘", 文艺: "文艺", 战斗: "战斗", 治愈: "治愈", 霸气: "霸气",
};

const inputSchema = z.object({
  personality: z.string().describe("龙虾的性格。可选: 温柔, 活泼, 高冷, 暗黑, 可爱"),
  aesthetic: z.string().describe("龙虾的审美风格。可选: 梦幻, 酷炫, 华丽, 清新, 独特"),
  wish: z.string().describe("龙虾的愿望。可选: 神秘, 文艺, 战斗, 治愈, 霸气"),
  mode: z.enum(["original", "lobster"]).default("lobster").describe("形象模式。original=保留原型, lobster=龙虾化"),
});

const outputSchema = z.object({
  lobster: z.object({
    soul: z.object({
      personality: z.string(),
      aesthetic: z.string(),
      wish: z.string(),
    }),
    character: z.object({
      uuid: z.string(),
      name: z.string(),
      avatar_img: z.string().optional(),
    }),
    image: z.object({
      task_uuid: z.string(),
      task_status: z.string(),
      artifacts: z.array(z.any()),
    }),
    mode: z.string(),
  }),
});

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

export const adopt = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema,
  },
  async ({ personality, aesthetic, wish, mode }, { log, apis, _meta, sendNotification }) => {
    // Step 1: 匹配角色
    const keyword = PERSONALITY_MAP[personality] ?? personality;
    log.info("adopt: searching with keyword: %s", keyword);

    const result = await apis.tcp.searchTCPs({
      keywords: keyword,
      page_index: 0,
      page_size: 10,
      parent_type: "oc",
      sort_scheme: "best",
    });

    if (result.list.length === 0) {
      throw new Error(`没有找到匹配"${keyword}"的角色`);
    }

    // 随机选一个角色
    const randomIndex = Math.floor(Math.random() * Math.min(result.list.length, 5));
    const character = result.list[randomIndex];

    log.info("adopt: matched character: %s (%s)", character.name, character.uuid);

    // Step 2: 生成龙虾形象
    const aestheticKeyword = AESTHETIC_MAP[aesthetic] ?? aesthetic;
    const prompt = buildLobsterPrompt(character.name, mode, aestheticKeyword);

    log.info("adopt: generating image with prompt: %s", prompt);

    const vtokens = (await apis.prompt.parseVtokens(prompt)) ?? [];
    const payload = buildMakeImagePayload(
      vtokens ?? [],
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
    log.info("adopt: image task: %s", task_uuid);

    const startTime = Date.now();
    const duration = 60 * 1000;
    const timeout = 60 * 1000 * 10;
    const res = await polling(
      () => apis.artifact.task(task_uuid),
      async (pollResult) => {
        await sendNotification({
          method: "notifications/progress",
          params: {
            progressToken: _meta?.progressToken ?? task_uuid,
            progress: Math.min(
              Number(((Date.now() - startTime) / duration).toFixed(2)),
              1,
            ),
            total: 1,
            message: `${task_uuid} - ${pollResult.task_status}`,
          },
        });
        return (
          pollResult.task_status !== "PENDING" &&
          pollResult.task_status !== "MODERATION"
        );
      },
      2000,
      timeout,
    );

    const imageResult = res.isTimeout
      ? { task_uuid, task_status: "TIMEOUT", artifacts: [] }
      : res.result;

    // Step 3: 返回完整龙虾档案
    return {
      lobster: {
        soul: { personality, aesthetic, wish },
        character: {
          uuid: character.uuid,
          name: character.name,
          avatar_img: character.config?.avatar_img,
        },
        image: imageResult,
        mode,
      },
    };
  },
);
