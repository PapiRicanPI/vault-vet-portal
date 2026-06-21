#!/usr/bin/env node
// build-api.mjs
// Bundles the TypeScript serverless function source (kept in api-src/,
// which is NOT scanned by Vercel as a function directory) into compiled,
// self-contained .js output at api/ (which IS scanned by Vercel).
//
// This is idempotent and safe to run on every build, including a fresh
// clone where api/*.js doesn't exist yet, or a rebuild where it does.

import { build } from "esbuild";
import { mkdirSync } from "node:fs";

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

mkdirSync("api/trpc", { recursive: true });

await buildEntry("api-src/server.ts", "api/server.js");
await buildEntry("api-src/trpc/[trpc].ts", "api/trpc/[trpc].js");

console.log("✅ API functions compiled from api-src/ into api/");
