import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Bookmark, CheckCircle, Copy, Download, ExternalLink, Loader2, Plus, RefreshCw, Search, Tag } from "lucide-react";
import { exportMediaScanLeads } from "@/lib/exportMarkdown";
import { useState } from "react";
import { toast } from "sonner";

const SOURCES = ["Google News", "YouTube", "Reddit", "Google Web"] as const;
type Source = typeof SOURCES[number];

const RIGHTS_TAGS = ["Unknown", "Public Domain", "Fair Use", "Licensed", "Copyright Claimed", "Creative Commons"] as const;

function RightsTag({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    "Public Domain": "bg-green-900/40 text-green-300",
    "Fair Use": "bg-blue-900/40 text-blue-300",
    Licensed: "bg-yellow-900/40 text-yellow-300",
    "Copyright Claimed": "bg-red-900/40 text-red-300",
    "Creative Commons": "bg-purple-900/40 text-purple-300",
    Unknown: "bg-gray-800/60 text-gray-400",
  };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[tag] ?? colors.Unknown}`}>{tag}</span>;
}

export default function MediaScan() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState<Source>("Google News");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [rightsTag, setRightsTag] = useState("Unknown");
  const [tab, setTab] = useState("search");

  const { data: savedLeads = [], isLoading: leadsLoading } = trpc.mediaScan.leads.list.useQuery({});
  const searchMutation = trpc.mediaScan.search.useMutation({
    onSuccess: (d) => { setResults(d as any[]); setSearching(false); },
    onError: (e) => { toast.error(e.message); setSearching(false); },
  });
  const saveLeadMutation = trpc.mediaScan.leads.save.useMutation({ onSuccess: () => { utils.mediaScan.leads.list.invalidate(); toast.success("Lead saved"); } });
  const markVerifiedMutation = trpc.mediaScan.leads.update.useMutation({ onSuccess: () => { utils.mediaScan.leads.list.invalidate(); toast.success("Marked as verified"); } });
  const addNoteMutation = trpc.mediaScan.leads.update.useMutation({ onSuccess: () => { utils.mediaScan.leads.list.invalidate(); toast.success("Note added"); setShowNoteModal(false); setNoteText(""); } });
  const updateRightsMutation = trpc.mediaScan.leads.update.useMutation({ onSuccess: () => utils.mediaScan.leads.list.invalidate() });

  function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setResults([]);
    searchMutation.mutate({ query, sources: [activeSource] });
  }

  function copyAsCitation(item: any) {
    const citation = `"${item.title}" -- ${item.source ?? activeSource}. ${item.url}. Accessed ${new Date().toLocaleDateString()}.`;
    navigator.clipboard.writeText(citation);
    toast.success("Citation copied to clipboard");
  }

  return (
    <VaultLayout title="Media Scan">
      <div className="space-y-4 max-w-5xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">Media Scan</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Multi-source search -- Google News · YouTube · Reddit · Google Web</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-muted/30">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="leads">Saved Leads ({savedLeads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4 mt-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Search across media sources..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching || !query.trim()}>
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
            </div>

            {/* Source tabs */}
            <div className="flex gap-2 flex-wrap">
              {SOURCES.map((s) => (
                <button key={s} onClick={() => setActiveSource(s)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeSource === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Results */}
            {searching && (
              <div className="text-center py-8">
                <Loader2 size={24} className="mx-auto text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Searching {activeSource}...</p>
              </div>
            )}

            {!searching && results.length === 0 && query && (
              <div className="text-center py-8 text-muted-foreground text-sm">No results found. Try a different query.</div>
            )}

            <div className="space-y-2">
              {results.map((item, i) => (
                <Card key={i} className="bg-card border-border hover:border-border/80 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
                          {item.rightsStatus && <RightsTag tag={item.rightsStatus} />}
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          {item.source && <span>{item.source}</span>}
                          {item.publishedAt && <span>· {item.publishedAt}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Save Lead" onClick={() => saveLeadMutation.mutate({ title: item.title, url: item.url, source: (item.source ?? activeSource) as any, snippet: item.description?.slice(0, 200), publishedAt: item.publishedAt })}>
                          <Bookmark size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Copy Citation" onClick={() => copyAsCitation(item)}>
                          <Copy size={13} />
                        </Button>
                        <a href={item.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Open Source">
                            <ExternalLink size={13} />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-2 mt-4">
            {!leadsLoading && savedLeads.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => exportMediaScanLeads(savedLeads)}
                >
                  <Download size={14} />
                  Export Leads
                </Button>
              </div>
            )}
            {leadsLoading ? (
              <div className="text-center py-8"><Loader2 size={20} className="mx-auto animate-spin text-primary" /></div>
            ) : savedLeads.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Bookmark size={32} className="mx-auto mb-2 opacity-40" />
                No saved leads yet. Search and save leads from the Search tab.
              </div>
            ) : (
              savedLeads.map((lead) => (
                <Card key={lead.id} className="bg-card border-border">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground line-clamp-1">{lead.title}</p>
                          {(lead as any).status === 'Verified' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-900/40 text-green-300">Verified</span>}
                          <RightsTag tag={lead.rightsStatus ?? "Unknown"} />
                        </div>
                        {lead.snippet && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{lead.snippet}</p>}
                        {(lead as any).notes && <p className="text-xs text-primary/80 mt-1 italic">Note: {(lead as any).notes}</p>}
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                          <span>{lead.source}</span>
                          {lead.caseRef && <span>· Case: {lead.caseRef}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Mark Verified" onClick={() => markVerifiedMutation.mutate({ id: (lead as any).id, status: "Verified" })}>
                          <CheckCircle size={13} className={(lead as any).status === 'Verified' ? 'text-green-400' : ''} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Add Note" onClick={() => { setSelectedResult(lead); setNoteText((lead as any).notes ?? ""); setShowNoteModal(true); }}>
                          <Plus size={13} />
                        </Button>
                        <Select value={(lead as any).rightsStatus ?? "Unknown"} onValueChange={(v) => updateRightsMutation.mutate({ id: (lead as any).id, rightsStatus: v as any })}>
                          <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>{RIGHTS_TAGS.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Copy Citation" onClick={() => copyAsCitation(lead)}>
                          <Copy size={13} />
                        </Button>
                        <a href={lead.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"><ExternalLink size={13} /></Button>
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Add Note Modal */}
        <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle>Add Note -- {selectedResult?.title}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Case Reference (optional)</Label>
                <Input className="mt-1" placeholder="e.g. CASE-2024-001" />
              </div>
              <div>
                <Label className="text-xs">Note</Label>
                <Textarea className="mt-1 text-sm" rows={3} value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add your research note..." />
              </div>
              <Button className="w-full" onClick={() => selectedResult && addNoteMutation.mutate({ id: selectedResult.id, notes: noteText })} disabled={addNoteMutation.isPending}>
                {addNoteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VaultLayout>
  );
}
