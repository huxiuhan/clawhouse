import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
      uuid: z.string(),
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
    const nameMatch = content.match(
      /- \*\*名字\*\*:\s*(.+?)(?:（[^）]+）)?$/m,
    );
    if (nameMatch?.[1]) {
      return nameMatch[1].trim();
    }
  } catch {}
  return null;
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
    let collectionDesc = "";
    let collectionUrl = "";
    let coreInput = "";

    if (!collectionUuid) {
      // 自动推荐：从suggest_content获取
      log.info("travel: no destination specified, discovering...");
      const feedResult = await apis.feeds.interactiveList({
        page_index: 0,
        page_size: 5,
      });

      const collections = feedResult.module_list?.filter(
        (m: any) => m.template_id === "NORMAL",
      );

      if (!collections || collections.length === 0) {
        throw new Error("没有发现可以旅行的玩法");
      }

      // 随机选一个
      const pick = collections[Math.floor(Math.random() * collections.length)] as any;
      collectionUuid = pick?.json_data?.uuid ?? pick?.data_id ?? "";
      collectionName = pick?.json_data?.name ?? "未知目的地";
      collectionUrl = `https://app.nieta.art/collection/interaction?uuid=${collectionUuid}`;
    }

    // 3. 读取玩法详情
    log.info("travel: reading collection %s", collectionUuid);
    const details = await apis.collection.collectionDetails([collectionUuid!]);
    const collectionDetail = details?.[0] as any;

    if (collectionDetail) {
      collectionName =
        collectionName || collectionDetail.name || "未知目的地";
      collectionDesc =
        collectionDetail.description?.slice(0, 100) || "";
      collectionUrl =
        collectionUrl ||
        `https://app.nieta.art/collection/interaction?uuid=${collectionUuid}`;
      coreInput =
        collectionDetail.remix?.launch_prompt?.core_input || "";
    }

    log.info("travel: destination: %s", collectionName);

    // 4. 构建旅行prompt
    let prompt: string;
    if (coreInput) {
      // 用玩法的prompt模板，替换角色
      prompt = coreInput.replace(/\{@character\}/g, `@${characterName}`);
    } else {
      // 没有模板，用通用旅行prompt
      prompt = `@${characterName}, ${collectionName}, 梦幻风格, 高质量插画`;
    }
    log.info("travel: prompt: %s", prompt);

    // 5. 生成旅行图片
    const vtokens = (await apis.prompt.parseVtokens(prompt)) ?? [];
    const payload = buildMakeImagePayload(
      vtokens ?? [],
      {
        make_image_aspect: aspect,
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
    log.info("travel: image task: %s", task_uuid);

    const startTime = Date.now();
    const timeout = 60 * 1000 * 10;
    const res = await polling(
      () => apis.artifact.task(task_uuid),
      async (pollResult) => {
        await sendNotification({
          method: "notifications/progress",
          params: {
            progressToken: _meta?.progressToken ?? task_uuid,
            progress: Math.min(
              Number(((Date.now() - startTime) / 60000).toFixed(2)),
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

    return {
      travel: {
        character_name: characterName,
        destination: {
          uuid: collectionUuid!,
          name: collectionName,
          description: collectionDesc,
          url: collectionUrl,
        },
        image: imageResult,
      },
    };
  },
);
