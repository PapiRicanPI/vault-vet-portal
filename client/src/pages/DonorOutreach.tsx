import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Heart, Mail, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TEMPLATES = {
  "Thank You": (name: string) => ({
    subject: `Thank You for Supporting The Vault Investigates`,
    html: `<p>Dear ${name},</p><p>Thank you so much for your generous support of <strong>The Vault Investigates</strong>. Your contribution directly funds our investigative work documenting exploitation in the aid and poverty-content industry.</p><p>Because of supporters like you, we are able to continue this important work. We will keep you updated on our progress.</p><p>With gratitude,<br/>The Vault Investigates Team</p>`,
  }),
  "Impact Update": (name: string) => ({
    subject: `Your Impact -- The Vault Investigates Update`,
    html: `<p>Dear ${name},</p><p>We wanted to share an update on the impact your support has made possible at <strong>The Vault Investigates</strong>.</p><p>This quarter, we have documented [X] new cases, published [Y] reports, and reached [Z] readers across the Philippines, Puerto Rico, and the United States. None of this would be possible without your support.</p><p>Thank you for believing in this work.</p><p>The Vault Investigates Team</p>`,
  }),
  "Upgrade Invitation": (name: string) => ({
    subject: `Exclusive Investigator Access -- The Vault Investigates`,
    html: `<p>Dear ${name},</p><p>As a valued supporter of <strong>The Vault Investigates</strong>, we'd like to invite you to upgrade to our Investigator tier.</p><p>Investigator members receive unlimited access to our media archive, priority access to new case files, and direct communication with our research team.</p><p>Reply to this email or visit our portal to upgrade.</p><p>The Vault Investigates Team</p>`,
  }),
  "Re-engagement": (name: string) => ({
    subject: `We Miss You -- The Vault Investigates`,
    html: `<p>Dear ${name},</p><p>We noticed it's been a while since we've heard from you. We wanted to reach out and share what <strong>The Vault Investigates</strong> has been working on.</p><p>Our team has been investigating [current focus area] and we have some exciting developments to share. We'd love to have you back as an active supporter.</p><p>The Vault Investigates Team</p>`,
  }),
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { Pending: "badge-pending", Sent: "badge-sent", Responded: "badge-responded", Archived: "badge-archived" };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls[status] ?? ""}`}>{status}</span>;
}

export default function DonorOutreach() {
  const utils = trpc.useUtils();
  const { data: donors = [], isLoading } = trpc.donor.list.useQuery({});
  const createMutation = trpc.donor.create.useMutation({ onSuccess: () => { utils.donor.list.invalidate(); toast.success("Donor added"); setShowCreate(false); } });
  const sendEmailMutation = trpc.donor.sendEmail.useMutation({ onSuccess: () => { utils.donor.list.invalidate(); toast.success("Email sent"); setShowCompose(false); } });
  const updateMutation = trpc.donor.update.useMutation({ onSuccess: () => utils.donor.list.invalidate() });

  const [showCreate, setShowCreate] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeTemplate, setComposeTemplate] = useState("Thank You");
  const [composeEmail, setComposeEmail] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ donorName: "", email: "", platform: "Ko-fi", donationAmount: "", territory: "United States" as any });

  const selected = donors.find((d) => d.id === selectedId);
  const filtered = statusFilter === "all" ? donors : donors.filter((d) => d.status === statusFilter);

  return (
    <VaultLayout title="Donor Outreach">
      <div className="space-y-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Donor Outreach</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Donor engagement pipeline</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="mr-1" /> Add Donor</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "Pending", "Sent", "Responded", "Archived"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="vault-table">
              <thead><tr><th>Donor</th><th>Platform</th><th>Amount</th><th>Territory</th><th>Status</th><th>Last Template</th><th>Actions</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No donors yet</td></tr>
                  : filtered.map((d) => (
                    <tr key={d.id}>
                      <td><p className="font-medium text-foreground text-sm">{d.donorName}</p>{d.email && <p className="text-xs text-muted-foreground">{d.email}</p>}</td>
                      <td className="text-sm text-muted-foreground">{d.platform ?? "--"}</td>
                      <td className="text-sm text-muted-foreground">{d.donationAmount ? `$${d.donationAmount}` : "--"}</td>
                      <td className="text-xs text-muted-foreground">{d.territory}</td>
                      <td><StatusBadge status={d.status} /></td>
                      <td className="text-xs text-muted-foreground">{d.lastTemplateUsed ?? "--"}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setSelectedId(d.id); setComposeEmail(d.email ?? ""); setShowCompose(true); }}>
                            <Mail size={11} className="mr-1" /> Email
                          </Button>
                          <Select value={d.status} onValueChange={(v) => updateMutation.mutate({ id: d.id, status: v as any })}>
                            <SelectTrigger className="h-6 w-24 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{["Pending", "Sent", "Responded", "Archived"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle>Add Donor</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Donor Name *</Label><Input className="mt-1" value={form.donorName} onChange={(e) => setForm({ ...form, donorName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label className="text-xs">Platform</Label>
                  <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Ko-fi", "Buy Me a Coffee", "Patreon", "PayPal", "Other"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Donation Amount ($)</Label><Input className="mt-1" type="number" value={form.donationAmount} onChange={(e) => setForm({ ...form, donationAmount: e.target.value })} /></div>
                <div><Label className="text-xs">Territory</Label>
                  <Select value={form.territory} onValueChange={(v) => setForm({ ...form, territory: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Philippines", "Puerto Rico", "United States", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate({ ...form, donationAmount: form.donationAmount ? parseFloat(form.donationAmount) : undefined })} disabled={!form.donorName || createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Donor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Compose Modal */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Compose Email -- {selected?.donorName}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">To</Label><Input className="mt-1" value={composeEmail} onChange={(e) => setComposeEmail(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Template</Label>
                <Select value={composeTemplate} onValueChange={setComposeTemplate}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(TEMPLATES).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selected && (
                <div className="bg-muted/30 rounded-md p-3 text-xs border border-border">
                  <p className="font-medium text-foreground mb-1">{TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.donorName).subject}</p>
                  <div dangerouslySetInnerHTML={{ __html: TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.donorName).html }} className="text-muted-foreground" />
                </div>
              )}
              <Button className="w-full" onClick={() => {
                if (!selectedId || !selected || !composeEmail) return;
                const tpl = TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.donorName);
                sendEmailMutation.mutate({ contactId: selectedId, to: composeEmail, subject: tpl.subject, html: tpl.html, templateName: composeTemplate });
              }} disabled={!composeEmail || sendEmailMutation.isPending}>
                <Mail size={14} className="mr-1" /> {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VaultLayout>
  );
}
