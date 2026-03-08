import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import z from "zod";
import { ApiResponseError } from "../../utils/errors.ts";
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

const inputSchema = z.object({
  collection_uuid: z
    .string()
    .optional()
    .describe("指定玩法UUID作为旅行目的地。不指定则自动推荐"),
  soul_path: z
    .string()
    .default(process.env["SOUL_PATH"] ?? "SOUL.md")
    .describe("SOUL.md文件路径。默认: SOUL.md"),
  aspect: z
    .enum(["1:1", "3:4", "4:3", "9:16", "16:9"])
    .default("1:1")
    .describe("图片宽高比。默认: 1:1"),
});

const outputSchema = z.object({
  travel: z.object({
    character_name: z.string(),
    destination: z.object({
      uuid: z.string().optional(),
      name: z.string(),
      description: z.string(),
      url: z.string(),
    }),
    image: z.object({
      task_uuid: z.string(),
      task_status: z.string(),
      artifacts: z.array(z.any()),
    }),
  }),
});

/** 从SOUL.md中读取当前角色名 */
function readCharacterFromSoul(soulPath: string): string | null {
  try {
    const content = readFileSync(resolve(soulPath), "utf-8");
    const nameMatch = content.match(/- \*\*名字\*\*:\s*(.+)$/m);
    if (nameMatch?.[1]) {
      return nameMatch[1]
        .trim()
        .replace(/(?:（龙虾化）|\(龙虾化\))$/, "")
        .trim();
    }
  } catch {}
  return null;
}

function extractCoreInput(ctaInfo: any): string {
  const fromLaunchPrompt = ctaInfo?.launch_prompt?.core_input;
  if (typeof fromLaunchPrompt === "string" && fromLaunchPrompt.trim()) {
    return fromLaunchPrompt.trim();
  }

  if (Array.isArray(ctaInfo?.choices)) {
    for (const choice of ctaInfo.choices) {
      const fromChoice = choice?.core_input;
      if (typeof fromChoice === "string" && fromChoice.trim()) {
        return fromChoice.trim();
      }
    }
  }

  return "";
}

async function discoverCollection(apis: any, log: any): Promise<{
  uuid: string;
  name: string;
}> {
  // 优先用 suggest_content 发现玩法（与 neta-skills 推荐流一致）
  const suggested = await apis.recsys
    .suggestContent({
      page_index: 0,
      page_size: 20,
      scene: "agent_intent",
      business_data: {
        intent: "recommend",
        search_keywords: [],
        tax_paths: [],
        tax_primaries: [],
        tax_secondaries: [],
        tax_tertiaries: [],
        exclude_keywords: [],
        exclude_tax_paths: [],
      },
    })
    .catch(() => null);

  const candidates: Array<{ uuid: string; name: string }> = [];

  for (const item of suggested?.module_list ?? []) {
    const maybeUuid = item?.json_data?.uuid ?? item?.data_id ?? "";
    const maybeName = item?.json_data?.name ?? "未知目的地";
    if (typeof maybeUuid === "string" && maybeUuid) {
      candidates.push({ uuid: maybeUuid, name: maybeName });
    }
  }

  if (candidates.length > 0) {
    const picked = candidates[Math.floor(Math.random() * candidates.length)]!;
    log.info("travel: discovered via suggest_content: %s", picked.uuid);
    return picked;
  }

  // fallback：从互动流发现
  const feedResult = await apis.feeds.interactiveList({
    page_index: 0,
    page_size: 10,
  });

  const collections = feedResult.module_list?.filter(
    (m: any) => m.template_id === "NORMAL",
  );

  if (!collections || collections.length === 0) {
    throw new Error("没有发现可以旅行的玩法");
  }

  const pick = collections[Math.floor(Math.random() * collections.length)] as any;
  const uuid = pick?.json_data?.uuid ?? pick?.json_data?.storyId ?? pick?.data_id;
  if (!uuid) {
    throw new Error("发现玩法失败：缺少collection uuid");
  }

  return {
    uuid,
    name: pick?.json_data?.name ?? "未知目的地",
  };
}

