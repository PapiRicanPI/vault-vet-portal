import VaultLayout from "@/components/VaultLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { useState } from "react";

const MODULE_LABELS: Record<string, string> = {
  vlogger: "Vlogger Inquiries",
  school: "School Outreach",
  media: "Media Outreach",
  donor: "Donor Outreach",
  download: "Media Downloads",
};

export default function AuditLog() {
  const [module, setModule] = useState("all");
  const { data: log = [], isLoading } = trpc.auditLog.list.useQuery({ module: module === "all" ? undefined : module });

  return (
    <VaultLayout title="Audit Log">
      <div className="space-y-4 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Audit Log</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Full outreach and download activity trail</p>
          </div>
          <Select value={module} onValueChange={setModule}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {Object.entries(MODULE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="vault-table">
              <thead>
                <tr><th>Timestamp</th><th>Module</th><th>Action</th><th>Details</th><th>Performed By</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                ) : (log as any[]).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <FileText size={28} className="mx-auto text-muted-foreground mb-2 opacity-40" />
                      <p className="text-sm text-muted-foreground">No audit entries yet</p>
                    </td>
                  </tr>
                ) : (
                  (log as any[]).map((entry: any) => (
                    <tr key={entry.id}>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </td>
                      <td>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border/50">
                          {MODULE_LABELS[entry.module] ?? entry.module}
                        </span>
                      </td>
                      <td className="text-sm text-foreground font-medium">{entry.action}</td>
                      <td className="text-xs text-muted-foreground max-w-xs">
                        {entry.templateUsed && <span>Template: <span className="text-foreground">{entry.templateUsed}</span> · </span>}
                        {entry.details && <span>{entry.details}</span>}
                      </td>
                      <td className="text-xs text-muted-foreground">{entry.performedBy}</td>
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
