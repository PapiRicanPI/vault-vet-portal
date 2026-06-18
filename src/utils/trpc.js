import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact();

export function getTRPCClient() {
  return trpc.createClient({
    links: [httpBatchLink({ url: '/api/trpc' })],
  });
}
