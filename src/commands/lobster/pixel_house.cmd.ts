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
  character_name: z
    .string()
    .describe("角色名称"),
  character_description: z
    .string()
    .describe("角色设定描述（用于生成符合设定的小物件）"),
  room_style: z
    .string()
    .default("温暖")
    .describe("小屋风格。可选: 温暖, 神秘, 梦幻, 冒险, 学术"),
});

// 根据角色设定生成符合的小物件描述
function generateItemsPrompt(
  characterName: string,
  characterDescription: string,
  roomStyle: string,
): string {
  return `像素艺术风格，${characterName}的小屋里的小物件，${characterDescription}相关的物品，${roomStyle}风格，包括：书籍、装饰品、工具、植物等，高质量像素艺术`;
}

// 生成小屋背景
function generateRoomPrompt(
  characterName: string,
  roomStyle: string,
): string {
  return `像素艺术风格，${characterName}的${roomStyle}小屋内部背景，木质家具、温暖灯光、舒适氛围，俯视图或侧视图，高质量像素艺术`;
}

// 生成像素化角色
function generatePixelCharacterPrompt(characterName: string): string {
  return `@${characterName}, 像素艺术风格, 可爱的像素化人物, 站立姿态, 高质量像素艺术`;
}

export const pixelHouse = createCommand(
  {
    name: meta.name,
    title: meta.title,
    description: meta.description,
    inputSchema,
    outputSchema: taskResultSchema,
  },
  async (
    { character_name, character_description, room_style },
    { apis, _meta, sendNotification },
  ) => {
    const allArtifacts: any[] = [];
    let finalTaskUuid = "";

    const pollTask = async (
      taskUuid: string,
      label: string,
    ): Promise<any> => {
      const startTime = Date.now();
      const duration = 60 * 1000;
      const timeout = 60 * 1000 * 10;

      const res = await polling(
        () => apis.artifact.task(taskUuid),
        async (result) => {
          await sendNotification({
            method: "notifications/progress",
            params: {
              progressToken: _meta?.progressToken ?? taskUuid,
              progress: Math.min(
                Number(((Date.now() - startTime) / duration).toFixed(2)),
                1,
              ),
              total: 1,
              message: `${label} - ${result.task_status}`,
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

      return res.result;
    };

    try {
      // Step 1: 生成像素化角色
      const characterPrompt = generatePixelCharacterPrompt(character_name);
      const characterVtokens =
        (await apis.prompt.parseVtokens(characterPrompt)) ?? [];
      const characterPayload = buildMakeImagePayload(
        characterVtokens,
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

      const characterTaskUuid = await apis.artifact.makeImage(
        characterPayload,
      );
      const characterResult = await pollTask(
        characterTaskUuid,
        "生成像素化角色",
      );
      if (characterResult?.artifacts) {
        allArtifacts.push(...characterResult.artifacts);
      }

      // Step 2: 生成小屋背景
      const roomPrompt = generateRoomPrompt(character_name, room_style);
      const roomVtokens = (await apis.prompt.parseVtokens(roomPrompt)) ?? [];
      const roomPayload = buildMakeImagePayload(
        roomVtokens,
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

      const roomTaskUuid = await apis.artifact.makeImage(roomPayload);
      const roomResult = await pollTask(roomTaskUuid, "生成小屋背景");
      if (roomResult?.artifacts) {
        allArtifacts.push(...roomResult.artifacts);
      }

      // Step 3: 生成小物件
      const itemsPrompt = generateItemsPrompt(
        character_name,
        character_description,
        room_style,
      );
      const itemsVtokens = (await apis.prompt.parseVtokens(itemsPrompt)) ?? [];
      const itemsPayload = buildMakeImagePayload(
        itemsVtokens,
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

      const itemsTaskUuid = await apis.artifact.makeImage(itemsPayload);
      const itemsResult = await pollTask(itemsTaskUuid, "生成小物件");
      if (itemsResult?.artifacts) {
        allArtifacts.push(...itemsResult.artifacts);
      }

      finalTaskUuid = itemsTaskUuid;

      return {
        task_uuid: finalTaskUuid,
        task_status: "SUCCESS",
        artifacts: allArtifacts,
      } satisfies TaskResult;
    } catch (error) {
      return {
        task_uuid: finalTaskUuid || "unknown",
        task_status: "FAILURE",
        artifacts: allArtifacts,
      } satisfies TaskResult;
    }
  },
);
