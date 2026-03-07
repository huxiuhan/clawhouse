import { readFileSync } from "node:fs";
import yaml from "yaml";
import type { ZodObject } from "zod";

const locale = "zh_cn";

export const parseMeta = <T extends ZodObject>(
  schema: T,
  importMeta: ImportMeta,
) => {
  const file = readFileSync(
    importMeta.filename.replace(/\.(ts|js)$/, `.${locale}.yml`),
    "utf-8",
  );
  return schema.parse(yaml.parse(file));
};
