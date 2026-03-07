#!/usr/bin/env node
import { program } from "@commander-js/extra-typings";
import dotenv from "dotenv-flow";
import pkg from "../package.json" with { type: "json" };
import { buildCommands, loadCommands } from "./commands/load.ts";

// Load environment variables
dotenv.config();

program
  .name("lobster-house")
  .description("🦞 龙虾领养馆 - 基于Neta角色匹配的龙虾Soul定义")
  .version(pkg.version);

const commands = await loadCommands(["lobster"]);
await buildCommands(
  program
    .option("--token", "neta token (default: from env NETA_TOKEN)")
    .option(
      "--api_base_url",
      "api base url (default: from env NETA_API_BASE_URL)",
    ),
  commands,
);
program.parse(process.argv);
