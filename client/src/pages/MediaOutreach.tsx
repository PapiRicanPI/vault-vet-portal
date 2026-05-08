import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Mail, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TEMPLATES = {
  "Day 1 -- Initial Contact": (org: string, contact: string) => ({
    subject: `Press Inquiry -- The Vault Investigates`,
    html: `<p>Dear ${contact || org},</p><p>My name is [Your Name] from <strong>The Vault Investigates</strong>, an independent investigative media project documenting exploitation in the aid and poverty-content industry across the Philippines, Puerto Rico, and the United States.</p><p>We are currently preparing a major investigative report and would welcome the opportunity to speak with your editorial team. We believe this story is of significant public interest.</p><p>Please reply at your earliest convenience or contact us at vaultinvestigates@protonmail.com.</p><p>Best regards,<br/>The Vault Investigates</p>`,
  }),
  "Day 2 -- Follow-up": (org: string, contact: string) => ({
    subject: `Follow-up: Press Inquiry -- The Vault Investigates`,
    html: `<p>Dear ${contact || org},</p><p>I'm following up on my message from yesterday regarding our investigative report. We have exclusive documentation and sources that may be of significant interest to your publication.</p><p>We are on a tight editorial timeline and would appreciate a response by end of week.</p><p>Best regards,<br/>The Vault Investigates</p>`,
  }),
  "Day 3 -- Final Follow-up": (org: string, contact: string) => ({
    subject: `Final Follow-up -- The Vault Investigates`,
    html: `<p>Dear ${contact || org},</p><p>This is our final follow-up regarding our investigative report. We will be proceeding with publication shortly.</p><p>If you'd like to comment or request an advance copy for review, please contact us at vaultinvestigates@protonmail.com before [DATE].</p><p>Best regards,<br/>The Vault Investigates</p>`,
  }),
  "Exclusive Offer": (org: string, contact: string) => ({
    subject: `Exclusive Story Offer -- The Vault Investigates`,
    html: `<p>Dear ${contact || org},</p><p>We would like to offer <strong>${org}</strong> an exclusive first look at our upcoming investigative report on exploitation in the poverty-content industry.</p><p>This is a significant story with documented evidence, named sources, and cross-border implications. We believe it aligns strongly with your publication's mission.</p><p>Please reply to discuss terms and timeline.</p><p>Best regards,<br/>The Vault Investigates</p>`,
  }),
};

const DAY_SEQUENCE = ["Day 1", "Day 2", "Day 3", "Complete"] as const;

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = { Pending: "badge-pending", Sent: "badge-sent", Responded: "badge-responded", Archived: "badge-archived" };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls[status] ?? ""}`}>{status}</span>;
}

function DayBadge({ day }: { day: string }) {
  const cls: Record<string, string> = { "Day 1": "bg-blue-900/40 text-blue-300", "Day 2": "bg-yellow-900/40 text-yellow-300", "Day 3": "bg-orange-900/40 text-orange-300", Complete: "bg-green-900/40 text-green-300" };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border border-transparent ${cls[day] ?? ""}`}>{day}</span>;
}

export default function MediaOutreach() {
  const utils = trpc.useUtils();
  const { data: contacts = [], isLoading } = trpc.media.list.useQuery({});
  const createMutation = trpc.media.create.useMutation({ onSuccess: () => { utils.media.list.invalidate(); toast.success("Contact added"); setShowCreate(false); } });
  const sendEmailMutation = trpc.media.sendEmail.useMutation({ onSuccess: () => { utils.media.list.invalidate(); toast.success("Email sent"); setShowCompose(false); } });
  const updateMutation = trpc.media.update.useMutation({ onSuccess: () => utils.media.list.invalidate() });

  const [showCreate, setShowCreate] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeTemplate, setComposeTemplate] = useState("Day 1 -- Initial Contact");
  const [composeEmail, setComposeEmail] = useState("");
  const [territoryFilter, setTerritoryFilter] = useState("all");
  const [form, setForm] = useState({ orgName: "", contactName: "", email: "", country: "", territory: "Philippines" as any });

  const selected = contacts.find((c) => c.id === selectedId);
  const filtered = territoryFilter === "all" ? contacts : contacts.filter((c) => c.territory === territoryFilter);

  function getNextDay(current: string): typeof DAY_SEQUENCE[number] {
    const idx = DAY_SEQUENCE.indexOf(current as any);
    return DAY_SEQUENCE[Math.min(idx + 1, DAY_SEQUENCE.length - 1)];
  }

  return (
    <VaultLayout title="Media Outreach">
      <div className="space-y-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Media Outreach</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Top authorities & press contacts</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="mr-1" /> Add Contact</Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "Philippines", "Puerto Rico", "United States", "Other"].map((t) => (
            <button key={t} onClick={() => setTerritoryFilter(t)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${territoryFilter === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "All Territories" : t}
            </button>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="vault-table">
              <thead><tr><th>Organization</th><th>Contact</th><th>Territory</th><th>Status</th><th>Sequence</th><th>Last Template</th><th>Actions</th></tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No contacts yet</td></tr>
                  : filtered.map((c) => (
                    <tr key={c.id}>
                      <td><p className="font-medium text-foreground text-sm">{c.orgName}</p>{c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}</td>
                      <td className="text-sm text-muted-foreground">{c.contactName ?? "--"}</td>
                      <td className="text-xs text-muted-foreground">{c.territory}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td><DayBadge day={c.daySequence} /></td>
                      <td className="text-xs text-muted-foreground">{c.lastTemplateUsed ?? "--"}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setSelectedId(c.id); setComposeEmail(c.email ?? ""); setComposeTemplate(`${c.daySequence} -- ${c.daySequence === "Day 1" ? "Initial Contact" : c.daySequence === "Day 2" ? "Follow-up" : "Final Follow-up"}`); setShowCompose(true); }}>
                            <Mail size={11} className="mr-1" /> Email
                          </Button>
                          <Select value={c.status} onValueChange={(v) => updateMutation.mutate({ id: c.id, status: v as any })}>
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
            <DialogHeader><DialogTitle>Add Media Contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Organization *</Label><Input className="mt-1" value={form.orgName} onChange={(e) => setForm({ ...form, orgName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Contact Name</Label><Input className="mt-1" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} /></div>
                <div><Label className="text-xs">Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Country</Label><Input className="mt-1" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
                <div><Label className="text-xs">Territory</Label>
                  <Select value={form.territory} onValueChange={(v) => setForm({ ...form, territory: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["Philippines", "Puerto Rico", "United States", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.orgName || createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Compose Modal */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Compose Email -- {selected?.orgName}</DialogTitle></DialogHeader>
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
                  <p className="font-medium text-foreground mb-1">{TEMPLATES[composeTemplate as keyof typeof TEMPLATES]?.(selected.orgName, selected.contactName ?? "")?.subject}</p>
                  <div dangerouslySetInnerHTML={{ __html: TEMPLATES[composeTemplate as keyof typeof TEMPLATES]?.(selected.orgName, selected.contactName ?? "")?.html ?? "" }} className="text-muted-foreground" />
                </div>
              )}
              <Button className="w-full" onClick={() => {
                if (!selectedId || !selected || !composeEmail) return;
                const tpl = TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.orgName, selected.contactName ?? "");
                sendEmailMutation.mutate({ contactId: selectedId, to: composeEmail, subject: tpl.subject, html: tpl.html, templateName: composeTemplate, nextDay: getNextDay(selected.daySequence) });
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
