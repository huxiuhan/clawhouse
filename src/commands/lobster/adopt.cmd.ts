import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import z from "zod";
import { parseMeta } from "../../utils/parse_meta.ts";
import { generateImage } from "../../utils/image-generation.ts";
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
  梦幻: "梦幻",
  酷炫: "酷",
  华丽: "华丽",
  清新: "清新",
  独特: "个性",
};

const WISH_TO_IMAGE_STYLE: Record<string, string> = {
  神秘: "探索未知深海, 神秘氛围",
  文艺: "艺术感构图, 诗意氛围",
  战斗: "战斗姿态, 强烈动势",
  治愈: "温暖治愈光感, 安心氛围",
  霸气: "王者气场, 史诗氛围",
};

const inputSchema = z.object({
  name: z
    .string()
    .optional()
    .describe("直接指定角色名（最高优先级，如：关羽、孙悟空）"),
  soul_description: z
    .string()
    .optional()
    .describe("用户Soul文件中的性格描述（第2层搜索）"),
  personality: z
    .string()
    .default("温柔")
    .describe("龙虾的性格。可选: 温柔, 活泼, 高冷, 暗黑, 可爱"),
  aesthetic: z
    .string()
    .default("梦幻")
    .describe("审美风格。可选: 梦幻, 酷炫, 华丽, 清新, 独特"),
  wish: z
    .string()
    .default("治愈")
    .describe("愿望。可选: 神秘, 文艺, 战斗, 治愈, 霸气"),
  mode: z
    .enum(["original", "lobster"])
    .default("lobster")
    .describe("形象模式。original=保留原型, lobster=龙虾化"),
  soul_path: z
    .string()
    .default(process.env["SOUL_PATH"] ?? "SOUL.md")
    .describe("SOUL.md文件路径。默认: SOUL.md 或环境变量 SOUL_PATH"),
});

const outputSchema = z.object({
  lobster: z.object({
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
    soul_updated: z.boolean(),
    soul_path: z.string(),
  }),
});

function buildLobsterPrompt(
  fullName: string,
  mode: "original" | "lobster",
  aesthetic: string,
  wish: string,
): string {
  const wishStyle = WISH_TO_IMAGE_STYLE[wish] ?? `${wish}主题`;

  if (mode === "original") {
    return `@${fullName}, 海底珊瑚宫殿背景, 水下光影, ${aesthetic}风格, ${wishStyle}, 高质量插画`;
  }

  return `@${fullName}, 龙虾拟人化, 身披龙虾甲壳铠甲, 头部有龙虾触须装饰, 手持龙虾钳形武器, 海底珊瑚宫殿背景, 水下光影, ${aesthetic}风格, ${wishStyle}, 高质量插画`;
}

function updateSoulFile(
  soulPath: string,
  fullName: string,
  mode: string,
  persona: string,
  interests: string,
  description: string,
  imageUrl: string,
): boolean {
  const now = new Date().toISOString().split("T")[0];
  const soulFile = resolve(soulPath);

  let soulContent = "";
  try {
    soulContent = readFileSync(soulFile, "utf-8");
  } catch {
    soulContent = "# SOUL.md - 我是谁\n";
  }

  const identityBlock = [
    "## 我的身份\n",
    `- **名字**: ${fullName}`,
    `- **形象模式**: ${mode}`,
    `- **是否龙虾化**: ${mode === "lobster" ? "是" : "否"}`,
    persona ? `- **性格**: ${persona}` : "",
    interests ? `- **爱好**: ${interests}` : "",
    description ? `- **设定**: ${description.slice(0, 200)}` : "",
    imageUrl ? `- **形象图片**: ${imageUrl}` : "",
    `- **领养日期**: ${now}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (soulContent.includes("## 我的身份")) {
    const before = soulContent.split("## 我的身份")[0];
    const afterMatch = soulContent.split("## 我的身份")[1]?.split(/\n## /);
    const rest = afterMatch?.slice(1).join("\n## ");
    soulContent = before + identityBlock + (rest ? `\n\n## ${rest}` : "");
  } else {
    soulContent += `\n\n${identityBlock}`;
  }

  writeFileSync(soulFile, soulContent, "utf-8");
  return true;
}

export const adopt = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema,
  },
  async (
    { name, soul_description, personality, aesthetic, wish, mode, soul_path },
    { log, apis, _meta, sendNotification },
  ) => {
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

    // 第1层：用户直接输入的名字
    if (name) {
      const list = await searchCharacter(name, "[1] 直接搜索");
      if (list.length > 0) {
        matched = list[0];
        matchSource = `直接输入: ${name}`;
      }
    }

    // 第2层：用户Soul描述
    if (!matched && soul_description) {
      const list = await searchCharacter(soul_description, "[2] Soul描述搜索");
      if (list.length > 0) {
        matched = list[0];
        matchSource = `Soul描述: ${soul_description}`;
      }
    }

    // 第3层：根据性格猜测知名角色
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

    // 第4层：性格关键词兜底
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

    // 获取角色完整设定
    const fullName = matched.name as string;
    log.info("adopt: matched %s via %s", fullName, matchSource);

    let persona = "";
    let interests = "";
    let description = "";
    try {
      const profile = await apis.tcp.tcpProfile(matched.uuid);
      if (profile?.oc_bio) {
        persona = profile.oc_bio.persona ?? "";
        interests = profile.oc_bio.interests ?? "";
        description = profile.oc_bio.description ?? "";
      }
    } catch {
      log.info("adopt: failed to get character detail, continuing without it");
    }

    // 生成龙虾形象
    const aestheticKeyword = AESTHETIC_MAP[aesthetic] ?? aesthetic;
    const prompt = buildLobsterPrompt(fullName, mode, aestheticKeyword, wish);
    log.info("adopt: prompt: %s", prompt);

    const vtokens = (await apis.prompt.parseVtokens(prompt)) ?? [];
    const imageResult = await generateImage(
      apis,
      {
        vtokens,
        aspect: "1:1",
        entranceUuid: _meta?.entrance_uuid,
        toolcallUuid: _meta?.toolcall_uuid,
        collectionUuid: _meta?.inherit?.collection_uuid,
        pictureUuid: _meta?.inherit?.picture_uuid,
      },
      _meta,
      sendNotification,
      log,
    );

    // 覆盖SOUL.md
    const imageUrl = imageResult.artifacts?.[0]?.url ?? "";
    let soulUpdated = false;
    try {
      soulUpdated = updateSoulFile(
        soul_path,
        fullName,
        mode,
        persona,
        interests,
        description,
        imageUrl,
      );
      log.info("adopt: SOUL.md updated at %s", resolve(soul_path));
    } catch (e) {
      log.info("adopt: failed to update SOUL.md: %s", e);
    }

    return {
      lobster: {
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
        soul_updated: soulUpdated,
        soul_path: resolve(soul_path),
      },
    };
  },
);
