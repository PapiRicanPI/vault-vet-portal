import { useState } from "react";

import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, BookmarkPlus, Trash2, ExternalLink, ArrowLeft, Play, Newspaper, MessageSquare, Video } from "lucide-react";

const DEFAULT_KEYWORDS = [
  "poverty porn Philippines vlogger",
  "poverty exploitation vlogger Philippines",
  "poverty content creator Philippines",
  "poverty vlog Philippines",
];

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  youtube: <span className="text-red-500 font-bold text-xs">▶ YT</span>,
  google_news: <Newspaper size={12} className="text-blue-400" />,
  reddit: <MessageSquare size={12} className="text-orange-400" />,
  vimeo: <Video size={12} className="text-cyan-400" />,
};

const SOURCE_LABELS: Record<string, string> = {
  youtube: "YouTube",
  google_news: "Google News",
  reddit: "Reddit",
  vimeo: "Vimeo",
};

const SOURCE_COLORS: Record<string, string> = {
  youtube: "border-red-500/40 bg-red-500/10 text-red-400",
  google_news: "border-blue-500/40 bg-blue-500/10 text-blue-400",
  reddit: "border-orange-500/40 bg-orange-500/10 text-orange-400",
  vimeo: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  reviewing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

type ScanResult = {
  source: "youtube" | "google_news" | "reddit" | "vimeo";
  title: string;
  url: string;
  channelOrAuthor?: string;
  description?: string;
  thumbnail?: string;
  publishedAt?: string;
  keyword: string;
};

export default function CreatorScan() {
  const [activeTab, setActiveTab] = useState<"scan" | "leads">("scan");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([DEFAULT_KEYWORDS[0], DEFAULT_KEYWORDS[1]]);
  const [customKeyword, setCustomKeyword] = useState("");
  const [keywords, setKeywords] = useState<string[]>(DEFAULT_KEYWORDS);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [filterSource, setFilterSource] = useState<string>("all");

  const runScanMutation = trpc.creatorScan.runScan.useMutation({
    onSuccess: (data) => {
      setResults(data.results as ScanResult[]);
      toast(`Scan complete — ${data.total} results found`);
    },
    onError: (err) => {
      toast.error(`Scan failed: ${err.message}`);
    },
  });

  const saveLeadMutation = trpc.creatorScan.saveLead.useMutation({
    onSuccess: () => {
      toast("Lead saved");
      leadsQuery.refetch();
    },
  });

  const deleteLeadMutation = trpc.creatorScan.deleteLead.useMutation({
    onSuccess: () => {
      toast("Lead removed");
      leadsQuery.refetch();
    },
  });

  const updateStatusMutation = trpc.creatorScan.updateLeadStatus.useMutation({
    onSuccess: () => leadsQuery.refetch(),
  });

  const leadsQuery = trpc.creatorScan.listLeads.useQuery();

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    );
  };

  const addCustomKeyword = () => {
    const trimmed = customKeyword.trim();
    if (!trimmed) return;
    if (!keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setSelectedKeywords((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomKeyword("");
  };

  const handleRunScan = () => {
    if (selectedKeywords.length === 0) {
      toast.error("Select at least one keyword");
      return;
    }
    setResults([]);
    runScanMutation.mutate({ keywords: selectedKeywords });
  };

  const handleSaveLead = (result: ScanResult) => {
    const key = result.url;
    if (savedIds.has(key)) return;
    setSavedIds((prev) => { const next = new Set(Array.from(prev)); next.add(key); return next; });
    saveLeadMutation.mutate({
      source: result.source,
      title: result.title,
      url: result.url,
      channelOrAuthor: result.channelOrAuthor,
      description: result.description,
      thumbnail: result.thumbnail,
      publishedAt: result.publishedAt,
      keyword: result.keyword,
    });
  };

  const filteredResults = filterSource === "all"
    ? results
    : results.filter((r) => r.source === filterSource);

  const leads = leadsQuery.data ?? [];
  const leadCount = leads.length;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-primary flex items-center gap-2">
            🔍 Creator Scan
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-source discovery — YouTube · Google News · Reddit · Vimeo
          </p>
        </div>
        <a href="/admin" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} /> BACK TO ADMIN
        </a>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-6 border-b border-border/30 mb-6">
          <button
            onClick={() => setActiveTab("scan")}
            className={`pb-3 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "scan"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            🔍 RUN SCAN
          </button>
          <button
            onClick={() => setActiveTab("leads")}
            className={`pb-3 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "leads"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            📋 SAVED LEADS ({leadCount})
          </button>
        </div>

        {activeTab === "scan" && (
          <div className="space-y-6">
            {/* Keyword selector */}
            <div className="border border-border/30 rounded-lg p-5 bg-card/20">
              <p className="text-xs font-semibold text-primary tracking-widest mb-3">SEARCH KEYWORDS</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {keywords.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => toggleKeyword(kw)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      selectedKeywords.includes(kw)
                        ? "border-primary/60 bg-primary/20 text-primary"
                        : "border-border/40 bg-muted/20 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={customKeyword}
                  onChange={(e) => setCustomKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomKeyword()}
                  placeholder="Add custom keyword..."
                  className="bg-background/50 border-border/40 text-sm"
                />
                <Button
                  onClick={addCustomKeyword}
                  variant="outline"
                  size="sm"
                  className="border-primary/40 text-primary hover:bg-primary/10 px-4"
                >
                  ADD
                </Button>
              </div>
            </div>

            {/* Run Scan button */}
            <Button
              onClick={handleRunScan}
              disabled={runScanMutation.isPending || selectedKeywords.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-6"
            >
              {runScanMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span> SCANNING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play size={14} /> RUN SCAN
                </span>
              )}
            </Button>

            {/* Source filter */}
            {results.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {["all", "youtube", "google_news", "reddit", "vimeo"].map((src) => {
                  const count = src === "all" ? results.length : results.filter((r) => r.source === src).length;
                  return (
                    <button
                      key={src}
                      onClick={() => setFilterSource(src)}
                      className={`text-xs px-3 py-1 rounded border transition-all ${
                        filterSource === src
                          ? "border-primary/60 bg-primary/20 text-primary"
                          : "border-border/30 text-muted-foreground hover:border-border/60"
                      }`}
                    >
                      {src === "all" ? "All" : SOURCE_LABELS[src]} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Results */}
            {results.length === 0 && !runScanMutation.isPending && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-sm text-muted-foreground font-medium">NO RESULTS YET</p>
                <p className="text-xs text-muted-foreground mt-1">Select keywords above and click Run Scan to discover creators.</p>
              </div>
            )}

            <div className="space-y-3">
              {filteredResults.map((result, i) => {
                const isSaved = savedIds.has(result.url);
                return (
                  <Card key={i} className="bg-card/30 border-border/30 hover:border-border/60 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {result.thumbnail && (
                          <img
                            src={result.thumbnail}
                            alt=""
                            className="w-20 h-14 object-cover rounded shrink-0 bg-muted/20"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded border font-medium flex items-center gap-1 ${SOURCE_COLORS[result.source]}`}>
                                  {SOURCE_ICONS[result.source]}
                                  {SOURCE_LABELS[result.source]}
                                </span>
                                {result.keyword && (
                                  <span className="text-[10px] px-2 py-0.5 rounded border border-border/30 text-muted-foreground">
                                    {result.keyword}
                                  </span>
                                )}
                              </div>
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-1"
                              >
                                {result.title}
                                <ExternalLink size={10} className="shrink-0 mt-0.5 text-muted-foreground" />
                              </a>
                              {result.channelOrAuthor && (
                                <p className="text-xs text-muted-foreground mt-0.5">{result.channelOrAuthor}</p>
                              )}
                              {result.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveLead(result)}
                              disabled={isSaved || saveLeadMutation.isPending}
                              className={`shrink-0 text-xs h-7 px-2 ${isSaved ? "border-green-500/40 text-green-400" : "border-primary/40 text-primary hover:bg-primary/10"}`}
                            >
                              <BookmarkPlus size={12} className="mr-1" />
                              {isSaved ? "Saved" : "Save Lead"}
                            </Button>
                          </div>
                          {result.publishedAt && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1">{result.publishedAt}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div className="space-y-3">
            {leadsQuery.isLoading && (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading saved leads...</div>
            )}
            {!leadsQuery.isLoading && leads.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📋</div>
                <p className="text-sm text-muted-foreground font-medium">NO SAVED LEADS</p>
                <p className="text-xs text-muted-foreground mt-1">Run a scan and save leads to build your list.</p>
              </div>
            )}
            {leads.map((lead) => (
              <Card key={lead.id} className="bg-card/30 border-border/30">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {lead.thumbnail && (
                      <img
                        src={lead.thumbnail}
                        alt=""
                        className="w-20 h-14 object-cover rounded shrink-0 bg-muted/20"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${SOURCE_COLORS[lead.source]}`}>
                              {SOURCE_LABELS[lead.source]}
                            </span>
                            <select
                              value={lead.leadStatus}
                              onChange={(e) => updateStatusMutation.mutate({ id: lead.id, leadStatus: e.target.value })}
                              className={`text-[10px] px-2 py-0.5 rounded border font-medium bg-transparent cursor-pointer ${STATUS_COLORS[lead.leadStatus]}`}
                            >
                              <option value="new">new</option>
                              <option value="reviewing">reviewing</option>
                              <option value="contacted">contacted</option>
                              <option value="archived">archived</option>
                            </select>
                          </div>
                          <a
                            href={lead.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-2 flex items-start gap-1"
                          >
                            {lead.title}
                            <ExternalLink size={10} className="shrink-0 mt-0.5 text-muted-foreground" />
                          </a>
                          {lead.channelOrAuthor && (
                            <p className="text-xs text-muted-foreground mt-0.5">{lead.channelOrAuthor}</p>
                          )}
                          {lead.keyword && (
                            <p className="text-[10px] text-muted-foreground/60 mt-1">Keyword: {lead.keyword}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteLeadMutation.mutate({ id: lead.id })}
                          className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
