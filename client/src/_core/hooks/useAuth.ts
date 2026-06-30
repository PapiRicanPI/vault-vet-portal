import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  /** No longer used — redirect logic is handled by the consuming component */
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

/**
 * Core auth hook.
 *
 * Returns a 3-state model:
 *   loading = true  → auth.me query is still in-flight (no redirect decision should be made)
 *   loading = false, user != null → authenticated
 *   loading = false, user == null → unauthenticated
 *
 * The consuming component MUST wait for loading === false before deciding
 * whether to redirect to /admin/login.
 */
export function useAuth(_options?: UseAuthOptions) {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 30_000, // avoid unnecessary refetches within 30s
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error: unknown) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === "UNAUTHORIZED"
      ) {
        // Already logged out — swallow
        return;
      }
      throw error;
    } finally {
      localStorage.removeItem("vault_admin_token");
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    return {
      user: meQuery.data ?? null,
      // loading is true ONLY while the initial fetch is in-flight.
      // Once we have data OR an error, loading becomes false.
      loading: meQuery.isLoading,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(meQuery.data),
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    logoutMutation.error,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
