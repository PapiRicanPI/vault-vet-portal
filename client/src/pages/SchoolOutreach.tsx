import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Mail, Plus, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const TEMPLATES = {
  "Fellowship Recruitment": (school: string) => ({
    subject: `Fellowship Opportunity -- The Vault Investigates Research Program`,
    html: `<p>Dear ${school} Administration,</p><p>We are reaching out from <strong>The Vault Investigates</strong>, an independent investigative media project, to introduce our Research Fellowship Program.</p><p>We are seeking motivated students and faculty who are passionate about investigative journalism, OSINT research, and social accountability. Fellows receive mentorship, access to our case files, and co-authorship opportunities.</p><p>We would love to schedule a brief presentation for your students. Please reply to this email or contact us at vaultinvestigates@protonmail.com.</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
  "Follow-up": (school: string) => ({
    subject: `Following Up -- The Vault Investigates Fellowship`,
    html: `<p>Dear ${school} Administration,</p><p>I wanted to follow up on our previous message about the Research Fellowship Program at <strong>The Vault Investigates</strong>.</p><p>We remain very interested in partnering with your institution. Please let us know if you have any questions or would like more information.</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
  "Partnership Proposal": (school: string) => ({
    subject: `Academic Partnership Proposal -- The Vault Investigates`,
    html: `<p>Dear ${school} Administration,</p><p>We would like to formally propose an academic partnership between your institution and <strong>The Vault Investigates</strong>. This partnership would include joint research projects, guest lectures, and student fellowship opportunities.</p><p>We look forward to discussing this further at your earliest convenience.</p><p>Best regards,<br/>The Vault Investigates Team</p>`,
  }),
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Pending: "badge-pending", Sent: "badge-sent", "Follow-up Sent": "badge-sent",
    Responded: "badge-responded", Archived: "badge-archived",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${cls[status] ?? ""}`}>{status}</span>;
}

export default function SchoolOutreach() {
  const utils = trpc.useUtils();
  const { data: contacts = [], isLoading } = trpc.school.list.useQuery({});
  const createMutation = trpc.school.create.useMutation({ onSuccess: () => { utils.school.list.invalidate(); toast.success("Contact added"); setShowCreate(false); } });
  const sendEmailMutation = trpc.school.sendEmail.useMutation({ onSuccess: () => { utils.school.list.invalidate(); toast.success("Email sent"); setShowCompose(false); } });
  const csvImportMutation = trpc.school.csvImport.useMutation({ onSuccess: (d) => { utils.school.list.invalidate(); toast.success(`Imported ${d.imported} schools`); } });
  const updateMutation = trpc.school.update.useMutation({ onSuccess: () => utils.school.list.invalidate() });

  const [showCreate, setShowCreate] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composeTemplate, setComposeTemplate] = useState("Fellowship Recruitment");
  const [composeEmail, setComposeEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ schoolName: "", principalName: "", email: "", phone: "", region: "", province: "", municipality: "" });

  const selected = contacts.find((c) => c.id === selectedId);

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => csvImportMutation.mutate({ csvData: ev.target?.result as string });
    reader.readAsText(file);
  }

  return (
    <VaultLayout title="School Outreach">
      <div className="space-y-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">School Outreach</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fellowship recruitment contacts</p>
          </div>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={csvImportMutation.isPending}>
              <Upload size={14} className="mr-1" /> {csvImportMutation.isPending ? "Importing..." : "CSV Import"}
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} className="mr-1" /> Add Contact</Button>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <table className="vault-table">
              <thead>
                <tr><th>School</th><th>Principal</th><th>Region</th><th>Status</th><th>Last Template</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                ) : contacts.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No contacts yet. Add one or import a CSV.</td></tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c.id}>
                      <td><p className="font-medium text-foreground text-sm">{c.schoolName}</p>{c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}</td>
                      <td className="text-sm text-muted-foreground">{c.principalName ?? "--"}</td>
                      <td className="text-xs text-muted-foreground">{[c.region, c.province].filter(Boolean).join(", ") || "--"}</td>
                      <td><StatusBadge status={c.status} /></td>
                      <td className="text-xs text-muted-foreground">{c.lastTemplateUsed ?? "--"}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => { setSelectedId(c.id); setComposeEmail(c.email ?? ""); setShowCompose(true); }}>
                            <Mail size={11} className="mr-1" /> Email
                          </Button>
                          <Select value={c.status} onValueChange={(v) => updateMutation.mutate({ id: c.id, status: v as any })}>
                            <SelectTrigger className="h-6 w-28 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["Pending", "Sent", "Follow-up Sent", "Responded", "Archived"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            <DialogHeader><DialogTitle>Add School Contact</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label className="text-xs">School Name *</Label><Input className="mt-1" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Principal</Label><Input className="mt-1" value={form.principalName} onChange={(e) => setForm({ ...form, principalName: e.target.value })} /></div>
                <div><Label className="text-xs">Email</Label><Input className="mt-1" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">Region</Label><Input className="mt-1" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
                <div><Label className="text-xs">Province</Label><Input className="mt-1" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} /></div>
                <div><Label className="text-xs">Municipality</Label><Input className="mt-1" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate(form)} disabled={!form.schoolName || createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Compose Modal */}
        <Dialog open={showCompose} onOpenChange={setShowCompose}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader><DialogTitle>Compose Email -- {selected?.schoolName}</DialogTitle></DialogHeader>
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
                  <p className="font-medium text-foreground mb-1">{TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.schoolName).subject}</p>
                  <div dangerouslySetInnerHTML={{ __html: TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected.schoolName).html }} className="text-muted-foreground" />
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => selectedId && sendEmailMutation.mutate({ contactId: selectedId, to: composeEmail, ...TEMPLATES[composeTemplate as keyof typeof TEMPLATES](selected?.schoolName ?? ""), templateName: composeTemplate, isFollowUp: composeTemplate === "Follow-up" })} disabled={!composeEmail || sendEmailMutation.isPending}>
                  <Mail size={14} className="mr-1" /> {sendEmailMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VaultLayout>
  );
}
