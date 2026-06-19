#!/usr/bin/env node
// build-api.mjs
// Bundles the two Vercel serverless function entry points and their full
// local dependency tree into single self-contained .js files. This avoids
// Vercel's per-file TypeScript compilation, which does not resolve
// extensionless local imports (server/_core/app, ../routers, etc.) at
// runtime under Node's native ESM loader.
//
// Run as part of `npm run build`, after `vite build`.

import { build } from "esbuild";
import { rmSync } from "node:fs";

const externalPackages = [
  // Keep node_modules packages external (not bundled) — esbuild will still
  // bundle all *local* relative imports, which is the actual problem.
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

await buildEntry("api/server.ts", "api/server.js");
await buildEntry("api/trpc/[trpc].ts", "api/trpc/[trpc].js");

// Remove the .ts sources so Vercel's function scan only sees compiled .js
rmSync("api/server.ts", { force: true });
rmSync("api/trpc/[trpc].ts", { force: true });

console.log("✅ API functions bundled successfully");
