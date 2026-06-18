#!/bin/bash
# ============================================================
# vault_trpc_vercel_fix.command
# Rewires tRPC → Vercel serverless functions → Supabase
# Kills TypeError: Invalid URL from dead Manus backend
# The Vault Investigates — vault-vet-portal
# ============================================================

set -e

REPO="$HOME/vault-vet-portal"
LOG="$HOME/SOF-PH/TheVault/00_admin/Logs/Vault_Ops_Logs/$(date +%Y-%m-%d)_trpc_fix.md"

echo "🔴 VaultOps — tRPC → Vercel Serverless Fix"
echo "============================================"

cd "$REPO"

# ── 1. INSTALL DEPS ──────────────────────────────────────────
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
npm install @trpc/server@^10 @trpc/client@^10 @trpc/react-query@^10 @tanstack/react-query@^4 --legacy-peer-deps

# ── 2. CREATE VERCEL API ROUTE ───────────────────────────────
echo "⚙️  Creating Vercel serverless tRPC handler..."
mkdir -p api

cat > api/trpc/\[trpc\].js << 'HANDLER'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../src/server/routers/_app';
import { createContext } from '../../src/server/context';

export const config = { runtime: 'edge' };

export default function handler(req) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });
}
HANDLER

echo "✅ api/trpc/[trpc].js created"

# ── 3. CREATE SERVER CONTEXT (SUPABASE) ──────────────────────
echo "⚙️  Creating tRPC server context with Supabase..."
mkdir -p src/server

cat > src/server/context.js << 'CONTEXT'
import { createClient } from '@supabase/supabase-js';

export function createContext({ req }) {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );
  return { supabase, req };
}
CONTEXT

echo "✅ src/server/context.js created"

# ── 4. CREATE APP ROUTER ─────────────────────────────────────
echo "⚙️  Creating base appRouter..."
mkdir -p src/server/routers

cat > src/server/routers/_app.js << 'ROUTER'
import { initTRPC } from '@trpc/server';

const t = initTRPC.context().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return { status: 'ok', vault: 'operational', timestamp: new Date().toISOString() };
  }),
});

export type AppRouter = typeof appRouter;
ROUTER

echo "✅ src/server/routers/_app.js created"

# ── 5. FIX CLIENT-SIDE tRPC URL ──────────────────────────────
echo "⚙️  Fixing client-side tRPC URL (killing Manus endpoint)..."
mkdir -p src/utils

cat > src/utils/trpc.js << 'CLIENT'
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact();

export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        // Points to Vercel serverless — no more Manus URL
        url: '/api/trpc',
      }),
    ],
  });
}
CLIENT

echo "✅ src/utils/trpc.js — Manus URL killed, pointing to /api/trpc"

# ── 6. UPDATE VERCEL.JSON ────────────────────────────────────
echo "⚙️  Updating vercel.json..."
cat > vercel.json << 'VERCEL'
{
  "buildCommand": "vite build",
  "outputDirectory": "dist/public",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/trpc/:path*", "destination": "/api/trpc/[trpc]" }
  ]
}
VERCEL

echo "✅ vercel.json updated with tRPC rewrite rule"

# ── 7. CHECK ENV VARS EXIST ──────────────────────────────────
echo ""
echo "🔍 Checking .env.local for required Supabase vars..."
if [ -f .env.local ]; then
  grep -q "VITE_SUPABASE_URL" .env.local && echo "  ✅ VITE_SUPABASE_URL found" || echo "  ❌ MISSING: VITE_SUPABASE_URL"
  grep -q "VITE_SUPABASE_ANON_KEY" .env.local && echo "  ✅ VITE_SUPABASE_ANON_KEY found" || echo "  ❌ MISSING: VITE_SUPABASE_ANON_KEY"
else
  echo "  ⚠️  No .env.local found — creating template..."
  cat > .env.local << 'ENV'
VITE_SUPABASE_URL=https://qvtnteafmibntryyorjd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
ENV
  echo "  ⚠️  Fill in VITE_SUPABASE_ANON_KEY in .env.local before deploying"
fi

# ── 8. COMMIT + DEPLOY ───────────────────────────────────────
echo ""
echo "🚀 Committing and deploying to Vercel..."
git add -A
git commit -m "fix: rewire tRPC to Vercel serverless, kill Manus backend URL"
git push origin main

vercel --prod --scope the-vault-archivists-projects

# ── 9. LOG ───────────────────────────────────────────────────
mkdir -p "$(dirname "$LOG")"
cat >> "$LOG" << LOGENTRY

## $(date +%Y-%m-%d\ %H:%M) — tRPC Vercel Fix Deployed
- api/trpc/[trpc].js → Vercel edge function ✅
- src/server/context.js → Supabase client ✅
- src/server/routers/_app.js → base appRouter ✅
- src/utils/trpc.js → client URL = /api/trpc ✅
- vercel.json → rewrite rule added ✅
- Manus backend URL: KILLED ✅
- Status: DEPLOYED TO PRODUCTION
LOGENTRY

echo ""
echo "============================================"
echo "✅ tRPC → Vercel → Supabase: LIVE"
echo "🌐 vet.thevaultinvestigates.cloud"
echo "🇵🇷 Follow the money. Stay in the lane."