async function readCollection(apis: any, uuid: string): Promise<{
  name: string;
  description: string;
  url: string;
  coreInput: string;
}> {
  const item = await apis.feeds.interactiveItem({ collection_uuid: uuid });
  if (!item || item.template_id !== "NORMAL") {
    throw new Error(`玩法不存在或无法读取: ${uuid}`);
  }

  const data = item.json_data;
  return {
    name: data?.name ?? "未知目的地",
    description: typeof data?.description === "string"
      ? data.description.slice(0, 100)
      : "",
    url: `https://app.nieta.art/collection/interaction?uuid=${uuid}`,
    coreInput: extractCoreInput(data?.cta_info),
  };
}

export const travel = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema,
  },
  async (
    { collection_uuid, soul_path, aspect },
    { log, apis, _meta, sendNotification },
  ) => {
    // 1. 读取当前角色
    const characterName = readCharacterFromSoul(soul_path);
    if (!characterName) {
      throw new Error(
        "SOUL.md中没有找到角色信息，请先使用 adopt 命令领养一个角色",
      );
    }
    log.info("travel: current character: %s", characterName);

    // 2. 获取目的地玩法
    let collectionUuid = collection_uuid;
    let collectionName = "";
    if (!collectionUuid) {
      log.info("travel: no destination specified, discovering...");
      const discovered = await discoverCollection(apis, log);
      collectionUuid = discovered.uuid;
      collectionName = discovered.name;
    }

    if (!collectionUuid) {
      throw new Error("无法获取玩法UUID");
    }

    // 3. read_collection：读取玩法完整信息
    log.info("travel: read_collection %s", collectionUuid);
    const collection = await readCollection(apis, collectionUuid);
    collectionName = collectionName || collection.name;
    const collectionDesc = collection.description;
    const collectionUrl = collection.url;
    const coreInput = collection.coreInput;

    log.info("travel: destination: %s", collectionName);

    // 4. 构建旅行prompt
    const fallbackPrompt = `@${characterName}, ${collectionName}, 梦幻风格, 高质量插画`;
    let prompt: string;
    if (coreInput) {
      // 用玩法的prompt模板，替换角色
      prompt = coreInput
        .replace(/\{@character\}/g, `@${characterName}`)
        .replace(/\{角色名称\}|\{角色名\}/g, characterName)
        .replace(/（角色名称）/g, characterName);
      if (!prompt.includes(`@${characterName}`)) {
        prompt = `@${characterName}, ${prompt}`;
      }
    } else {
      // 没有模板，用通用旅行prompt
      prompt = fallbackPrompt;
    }
    log.info("travel: prompt: %s", prompt);

    // 5. 生成旅行图片
    let vtokens = await apis.prompt.parseVtokens(prompt).catch(async (error: any) => {
      if (
        coreInput &&
        error instanceof ApiResponseError &&
        error.message.includes("搜索关键字过多")
      ) {
        log.warn(
          "travel: prompt too long for parser, fallback to generic prompt",
        );
        prompt = fallbackPrompt;
        return (await apis.prompt.parseVtokens(prompt)) ?? [];
      }
      throw error;
    });
    vtokens = vtokens ?? [];
    const imageResult = await generateImage(
      apis,
      {
        vtokens,
        aspect,
        entranceUuid: _meta?.entrance_uuid,
        toolcallUuid: _meta?.toolcall_uuid,
        collectionUuid: _meta?.inherit?.collection_uuid,
        pictureUuid: _meta?.inherit?.picture_uuid,
      },
      _meta,
      sendNotification,
      log,
    );

    return {
      travel: {
        character_name: characterName,
        destination: {
          uuid: collectionUuid,
          name: collectionName,
          description: collectionDesc,
          url: collectionUrl,
        },
        image: imageResult,
      },
    };
  },
);
