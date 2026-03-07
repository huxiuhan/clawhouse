import type { ZodObject, z } from "zod";
import type { Apis } from "../apis/index.ts";

export interface UserData {
  id: number;
  uuid: string;
}

export interface CommandExtra {
  user: UserData | null;
  apis: Apis;
  log: Pick<Console, "error" | "warn" | "info" | "debug">;
  sendNotification: (notification: {
    method: "notifications/progress";
    params: {
      progressToken: string | number;
      progress: number;
      total: number;
      message: string;
    };
  }) => Promise<void>;
  _meta?: {
    progressToken?: string;
  } & {
    inherit?: {
      collection_uuid?: string;
      picture_uuid?: string;
    };
    entrance_uuid?: string;
    toolcall_uuid?: string;
  };
}

type SchemaOutput<T extends ZodObject | undefined> = T extends undefined
  ? never
  : z.infer<T>;

export type CommandExecute<
  Input extends ZodObject | undefined,
  Output extends ZodObject | undefined,
> = Input extends undefined
  ? (
      extra: CommandExtra,
    ) => Promise<SchemaOutput<Output>> | SchemaOutput<Output>
  : (
      args: SchemaOutput<Input>,
      extra: CommandExtra,
    ) => Promise<SchemaOutput<Output>> | SchemaOutput<Output>;

export interface Command<
  Output extends ZodObject | undefined,
  Input extends ZodObject | undefined = undefined,
> {
  name: string;
  title?: string;
  description?: string;
  inputSchema?: Input;
  outputSchema?: Output;
  validate?: (extra: CommandExtra) => Promise<boolean> | boolean;
  execute: CommandExecute<Input, Output>;
  _IS_COMMAND__: true;
}

export const createCommand = <
  Output extends ZodObject | undefined,
  Input extends ZodObject | undefined = undefined,
>(
  command: Omit<Command<Output, Input>, "_IS_COMMAND__" | "execute">,
  execute: CommandExecute<Input, Output>,
): Command<Output, Input> => {
  return {
    ...command,
    execute,
    _IS_COMMAND__: true,
  };
};

export const isCommand = (
  value: unknown,
): value is Command<ZodObject | undefined, ZodObject | undefined> => {
  return (
    typeof value === "object" && value !== null && "_IS_COMMAND__" in value
  );
};
