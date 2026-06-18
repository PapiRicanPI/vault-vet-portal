import { createServer } from '@trpc/server/adapters/standalone';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../src/server/routers/_app.js';
import { createContext } from '../../src/server/context.js';

export const config = { runtime: 'nodejs' };

export default function handler(req, res) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
  });
}
