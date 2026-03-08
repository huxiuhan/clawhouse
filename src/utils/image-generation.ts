import { buildMakeImagePayload } from "../apis/types.ts";
import { polling } from "./polling.ts";

export interface ImageGenerationOptions {
  vtokens: any[];
  aspect?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  entranceUuid?: string;
  toolcallUuid?: string;
  collectionUuid?: string;
  pictureUuid?: string;
}

export interface ImageResult {
  task_uuid: string;
  task_status: string;
  artifacts: Array<{
    uuid: string;
    status: string;
    url: string;
    modality: string;
  }>;
}

/**
 * 共享的图片生成逻辑
 * 用于adopt和travel命令
 */
export async function generateImage(
  apis: any,
  options: ImageGenerationOptions,
  meta: any,
  sendNotification: any,
  log: any,
): Promise<ImageResult> {
  const {
    vtokens,
    aspect = "1:1",
    entranceUuid,
    toolcallUuid,
    collectionUuid,
    pictureUuid,
  } = options;

  const payload = buildMakeImagePayload(
    vtokens,
    {
      make_image_aspect: aspect,
      context_model_series: "8_image_edit",
      entrance_uuid: entranceUuid,
      toolcall_uuid: toolcallUuid,
    },
    {
      collection_uuid: collectionUuid,
      picture_uuid: pictureUuid,
    },
  );

  const task_uuid = await apis.artifact.makeImage(payload);
  log.info("generateImage: task %s", task_uuid);

  const startTime = Date.now();
  const timeout = 60 * 1000 * 10;
  const res = await polling(
    () => apis.artifact.task(task_uuid),
    async (pollResult: any) => {
      await sendNotification({
        method: "notifications/progress",
        params: {
          progressToken: meta?.progressToken ?? task_uuid,
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

  return res.isTimeout
    ? { task_uuid, task_status: "TIMEOUT", artifacts: [] }
    : (res.result as ImageResult);
}
