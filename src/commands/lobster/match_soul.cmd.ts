import z from "zod";
import { parseMeta } from "../../utils/parse_meta.ts";
import { createCommand } from "../factory.ts";

const meta = parseMeta(
  z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  import.meta,
);

// Soul问答到搜索关键词的映射
const PERSONALITY_MAP: Record<string, string> = {
  温柔: "温柔",
  活泼: "活泼",
  高冷: "高冷",
  暗黑: "暗黑",
  可爱: "可爱",
};

const AESTHETIC_MAP: Record<string, string> = {
  梦幻: "梦幻",
  酷炫: "酷",
  华丽: "华丽",
  清新: "清新",
  独特: "个性",
};

const WISH_MAP: Record<string, string> = {
  神秘: "神秘",
  文艺: "文艺",
  战斗: "战斗",
  治愈: "治愈",
  霸气: "霸气",
};

const inputSchema = z.object({
  personality: z
    .string()
    .describe(
      "龙虾的性格。可选: 温柔, 活泼, 高冷, 暗黑, 可爱",
    ),
  aesthetic: z
    .string()
    .describe(
      "龙虾的审美风格。可选: 梦幻, 酷炫, 华丽, 清新, 独特",
    ),
  wish: z
    .string()
    .describe(
      "龙虾的愿望。可选: 神秘, 文艺, 战斗, 治愈, 霸气",
    ),
  count: z
    .number()
    .default(3)
    .describe("返回匹配角色数量，默认3个"),
});

const outputSchema = z.object({
  matched_characters: z.array(
    z.object({
      uuid: z.string(),
      name: z.string(),
      avatar_img: z.string().optional(),
      match_keyword: z.string(),
    }),
  ),
  soul_profile: z.object({
    personality: z.string(),
    aesthetic: z.string(),
    wish: z.string(),
    keywords: z.array(z.string()),
  }),
});

export const matchSoul = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema,
  },
  async ({ personality, aesthetic, wish, count }, { log, apis }) => {
    // 将用户选择映射为搜索关键词
    const personalityKeyword = PERSONALITY_MAP[personality] ?? personality;
    const aestheticKeyword = AESTHETIC_MAP[aesthetic] ?? aesthetic;
    const wishKeyword = WISH_MAP[wish] ?? wish;

    const keywords = [personalityKeyword, aestheticKeyword, wishKeyword];

    log.debug("match_soul: keywords: %o", keywords);

    // 依次用关键词搜索，收集候选角色
    const candidates: Array<{
      uuid: string;
      name: string;
      avatar_img?: string;
      match_keyword: string;
    }> = [];

    for (const keyword of keywords) {
      const result = await apis.tcp.searchTCPs({
        keywords: keyword,
        page_index: 0,
        page_size: 10,
        parent_type: "oc",
        sort_scheme: "best",
      });

      for (const item of result.list) {
        // 去重
        if (!candidates.find((c) => c.uuid === item.uuid)) {
          candidates.push({
            uuid: item.uuid,
            name: item.name,
            avatar_img: item.config?.avatar_img,
            match_keyword: keyword,
          });
        }
      }
    }

    // 随机打乱并取前count个
    const shuffled = candidates.sort(() => Math.random() - 0.5);
    const matched = shuffled.slice(0, count);

    return {
      matched_characters: matched,
      soul_profile: {
        personality,
        aesthetic,
        wish,
        keywords,
      },
    };
  },
);
