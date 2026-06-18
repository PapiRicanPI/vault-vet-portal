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
