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

// 性格 → 猜测的知名角色名（第3层搜索）
const PERSONALITY_TO_FAMOUS: Record<string, string[]> = {
  温柔: ["白龙马", "貂蝉", "织女"],
  活泼: ["孙悟空", "哪吒", "猴子"],
  高冷: ["关羽", "诸葛亮", "赵云"],
  暗黑: ["曹操", "吕布", "白骨精"],
  可爱: ["哪吒", "小龙女", "玉兔"],
};

// 性格 → 关键词（第4层兜底搜索）
const PERSONALITY_KEYWORDS: Record<string, string> = {
  温柔: "温柔",
  活泼: "活泼",
  高冷: "高冷",
  暗黑: "暗黑",
  可爱: "可爱",
};

const inputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe("用户直接输入的角色名（最高优先级）"),
  soul_description: z
    .string()
    .optional()
    .describe("用户Soul文件中的性格描述"),
  personality: z
    .string()
    .describe("龙虾的性格。可选: 温柔, 活泼, 高冷, 暗黑, 可爱"),
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
      match_source: z.string(),
    }),
  ),
  search_log: z.array(z.string()),
});

export const matchSoul = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema,
  },
  async ({ name, soul_description, personality, count }, { apis }) => {
    const candidates: Array<{
      uuid: string;
      name: string;
      avatar_img?: string;
      match_source: string;
    }> = [];
    const searchLog: string[] = [];

    const searchAndCollect = async (
      keyword: string,
      source: string,
    ): Promise<number> => {
      const result = await apis.tcp.searchTCPs({
        keywords: keyword,
        page_index: 0,
        page_size: 10,
        parent_type: "oc",
        sort_scheme: "best",
      });

      let added = 0;
      for (const item of result.list) {
        if (!candidates.find((c) => c.uuid === item.uuid)) {
          candidates.push({
            uuid: item.uuid,
            name: item.name,
            avatar_img: item.config?.avatar_img,
            match_source: source,
          });
          added++;
        }
      }
      return added;
    };

    // ===== 第1层：用户直接输入的名字（最高优先级）=====
    if (name) {
      const found = await searchAndCollect(name, `直接输入: ${name}`);
      searchLog.push(`[1] 直接搜索「${name}」→ 找到${found}个角色`);
      if (candidates.length >= count) {
        return {
          matched_characters: candidates.slice(0, count),
          search_log: searchLog,
        };
      }
    }

    // ===== 第2层：用户Soul文件中的性格描述 =====
    if (soul_description) {
      const found = await searchAndCollect(
        soul_description,
        `Soul描述: ${soul_description}`,
      );
      searchLog.push(
        `[2] Soul描述搜索「${soul_description}」→ 找到${found}个角色`,
      );
      if (candidates.length >= count) {
        return {
          matched_characters: candidates.slice(0, count),
          search_log: searchLog,
        };
      }
    }

    // ===== 第3层：根据性格猜测的知名角色名 =====
    const famousNames = PERSONALITY_TO_FAMOUS[personality] ?? [];
    for (const famousName of famousNames) {
      if (candidates.length >= count) break;
      const found = await searchAndCollect(
        famousName,
        `知名角色猜测: ${famousName}`,
      );
      searchLog.push(
        `[3] 知名角色搜索「${famousName}」→ 找到${found}个角色`,
      );
    }
    if (candidates.length >= count) {
      return {
        matched_characters: candidates.slice(0, count),
        search_log: searchLog,
      };
    }

    // ===== 第4层：直接用性格关键词兜底 =====
    const keyword = PERSONALITY_KEYWORDS[personality] ?? personality;
    const found = await searchAndCollect(keyword, `性格关键词: ${keyword}`);
    searchLog.push(`[4] 关键词兜底搜索「${keyword}」→ 找到${found}个角色`);

    return {
      matched_characters: candidates.slice(0, count),
      search_log: searchLog,
    };
  },
);
