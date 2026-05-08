import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { toast } from "sonner";

const ROLE_COLORS: Record<string, string> = {
  Observer: "bg-gray-700/60 text-gray-300",
  Researcher: "bg-blue-900/60 text-blue-300",
  Custodian: "bg-purple-900/60 text-purple-300",
  Admin: "bg-yellow-900/60 text-yellow-300",
};

const TIER_COLORS: Record<string, string> = {
  Free: "bg-gray-700/60 text-gray-300",
  Supporter: "bg-blue-900/60 text-blue-300",
  Investigator: "bg-yellow-900/60 text-yellow-300",
};

export default function UserManagement() {
  const utils = trpc.useUtils();
  const { data: users = [], isLoading } = trpc.users.list.useQuery();
  const updateRoleMutation = trpc.users.updatePortalRole.useMutation({ onSuccess: () => { utils.users.list.invalidate(); toast.success("Role updated"); } });
  const updateTierMutation = trpc.users.updateDownloadTier.useMutation({ onSuccess: () => { utils.users.list.invalidate(); toast.success("Tier updated"); } });

  return (
    <VaultLayout title="User Management">
      <div className="space-y-4 max-w-5xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">User Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{users.length} registered users</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="vault-table">
              <thead>
                <tr><th>User</th><th>Email</th><th>Portal Role</th><th>Download Tier</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No users yet</td></tr>
                ) : (
                  (users as any[]).map((u: any) => (
                    <tr key={u.id}>
                      <td>
                        <p className="font-medium text-foreground text-sm">{u.name ?? "Unknown"}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{u.openId?.slice(0, 12)}...</p>
                      </td>
                      <td className="text-sm text-muted-foreground">{u.email ?? "--"}</td>
                      <td>
                        <Select value={u.portalRole ?? "Observer"} onValueChange={(v) => updateRoleMutation.mutate({ userId: u.id, portalRole: v as any })}>
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Observer", "Researcher", "Custodian", "Admin"].map((r) => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td>
                        <Select value={u.downloadTier ?? "Free"} onValueChange={(v) => updateTierMutation.mutate({ userId: u.id, downloadTier: v as any })}>
                          <SelectTrigger className="h-7 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Free", "Supporter", "Investigator"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="text-xs text-muted-foreground">
                        {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "--"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </VaultLayout>
  );
}
