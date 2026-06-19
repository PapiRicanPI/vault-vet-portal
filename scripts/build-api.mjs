#!/usr/bin/env node
// build-api.mjs
// Bundles the two Vercel serverless function entry points and their full
// local dependency tree into single self-contained .js files. Output uses
// distinct filenames (not matching the .ts source) so Vercel's function
// scan finds both the source .ts and bundled .js as separate functions —
// vercel.json rewrites route all real traffic to the bundled versions only.
//
// Run as part of `npm run build`, after `vite build`.

import { build } from "esbuild";

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

await buildEntry("api/server.ts", "api/server-bundled.js");
await buildEntry("api/trpc/[trpc].ts", "api/trpc-bundled.js");

console.log("✅ API functions bundled successfully");
