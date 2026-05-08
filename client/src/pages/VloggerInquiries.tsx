import VaultLayout from "@/components/VaultLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ChevronDown, Clock, Mail, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TEMPLATES = {
  "Initial Outreach": (name: string) => ({
    subject: `Collaboration Inquiry -- The Vault Investigates`,
    html: `<p>Hi ${name},</p><p>My name is [Your Name] with <strong>The Vault Investigates</strong>, an independent investigative media project documenting poverty-exploitation content across the Philippines, Puerto Rico, and the United States.</p><p>We've been following your channel and believe your platform could play an important role in bringing these issues to a wider audience. We'd love to discuss a potential collaboration.</p><p>Would you be open to a brief call this week?</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
  "Follow-up Day 7": (name: string) => ({
    subject: `Following Up -- The Vault Investigates Collaboration`,
    html: `<p>Hi ${name},</p><p>I wanted to follow up on my previous message regarding a potential collaboration with <strong>The Vault Investigates</strong>.</p><p>We're still very interested in working with you and would love to hear your thoughts. Please let me know if you have any questions.</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
  "Follow-up Day 14": (name: string) => ({
    subject: `Last Follow-up -- The Vault Investigates`,
    html: `<p>Hi ${name},</p><p>This is my final follow-up regarding our collaboration inquiry. We completely understand if the timing isn't right.</p><p>If you'd like to revisit this in the future, please don't hesitate to reach out to us at vaultinvestigates@protonmail.com.</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
  "Partnership Proposal": (name: string) => ({
    subject: `Partnership Proposal -- The Vault Investigates`,
    html: `<p>Hi ${name},</p><p>We'd like to formally propose a content partnership with <strong>The Vault Investigates</strong>. We can offer exclusive access to our case files, expert interviews, and co-branded investigative content.</p><p>Please find our partnership brief attached. We'd love to schedule a call to discuss further.</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Pending: "badge-pending",
    Sent: "badge-sent",
    Responded: "badge-responded",
    Archived: "badge-archived",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls[status] ?? ""}`}>{status}</span>;
}

export default function VloggerInquiries() {
  const utils = trpc.useUtils();
  const { data: inquiries = [], isLoading } = trpc.vlogger.list.useQuery({});
  const createMutation = trpc.vlogger.create.useMutation({ onSuccess: () => { utils.vlogger.list.invalidate(); toast.success("Inquiry created"); setShowCreate(false); } });
  const updateMutation = trpc.vlogger.update.useMutation({ onSuccess: () => { utils.vlogger.list.invalidate(); toast.success("Updated"); } });
  const sendEmailMutation = trpc.vlogger.sendEmail.useMutation({ onSuccess: () => { utils.vlogger.list.invalidate(); toast.success("Email sent"); setShowCompose(false); } });

  const [showCreate, setShowCreate] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deadlineSlider, setDeadlineSlider] = useState([14]);
  const [composeTemplate, setComposeTemplate] = useState("Initial Outreach");
  const [composeEmail, setComposeEmail] = useState("");

  const { data: auditLog = [] } = trpc.vlogger.auditLog.useQuery(
    { inquiryId: selectedId! },
    { enabled: showAudit && selectedId !== null }
  );

  const filtered = statusFilter === "all" ? inquiries : inquiries.filter((i) => i.status === statusFilter);
  const selected = inquiries.find((i) => i.id === selectedId);

  const [form, setForm] = useState({ creatorName: "", platform: "YouTube", channelUrl: "", contactEmail: "", notes: "" });

  function openCompose(id: number) {
    setSelectedId(id);
    const inq = inquiries.find((i) => i.id === id);
    setComposeEmail(inq?.contactEmail ?? "");
    setShowCompose(true);
  }

  function handleSendEmail() {
    if (!selectedId || !composeEmail) return;
    const inq = inquiries.find((i) => i.id === selectedId);
    const tpl = TEMPLATES[composeTemplate as keyof typeof TEMPLATES](inq?.creatorName ?? "");
    sendEmailMutation.mutate({ inquiryId: selectedId, to: composeEmail, subject: tpl.subject, html: tpl.html, templateName: composeTemplate });
  }

  return (
    <VaultLayout title="Vlogger Inquiries">
      <div className="space-y-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Vlogger Inquiries</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track creator outreach pipeline</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} className="mr-1" /> New Inquiry
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {["all", "Pending", "Sent", "Responded", "Archived"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="vault-table">
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th>Last Template</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No inquiries found</td></tr>
                ) : (
                  filtered.map((inq) => (
                    <tr key={inq.id}>
                      <td>
                        <div>
                          <p className="font-medium text-foreground text-sm">{inq.creatorName}</p>
                          {inq.contactEmail && <p className="text-xs text-muted-foreground">{inq.contactEmail}</p>}
                        </div>
                      </td>
                      <td className="text-sm text-muted-foreground">{inq.platform}</td>
                      <td><StatusBadge status={inq.status} /></td>
                      <td>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock size={11} />
                          {inq.deadlineAt ? format(new Date(inq.deadlineAt), "MMM d") : `${inq.deadlineDays}d`}
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground">{inq.lastTemplateUsed ?? "--"}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => openCompose(inq.id)}>
                            <Mail size={11} className="mr-1" /> Email
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setSelectedId(inq.id); setShowAudit(true); }}>
                            Log
                          </Button>
                          <Select value={inq.status} onValueChange={(v) => updateMutation.mutate({ id: inq.id, status: v as any })}>
                            <SelectTrigger className="h-6 w-24 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Pending", "Sent", "Responded", "Archived"].map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle>New Vlogger Inquiry</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">Creator Name *</Label><Input className="mt-1" value={form.creatorName} onChange={(e) => setForm({ ...form, creatorName: e.target.value })} /></div>
              <div><Label className="text-xs">Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["YouTube", "TikTok", "Instagram", "Facebook", "X/Twitter", "Other"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Channel URL</Label><Input className="mt-1" value={form.channelUrl} onChange={(e) => setForm({ ...form, channelUrl: e.target.value })} /></div>
              <div><Label className="text-xs">Contact Email</Label><Input className="mt-1" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} /></div>
              <div>
                <Label className="text-xs">Deadline: {deadlineSlider[0]} days</Label>
                <Slider className="mt-2" min={7} max={21} step={7} value={deadlineSlider} onValueChange={setDeadlineSlider} />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>7d</span><span>14d</span><span>21d</span></div>
              </div>
              <div><Label className="text-xs">Notes</Label><Textarea className="mt-1 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button className="w-full" onClick={() => createMutation.mutate({ ...form, deadlineDays: String(deadlineSlider[0]) as any })} disabled={!form.creatorName || createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Inquiry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Compose Email Modal */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Compose Email -- {selected?.creatorName}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">To</Label><Input className="mt-1" value={composeEmail} onChange={(e) => setComposeEmail(e.target.value)} /></div>
              <div>
                <Label className="text-xs">Template</Label>
                <Select value={composeTemplate} onValueChange={setComposeTemplate}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(TEMPLATES).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selected && (
                <div className="bg-muted/30 rounded-md p-3 text-xs text-muted-foreground border border-border">
                  <p className="font-medium text-foreground mb-1">{TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.creatorName).subject}</p>
                  <div dangerouslySetInnerHTML={{ __html: TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.creatorName).html }} className="prose prose-sm prose-invert max-w-none" />
                </div>
              )}
              <Button className="w-full" onClick={handleSendEmail} disabled={!composeEmail || sendEmailMutation.isPending}>
                <Mail size={14} className="mr-1" /> {sendEmailMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Audit Log Modal */}
        <Dialog open={showAudit} onOpenChange={setShowAudit}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Audit Trail -- {selected?.creatorName}</DialogTitle></DialogHeader>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {auditLog.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No audit entries yet</p>
              ) : (
                auditLog.map((entry) => (
                  <div key={entry.id} className="bg-muted/20 rounded-md p-2 border border-border/50">
                    <p className="text-xs font-medium text-foreground">{entry.action}</p>
                    {entry.templateUsed && <p className="text-[11px] text-muted-foreground">Template: {entry.templateUsed}</p>}
                    <p className="text-[11px] text-muted-foreground">{entry.performedBy} · {format(new Date(entry.createdAt), "MMM d, yyyy HH:mm")}</p>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VaultLayout>
  );
}
