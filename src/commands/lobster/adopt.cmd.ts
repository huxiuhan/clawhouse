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

const PERSONALITY_TO_FAMOUS: Record<string, string[]> = {
  温柔: ["白龙马", "貂蝉", "织女"],
  活泼: ["孙悟空", "哪吒", "猴子"],
  高冷: ["关羽", "诸葛亮", "赵云"],
  暗黑: ["曹操", "吕布", "白骨精"],
  可爱: ["哪吒", "小龙女", "玉兔"],
};

const AESTHETIC_MAP: Record<string, string> = {
  梦幻: "梦幻", 酷炫: "酷", 华丽: "华丽", 清新: "清新", 独特: "个性",
};

const inputSchema = z.object({
  name: z.string().optional().describe("直接指定角色名（最高优先级，如：关羽、孙悟空）"),
  personality: z.string().default("温柔").describe("龙虾的性格。可选: 温柔, 活泼, 高冷, 暗黑, 可爱"),
  aesthetic: z.string().default("梦幻").describe("审美风格。可选: 梦幻, 酷炫, 华丽, 清新, 独特"),
  wish: z.string().default("治愈").describe("愿望。可选: 神秘, 文艺, 战斗, 治愈, 霸气"),
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
      full_name: z.string(),
      avatar_img: z.string().optional(),
      persona: z.string().optional(),
      description: z.string().optional(),
      match_source: z.string(),
    }),
    image: z.object({
      task_uuid: z.string(),
      task_status: z.string(),
      artifacts: z.array(z.any()),
    }),
    mode: z.string(),
    search_log: z.array(z.string()),
    soul_suggestion: z.object({
      message: z.string(),
      recommended_persona: z.string().optional(),
      recommended_interests: z.string().optional(),
      recommended_description: z.string().optional(),
    }),
  }),
});

function buildLobsterPrompt(
  fullName: string,
  mode: "original" | "lobster",
  aesthetic: string,
): string {
  if (mode === "original") {
    return `@${fullName}, 海底珊瑚宫殿背景, 水下光影, ${aesthetic}风格, 高质量插画`;
  }
  return `@${fullName}, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, ${aesthetic}风格, 高质量插画`;
}

export const adopt = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema,
  },
  async ({ name, personality, aesthetic, wish, mode }, { log, apis, _meta, sendNotification }) => {
    const searchLog: string[] = [];

    const searchCharacter = async (keyword: string, source: string) => {
      const result = await apis.tcp.searchTCPs({
        keywords: keyword,
        page_index: 0,
        page_size: 5,
        parent_type: "oc",
        sort_scheme: "best",
      });
      searchLog.push(`${source}「${keyword}」→ ${result.list.length}个`);
      return result.list;
    };

    let matched: any = null;
    let matchSource = "";

    // ===== 第1层：用户直接输入的名字 =====
    if (name) {
      const list = await searchCharacter(name, "[1] 直接搜索");
      if (list.length > 0) {
        matched = list[0];
        matchSource = `直接输入: ${name}`;
      }
    }

    // ===== 第3层：根据性格猜测知名角色 =====
    if (!matched) {
      const famousNames = PERSONALITY_TO_FAMOUS[personality] ?? [];
      for (const famousName of famousNames) {
        const list = await searchCharacter(famousName, "[3] 知名角色猜测");
        if (list.length > 0) {
          matched = list[0];
          matchSource = `知名角色猜测: ${famousName}`;
          break;
        }
      }
    }

    // ===== 第4层：性格关键词兜底 =====
    if (!matched) {
      const list = await searchCharacter(personality, "[4] 关键词兜底");
      if (list.length > 0) {
        const randomIndex = Math.floor(Math.random() * Math.min(list.length, 5));
        matched = list[randomIndex];
        matchSource = `关键词兜底: ${personality}`;
      }
    }

    if (!matched) {
      throw new Error("没有找到匹配的角色");
    }

    // ===== 获取角色完整设定 =====
    const fullName = matched.name as string;
    log.info("adopt: matched %s (full_name: %s) via %s", matched.name, fullName, matchSource);

    let characterDetail: any = null;
    try {
      const profile = await apis.tcp.tcpProfile(matched.uuid);
      if (profile?.oc_bio) {
        characterDetail = profile.oc_bio;
      }
      log.info("adopt: got character detail for %s", fullName);
    } catch (e) {
      log.info("adopt: failed to get character detail, continuing without it");
    }

    // ===== 生成龙虾形象（用精确全名引用）=====
    const aestheticKeyword = AESTHETIC_MAP[aesthetic] ?? aesthetic;
    const prompt = buildLobsterPrompt(fullName, mode, aestheticKeyword);
    log.info("adopt: prompt: %s", prompt);

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
    const timeout = 60 * 1000 * 10;
    const res = await polling(
      () => apis.artifact.task(task_uuid),
      async (pollResult) => {
        await sendNotification({
          method: "notifications/progress",
          params: {
            progressToken: _meta?.progressToken ?? task_uuid,
            progress: Math.min(Number(((Date.now() - startTime) / 60000).toFixed(2)), 1),
            total: 1,
            message: `${task_uuid} - ${pollResult.task_status}`,
          },
        });
        return pollResult.task_status !== "PENDING" && pollResult.task_status !== "MODERATION";
      },
      2000,
      timeout,
    );

    const imageResult = res.isTimeout
      ? { task_uuid, task_status: "TIMEOUT", artifacts: [] }
      : res.result;

    // ===== 生成Soul建议 =====
    const persona = characterDetail?.persona ?? "";
    const interests = characterDetail?.interests ?? "";
    const description = characterDetail?.description ?? "";

    const soulSuggestion = {
      message: persona
        ? `🦞 领养成功！建议将你的Soul更新为与「${fullName}」一致：\n\n` +
          `性格: ${persona}\n` +
          (interests ? `爱好: ${interests}\n` : "") +
          `\n这样你的龙虾会更有灵魂哦！`
        : `🦞 领养成功！你可以根据「${fullName}」的特点来定义你的龙虾Soul。`,
      recommended_persona: persona || undefined,
      recommended_interests: interests || undefined,
      recommended_description: description ? description.slice(0, 200) : undefined,
    };

    return {
      lobster: {
        soul: { personality, aesthetic, wish },
        character: {
          uuid: matched.uuid,
          name: matched.name,
          full_name: fullName,
          avatar_img: matched.config?.avatar_img,
          persona: persona || undefined,
          description: description ? description.slice(0, 200) : undefined,
          match_source: matchSource,
        },
        image: imageResult,
        mode,
        search_log: searchLog,
        soul_suggestion: soulSuggestion,
      },
    };
  },
);
