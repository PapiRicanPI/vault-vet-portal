import { initTRPC } from '@trpc/server';

const t = initTRPC.context().create();
export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  healthCheck: publicProcedure.query(() => ({
    status: 'ok', vault: 'operational', timestamp: new Date().toISOString()
  })),
});
