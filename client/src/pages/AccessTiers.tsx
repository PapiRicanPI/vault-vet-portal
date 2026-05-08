import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Coffee, Heart, Save, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const TIER_ICONS: Record<string, any> = {
  Free: Shield,
  Supporter: Coffee,
  Investigator: Heart,
};

const TIER_DESCRIPTIONS: Record<string, string> = {
  Free: "Default tier for all vetted members. Search and save leads only.",
  Supporter: "Donors via Ko-fi or Buy Me a Coffee. Configurable monthly download limit.",
  Investigator: "Top-tier supporters. Unlimited downloads and priority access.",
};

export default function AccessTiers() {
  const utils = trpc.useUtils();
  const { data: tiers = [], isLoading } = trpc.accessTiers.list.useQuery();
  const updateMutation = trpc.accessTiers.update.useMutation({
    onSuccess: () => { utils.accessTiers.list.invalidate(); toast.success("Tier settings saved"); },
    onError: (e: any) => toast.error(e.message),
  });

  const [edits, setEdits] = useState<Record<string, any>>({});

  useEffect(() => {
    if (tiers.length > 0) {
      const init: Record<string, any> = {};
      (tiers as any[]).forEach((t: any) => { init[t.tier] = { ...t }; });
      setEdits(init);
    }
  }, [tiers]);

  function handleSave(tier: string) {
    const config = edits[tier];
    if (!config) return;
    updateMutation.mutate({
      tier: tier as any,
      canDownload: config.canDownload,
      downloadsPerMonth: parseInt(config.downloadsPerMonth) || 0,
      priorityAccess: config.priorityAccess,
      kofiTier: config.kofiTier,
      bmcTier: config.bmcTier,
    });
  }

  function update(tier: string, field: string, value: any) {
    setEdits((prev) => ({ ...prev, [tier]: { ...prev[tier], [field]: value } }));
  }

  return (
    <VaultLayout title="Access Tiers">
      <div className="space-y-4 max-w-4xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">Download Access Tiers</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Configure tier settings -- changes take effect immediately without code changes</p>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">Loading tier configuration...</div>
        ) : (
          <div className="space-y-4">
            {["Free", "Supporter", "Investigator"].map((tierName) => {
              const config = edits[tierName];
              const Icon = TIER_ICONS[tierName] ?? Shield;
              if (!config) return null;
              return (
                <Card key={tierName} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon size={18} className="text-primary" />
                      <CardTitle className="text-base">{tierName} Tier</CardTitle>
                    </div>
                    <p className="text-xs text-muted-foreground">{TIER_DESCRIPTIONS[tierName]}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Download access toggle */}
                      <div className="flex items-center justify-between bg-muted/20 rounded-md p-3 border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Can Download Files</p>
                          <p className="text-xs text-muted-foreground">Allow file downloads for this tier</p>
                        </div>
                        <Switch checked={config.canDownload ?? false} onCheckedChange={(v) => update(tierName, "canDownload", v)} />
                      </div>

                      {/* Priority access toggle */}
                      <div className="flex items-center justify-between bg-muted/20 rounded-md p-3 border border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">Priority Access</p>
                          <p className="text-xs text-muted-foreground">Priority queue for new case files</p>
                        </div>
                        <Switch checked={config.priorityAccess ?? false} onCheckedChange={(v) => update(tierName, "priorityAccess", v)} />
                      </div>
                    </div>

                    {/* Downloads per month */}
                    {tierName === "Supporter" && (
                      <div className="max-w-xs">
                        <Label className="text-xs">Downloads Per Month (0 = unlimited)</Label>
                        <Input className="mt-1" type="number" min="0" value={config.downloadsPerMonth ?? 0} onChange={(e) => update(tierName, "downloadsPerMonth", e.target.value)} />
                        <p className="text-[11px] text-muted-foreground mt-1">Set to 0 for unlimited downloads</p>
                      </div>
                    )}

                    {/* Donation platform triggers */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-foreground">Donation Platform Integration</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Coffee size={11} /> Ko-fi Tier Label</Label>
                          <Input className="mt-1" placeholder="e.g. supporter" value={config.kofiTier ?? ""} onChange={(e) => update(tierName, "kofiTier", e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs flex items-center gap-1"><Heart size={11} /> BMAC Tier Label</Label>
                          <Input className="mt-1" placeholder="e.g. supporter" value={config.bmcTier ?? ""} onChange={(e) => update(tierName, "bmcTier", e.target.value)} />
                        </div>

                      </div>
                      <p className="text-[11px] text-muted-foreground">When a donation of this amount is received from Ko-fi or BMAC, the donor is automatically upgraded to this tier.</p>
                    </div>

                    <Button size="sm" onClick={() => handleSave(tierName)} disabled={updateMutation.isPending}>
                      <Save size={13} className="mr-1" /> Save {tierName} Settings
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Integration instructions */}
        <Card className="bg-card border-border border-dashed">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Webhook Integration</p>
            <p className="text-xs text-muted-foreground">To automatically upgrade donors, configure your Ko-fi and Buy Me a Coffee webhooks to POST to:</p>
            <code className="block text-xs bg-muted/40 rounded px-2 py-1.5 text-primary font-mono">{window.location.origin}/api/webhooks/donation</code>
            <p className="text-xs text-muted-foreground">The webhook handler will match the donation amount to the configured tier thresholds and upgrade the donor's access automatically.</p>
          </CardContent>
        </Card>
      </div>
    </VaultLayout>
  );
}
