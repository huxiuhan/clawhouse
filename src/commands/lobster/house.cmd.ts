import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import z from "zod";
import { generateImage } from "../../utils/image-generation.ts";
import { parseMeta } from "../../utils/parse_meta.ts";
import { createCommand } from "../factory.ts";
import { type TaskResult, taskResultSchema } from "../schema.ts";
import type { Vtokens } from "../../utils/prompts.ts";

const meta = parseMeta(
  z.object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
  }),
  import.meta,
);

const inputSchema = z.object({
  character_name: z
    .string()
    .optional()
    .describe("角色名称。可选，默认从SOUL.md读取"),
  character_description: z
    .string()
    .optional()
    .describe("角色设定描述。可选，默认从SOUL.md的设定/性格读取"),
  soul_path: z
    .string()
    .default(process.env["SOUL_PATH"] ?? "SOUL.md")
    .describe("SOUL.md文件路径。默认: SOUL.md"),
  room_style: z
    .enum(["温暖", "神秘", "梦幻", "冒险", "学术"])
    .default("温暖")
    .describe("小屋氛围主题。可选: 温暖, 神秘, 梦幻, 冒险, 学术"),
  map_style: z
    .enum(["hybrid", "stardew", "pokemon"])
    .default("hybrid")
    .describe("地图视觉参考。hybrid=星露谷+宝可梦, stardew=偏星露谷, pokemon=偏宝可梦"),
  aspect: z
    .enum(["1:1", "3:4", "4:3", "9:16", "16:9"])
    .default("4:3")
    .describe("图片宽高比。默认: 4:3"),
});

function normalizeCharacterName(name: string): string {
  return name.replace(/(?:（龙虾化）|\(龙虾化\))$/, "").trim();
}

function readIdentityFromSoul(soulPath: string): {
  characterName: string;
  characterDescription: string;
  lobsterized: boolean;
} | null {
  try {
    const content = readFileSync(resolve(soulPath), "utf-8");
    const nameMatch = content.match(/- \*\*名字\*\*:\s*(.+)$/m);
    const settingMatch = content.match(/- \*\*设定\*\*:\s*(.+)$/m);
    const personalityMatch = content.match(/- \*\*性格\*\*:\s*(.+)$/m);
    const hobbyMatch = content.match(/- \*\*爱好\*\*:\s*(.+)$/m);
    const modeMatch = content.match(/- \*\*形象模式\*\*:\s*(.+)$/m);
    const lobsterizedMatch = content.match(/- \*\*是否龙虾化\*\*:\s*(.+)$/m);

    const rawName = nameMatch?.[1]?.trim();
    if (!rawName) return null;
    const characterName = normalizeCharacterName(rawName);
    const mode = (modeMatch?.[1] ?? "").trim().toLowerCase();
    const lobsterizedText = (lobsterizedMatch?.[1] ?? "").trim();
    const lobsterized = mode === "lobster" ||
      lobsterizedText === "是" ||
      lobsterizedText === "true" ||
      /龙虾化/.test(rawName) ||
      /- \*\*(龙虾图片|形象图片)\*\*:\s*https?:\/\//m.test(content);

    const description = settingMatch?.[1]?.trim() ||
      personalityMatch?.[1]?.trim() ||
      hobbyMatch?.[1]?.trim() ||
      `${characterName}的设定元素`;

    return {
      characterName,
      characterDescription: description,
      lobsterized,
    };
  } catch {
    return null;
  }
}

function resolveLobsterized(
  inputName: string | undefined,
  normalizedName: string,
  soulIdentity: ReturnType<typeof readIdentityFromSoul>,
): boolean {
  if (!inputName) return soulIdentity?.lobsterized ?? false;
  if (inputName.includes("龙虾化")) return true;
  if (soulIdentity && normalizedName === soulIdentity.characterName) {
    return soulIdentity.lobsterized;
  }
  return false;
}

function buildHousePrompt(
  characterName: string,
  characterDescription: string,
  roomStyle: string,
  lobsterized: boolean,
  mapStyle: "hybrid" | "stardew" | "pokemon",
): string {
  const mapStyleHint = mapStyle === "stardew"
    ? "星露谷式 16-bit 农场生活像素地图"
    : mapStyle === "pokemon"
    ? "宝可梦式 top-down tilemap 像素地图"
    : "星露谷 + 宝可梦融合风格的 top-down tilemap 像素地图";
  const characterFormHint = lobsterized
    ? "保留龙虾拟人化特征（甲壳、触须、钳形元素）"
    : "保留角色原型特征";
  return `@${characterName}, 像素游戏地图, ${mapStyleHint}, ${roomStyle}氛围, 单张完整小屋地图, 俯视/顶视角, 清晰网格瓦片地形, 房间分区明确（卧室、工作区、收纳区、展示区）, 角色以Q版地图角色出现在屋内, ${characterFormHint}, 将角色设定融入家具与物件：${characterDescription}, 统一色板, 细节丰富, 不要写实, 不要海报构图, 高质量像素地图`;
}

export const house = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema: taskResultSchema,
  },
  async (
    {
      character_name,
      character_description,
      soul_path,
      room_style,
      map_style,
      aspect,
    },
    { apis, _meta, sendNotification, log },
  ) => {
    const soulIdentity = readIdentityFromSoul(soul_path);
    const inputCharacterName = character_name?.trim();
    const resolvedCharacterName = normalizeCharacterName(
      inputCharacterName || soulIdentity?.characterName || "",
    );
    if (!resolvedCharacterName) {
      throw new Error(
        "SOUL.md中没有找到角色信息，请先执行 adopt，或手动传入 --character_name",
      );
    }
    const resolvedCharacterDescription = character_description?.trim() ||
      soulIdentity?.characterDescription ||
      `${resolvedCharacterName}的设定元素`;
    const resolvedLobsterized = resolveLobsterized(
      inputCharacterName,
      resolvedCharacterName,
      soulIdentity,
    );
    log?.info(
      "house: character=%s, source=%s, lobsterized=%s, map_style=%s",
      resolvedCharacterName,
      character_name ? "input" : "soul",
      resolvedLobsterized,
      map_style,
    );

    try {
      const prompt = buildHousePrompt(
        resolvedCharacterName,
        resolvedCharacterDescription,
        room_style,
        resolvedLobsterized,
        map_style,
      );
      log?.info("house: prompt: %s", prompt);

      let vtokens: Vtokens[] = [];
      try {
        vtokens = (await apis.prompt.parseVtokens(prompt)) ?? [];
      } catch (e) {
        log?.error("house: failed to parse vtokens, fallback freetext: %s", e);
        vtokens = [{ type: "freetext", weight: 1, value: prompt }];
      }

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
      const parsed = taskResultSchema.parse(imageResult);
      return {
        task_uuid: parsed.task_uuid,
        task_status: parsed.task_status,
        artifacts: parsed.artifacts,
      } satisfies TaskResult;
    } catch (error) {
      log?.error(`Error in house: ${error}`);
      return {
        task_uuid: "unknown",
        task_status: "FAILURE",
        artifacts: [],
      } satisfies TaskResult;
    }
  },
);
