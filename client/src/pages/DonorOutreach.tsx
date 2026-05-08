import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Platform = "kofi" | "buymeacoffee" | "grant" | "individual" | "other";
type DonorStatus = "new" | "thanked" | "follow_up_sent" | "responded" | "declined" | "no_reply";

const PLATFORM_LABELS: Record<Platform, string> = {
  kofi: "Ko-fi",
  buymeacoffee: "Buy Me a Coffee",
  grant: "Grant",
  individual: "Individual",
  other: "Other",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  kofi: "bg-blue-900/40 text-blue-300 border-blue-700",
  buymeacoffee: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  grant: "bg-green-900/40 text-green-300 border-green-700",
  individual: "bg-purple-900/40 text-purple-300 border-purple-700",
  other: "bg-zinc-800 text-zinc-300 border-zinc-600",
};

const STATUS_LABELS: Record<DonorStatus, string> = {
  new: "New",
  thanked: "Thanked",
  follow_up_sent: "Follow-up Sent",
  responded: "Responded",
  declined: "Declined",
  no_reply: "No Reply",
};

const STATUS_COLORS: Record<DonorStatus, string> = {
  new: "bg-zinc-800 text-zinc-400",
  thanked: "bg-blue-900/40 text-blue-300",
  follow_up_sent: "bg-amber-900/40 text-amber-300",
  responded: "bg-green-900/40 text-green-300",
  declined: "bg-red-900/40 text-red-400",
  no_reply: "bg-zinc-700 text-zinc-400",
};

function getFollowUpBadge(followUpDate: number | null | undefined, status: DonorStatus) {
  if (status === "declined" || status === "no_reply") return null;
  if (!followUpDate) return null;
  const now = Date.now();
  const diff = followUpDate - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `Overdue ${Math.abs(days)}d`, cls: "bg-red-900/60 text-red-300 border border-red-700" };
  if (days <= 2) return { label: `Due in ${days}d`, cls: "bg-amber-900/60 text-amber-300 border border-amber-700" };
  return { label: `Follow-up ${new Date(followUpDate).toLocaleDateString()}`, cls: "bg-green-900/40 text-green-300 border border-green-700" };
}

