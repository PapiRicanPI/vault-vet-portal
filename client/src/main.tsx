import { trpc } from "@/lib/trpc";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

// ─── Token Bootstrap ────────────────────────────────────────────────────────
// If a ?token= param is present in the URL (legacy redirect from login),
// persist it to localStorage and strip it from the URL BEFORE React mounts.
// This ensures the tRPC client will have the token available on first request.
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  const urlToken = params.get("token");
  if (urlToken) {
    localStorage.setItem("vault_admin_token", decodeURIComponent(urlToken));
    // Clean URL without triggering a navigation
    window.history.replaceState({}, "", window.location.pathname);
  }
}

// ─── React Query Client ─────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── tRPC Client ────────────────────────────────────────────────────────────
// Bearer token from localStorage is attached to every request via Authorization header.
// This is the PRIMARY auth mechanism — cookies are a fallback only.
const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: "/api/trpc",
      headers() {
        const token = localStorage.getItem("vault_admin_token");
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
        return {};
      },
    }),
  ],
});

// ─── Render ─────────────────────────────────────────────────────────────────
createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
