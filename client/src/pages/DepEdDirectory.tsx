import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Database, Download, RefreshCw, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function DepEdDirectory() {
  const utils = trpc.useUtils();
  const { data: count = 0 } = trpc.deped.count.useQuery();
  const { data: regions = [] } = trpc.deped.regions.useQuery();
  const importMutation = trpc.deped.importFromCsv.useMutation({
    onSuccess: (d) => { utils.deped.count.invalidate(); utils.deped.regions.invalidate(); toast.success(`Imported ${d.imported.toLocaleString()} schools`); },
    onError: (e) => toast.error(e.message),
  });

  const [query, setQuery] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);
  const [searched, setSearched] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return !!params.get("q");
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setQuery(q);
      setSearched(true);
    }
  }, []);

  const { data: provinces = [] } = trpc.deped.provinces.useQuery({ region: region || undefined }, { enabled: !!region });
  const { data: results, isLoading: searching } = trpc.deped.search.useQuery(
    { query, region: region || undefined, province: province || undefined, page, pageSize: 50 },
    { enabled: searched || count > 0 }
  );

  function handleSearch() {
    setPage(1);
    setSearched(true);
  }

  return (
    <VaultLayout title="DepEd SHS Directory">
      <div className="space-y-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">DepEd Senior High School Directory</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {count > 0 ? `${count.toLocaleString()} schools loaded` : "Not yet imported -- click Import to load 10,850 SHS records"}
            </p>
          </div>
          <Button size="sm" variant={count > 0 ? "outline" : "default"} onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
            {importMutation.isPending ? <><RefreshCw size={14} className="mr-1 animate-spin" /> Importing...</> : <><Database size={14} className="mr-1" /> {count > 0 ? "Re-import CSV" : "Import CSV"}</>}
          </Button>
        </div>

        {count === 0 && !importMutation.isPending && (
          <Card className="bg-card border-border border-dashed">
            <CardContent className="py-12 text-center">
              <Database size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">DepEd directory not loaded</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Click "Import CSV" to load the preloaded DepEd SHS dataset (10,850 records)</p>
              <Button onClick={() => importMutation.mutate()}>Import DepEd CSV</Button>
            </CardContent>
          </Card>
        )}

        {count > 0 && (
          <>
            {/* Search */}
            <div className="flex gap-2 flex-wrap">
              <Input
                className="max-w-xs"
                placeholder="Search school name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Select value={region} onValueChange={(v) => { setRegion(v === "all" ? "" : v); setProvince(""); }}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Regions" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              {region && (
                <Select value={province} onValueChange={(v) => setProvince(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="All Provinces" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {provinces.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button size="sm" onClick={handleSearch}>
                <Search size={14} className="mr-1" /> Search
              </Button>
            </div>

            {/* Results */}
            <Card className="bg-card border-border">
              <CardContent className="p-0 overflow-x-auto">
                <table className="vault-table">
                  <thead>
                    <tr><th>School ID</th><th>School Name</th><th>Region</th><th>Province</th><th>Municipality</th><th>Programs</th></tr>
                  </thead>
                  <tbody>
                    {searching ? (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Searching...</td></tr>
                    ) : !results || results.rows.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                        {searched ? "No schools found matching your search" : "Enter a search term or select a region to browse schools"}
                      </td></tr>
                    ) : (
                      results.rows.map((s) => (
                        <tr key={s.id}>
                          <td className="text-xs text-muted-foreground font-mono">{s.schoolId ?? "--"}</td>
                          <td className="text-sm font-medium text-foreground">{s.schoolName}</td>
                          <td className="text-xs text-muted-foreground">{s.region ?? "--"}</td>
                          <td className="text-xs text-muted-foreground">{s.province ?? "--"}</td>
                          <td className="text-xs text-muted-foreground">{s.municipality ?? "--"}</td>
                          <td className="text-xs text-muted-foreground max-w-xs truncate">{s.programs ?? "--"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {results && results.total > 50 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing {((page - 1) * 50) + 1}-{Math.min(page * 50, results.total)} of {results.total.toLocaleString()} results</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= results.total}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </VaultLayout>
  );
}