export default function DonorOutreach() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  // toast is imported from sonner directly

  // Filters
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Add contact modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<{ name: string; email: string; platform: Platform; tier: string; country: string; notes: string }>({ name: "", email: "", platform: "kofi", tier: "", country: "", notes: "" });

  // Reply log modal
  const [replyModal, setReplyModal] = useState<{ id: number; name: string } | null>(null);
  const [replyStatus, setReplyStatus] = useState<"responded" | "no_reply" | "declined">("responded");
  const [replyNotes, setReplyNotes] = useState("");

  // Notes editor
  const [editingNotes, setEditingNotes] = useState<{ id: number; notes: string } | null>(null);

  const { data: donors = [], refetch } = trpc.donors.list.useQuery();

  const createMutation = trpc.donors.create.useMutation({
    onSuccess: () => { refetch(); setShowAdd(false); setAddForm({ name: "", email: "", platform: "kofi", tier: "", country: "", notes: "" }); toast.success("Donor added"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.donors.update.useMutation({
    onSuccess: () => { refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.donors.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Donor removed"); },
    onError: (e) => toast.error(e.message),
  });

  const logReplyMutation = trpc.donors.logReply.useMutation({
    onSuccess: () => { refetch(); setReplyModal(null); setReplyNotes(""); toast.success("Reply logged"); },
    onError: (e) => toast.error(e.message),
  });

  const setFollowUpMutation = trpc.donors.setFollowUpDate.useMutation({
    onSuccess: () => { refetch(); toast.success("Follow-up date set"); },
    onError: (e) => toast.error(e.message),
  });

  const updateNotesMutation = trpc.donors.update.useMutation({
    onSuccess: () => { refetch(); setEditingNotes(null); toast.success("Notes saved"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = useMemo(() => {
    return donors.filter((d: any) => {
      if (filterPlatform !== "all" && d.platform !== filterPlatform) return false;
      if (filterStatus !== "all" && d.status !== filterStatus) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !(d.email || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [donors, filterPlatform, filterStatus, search]);

  // Group by platform for summary cards
  const summary = useMemo(() => {
    const counts: Record<string, { total: number; contacted: number; responded: number; converted: number }> = {
      kofi: { total: 0, contacted: 0, responded: 0, converted: 0 },
      bmac: { total: 0, contacted: 0, responded: 0, converted: 0 },
      grant: { total: 0, contacted: 0, responded: 0, converted: 0 },
      other: { total: 0, contacted: 0, responded: 0, converted: 0 },
    };
    donors.forEach((d: any) => {
      const p = d.platform as Platform;
      if (!counts[p]) return;
      counts[p].total++;
      if (d.status !== "not_contacted") counts[p].contacted++;
      if (d.status === "responded" || d.status === "meeting_set") counts[p].responded++;
      if (d.status === "converted") counts[p].converted++;
    });
    return counts;
  }, [donors]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Loading…</div>;
  if (!user || user.role !== "admin") { navigate("/"); return null; }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-amber-400">Donor Outreach Board</h1>
            <p className="text-sm text-zinc-400 mt-0.5">Track Ko-fi supporters, Buy Me a Coffee backers, and grant contacts</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              ← Admin
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
              + Add Donor Contact
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["kofi", "bmac", "grant", "other"] as Platform[]).map((p) => (
            <div key={p} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
              <div className="text-xs text-zinc-500 mb-1">{PLATFORM_LABELS[p]}</div>
              <div className="text-2xl font-bold text-zinc-100">{summary[p].total}</div>
              <div className="text-xs text-zinc-500 mt-2 space-y-0.5">
                <div>{summary[p].contacted} contacted</div>
                <div>{summary[p].responded} responded</div>
                <div className="text-green-400">{summary[p].converted} converted</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-44 bg-zinc-900 border-zinc-700 text-zinc-100">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="kofi">Ko-fi</SelectItem>
              <SelectItem value="bmac">Buy Me a Coffee</SelectItem>
              <SelectItem value="grant">Grant</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 bg-zinc-900 border-zinc-700 text-zinc-100">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="new">New</SelectItem>
                              <SelectItem value="thanked">Thanked</SelectItem>
                              <SelectItem value="follow_up_sent">Follow-up Sent</SelectItem>
                              <SelectItem value="responded">Responded</SelectItem>
                              <SelectItem value="declined">Declined</SelectItem>
                              <SelectItem value="no_reply">No Reply</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-zinc-500">{filtered.length} of {donors.length} contacts</span>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Platform</th>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Tier / Country</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Follow-up</th>
                  <th className="text-left px-4 py-3">Last Contact</th>
                  <th className="text-left px-4 py-3">Notes</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-zinc-500">
                      No donor contacts yet. Click <strong>+ Add Donor Contact</strong> to get started.
                    </td>
                  </tr>
                )}
                {filtered.map((donor: any) => {
                  const followUpBadge = getFollowUpBadge(donor.followUpDate, donor.status);
                  return (
                    <tr key={donor.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-100">{donor.name}</div>
                        {donor.replyNotes && (
                          <div className="text-xs text-zinc-500 mt-0.5 italic truncate max-w-[160px]" title={donor.replyNotes}>
                            "{donor.replyNotes}"
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${PLATFORM_COLORS[donor.platform as Platform] || PLATFORM_COLORS.other}`}>
                          {PLATFORM_LABELS[donor.platform as Platform] || donor.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">{donor.email || "—"}</td>
                      <td className="px-4 py-3 text-zinc-400 text-xs">
                        {donor.tier && <div>{donor.tier}</div>}
                        {donor.country && <div className="text-zinc-500">{donor.country}</div>}
                        {!donor.tier && !donor.country && "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          value={donor.status}
                          onValueChange={(val) => updateMutation.mutate({ id: donor.id, status: val as DonorStatus })}
                        >
                          <SelectTrigger className={`w-36 h-7 text-xs border-0 ${STATUS_COLORS[donor.status as DonorStatus]}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700">
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        {followUpBadge ? (
                          <span className={`text-xs px-2 py-0.5 rounded ${followUpBadge.cls}`}>{followUpBadge.label}</span>
                        ) : (
                          <button
                            onClick={() => setFollowUpMutation.mutate({ id: donor.id, followUpDate: Date.now() + 7 * 24 * 60 * 60 * 1000 })}
                            className="text-xs text-zinc-600 hover:text-amber-400 transition-colors"
                          >
                            + Set Follow-up
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {donor.lastContactedAt ? new Date(donor.lastContactedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        {editingNotes?.id === donor.id ? (
                          <div className="flex gap-1">
                            <Textarea
                              value={editingNotes?.notes ?? ""}
                              onChange={(e) => setEditingNotes(prev => prev ? { ...prev, notes: e.target.value } : null)}
                              className="text-xs bg-zinc-800 border-zinc-700 text-zinc-100 h-16 resize-none"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700" onClick={() => editingNotes && updateNotesMutation.mutate({ id: donor.id, internalNotes: editingNotes.notes })}>✓</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400" onClick={() => setEditingNotes(null)}>✕</Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingNotes({ id: donor.id, notes: (donor.internalNotes as string | null) || "" })}
                            className="text-xs text-zinc-500 hover:text-amber-400 transition-colors text-left truncate block w-full"
                            title={donor.internalNotes || "Add notes"}
                          >
                            {donor.internalNotes ? (donor.internalNotes as string).slice(0, 40) + ((donor.internalNotes as string).length > 40 ? "…" : "") : <span className="text-zinc-700">+ Add notes</span>}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => { setReplyModal({ id: donor.id, name: donor.name }); setReplyStatus("responded"); setReplyNotes(""); }}
                          >
                            Log Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-red-500 hover:bg-red-900/20"
                            onClick={() => { if (confirm(`Remove ${donor.name}?`)) deleteMutation.mutate({ id: donor.id }); }}
                          >
                            ✕
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Donor Modal */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Add Donor Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Name *</label>
              <Input value={addForm.name} onChange={(e) => setAddForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="Full name or handle" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Email</label>
              <Input value={addForm.email} onChange={(e) => setAddForm(f => ({ ...f, email: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Platform *</label>
              <Select value={addForm.platform} onValueChange={(v) => setAddForm(f => ({ ...f, platform: v as Platform }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="kofi">Ko-fi</SelectItem>
                  <SelectItem value="buymeacoffee">Buy Me a Coffee</SelectItem>
                  <SelectItem value="grant">Grant</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Tier / Level</label>
                <Input value={addForm.tier} onChange={(e) => setAddForm(f => ({ ...f, tier: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="e.g. Tier 3, Gold" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Country</label>
                <Input value={addForm.country} onChange={(e) => setAddForm(f => ({ ...f, country: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-zinc-100" placeholder="e.g. US, PH" />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
              <Textarea value={addForm.notes} onChange={(e) => setAddForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-zinc-100 h-20 resize-none" placeholder="Any context about this contact…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="text-zinc-400">Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(addForm)}
              disabled={!addForm.name || createMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {createMutation.isPending ? "Adding…" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Log Modal */}
      <Dialog open={!!replyModal} onOpenChange={(o) => !o && setReplyModal(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Log Reply — {replyModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Outcome</label>
              <Select value={replyStatus} onValueChange={(v) => setReplyStatus(v as any)}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="responded">✓ Responded</SelectItem>
                  <SelectItem value="no_reply">— No Reply</SelectItem>
                  <SelectItem value="declined">✗ Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
              <Textarea
                value={replyNotes}
                onChange={(e) => setReplyNotes(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-100 h-24 resize-none"
                placeholder="What did they say? Any commitments made?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplyModal(null)} className="text-zinc-400">Cancel</Button>
            <Button
              onClick={() => replyModal && logReplyMutation.mutate({ id: replyModal.id, status: replyStatus as "responded" | "no_reply" | "declined", replyNotes })}
              disabled={logReplyMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {logReplyMutation.isPending ? "Saving…" : "Save Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
