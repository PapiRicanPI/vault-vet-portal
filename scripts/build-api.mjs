#!/usr/bin/env node
// build-api.mjs
// Bundles the two Vercel serverless function entry points and their full
// local dependency tree into self-contained .js files, OVERWRITING the
// original .ts source paths. This must run as part of `vercel-build`
// (Vercel's special pre-build script name) so the compiled .js exists
// BEFORE Vercel's own function-detection scan runs.

import { build } from "esbuild";
import { renameSync, rmSync } from "node:fs";

const externalPackages = [
  "express",
  "@trpc/server",
  "axios",
  "cookie",
  "jose",
  "drizzle-orm",
  "postgres",
  "@neondatabase/serverless",
  "superjson",
  "zod",
  "nodemailer",
  "pdf-lib",
  "uuid",
  "csv-parse",
  "nanoid",
  "qrcode",
  "@aws-sdk/client-s3",
  "@aws-sdk/s3-request-presigner",
  "mysql2",
];

async function buildEntry(entry, outfile) {
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    outfile,
    external: externalPackages,
    banner: {
      js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
    },
    logLevel: "info",
  });
}

await buildEntry("api/server.ts", "api/server.tmp.js");
await buildEntry("api/trpc/[trpc].ts", "api/trpc/[trpc].tmp.js");

rmSync("api/server.ts", { force: true });
rmSync("api/trpc/[trpc].ts", { force: true });

renameSync("api/server.tmp.js", "api/server.js");
renameSync("api/trpc/[trpc].tmp.js", "api/trpc/[trpc].js");

console.log("✅ API functions bundled and swapped into place");
