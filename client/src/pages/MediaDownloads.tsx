import VaultLayout from "@/components/VaultLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { AlertCircle, CheckCircle, Download, FileAudio, FileVideo, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MediaDownloads() {
  const { data: access } = trpc.downloads.checkAccess.useQuery();
  const { data: downloadLog = [], isLoading: logLoading } = trpc.downloads.log.useQuery({});
  const requestDownloadMutation = trpc.downloads.requestDownload.useMutation({
    onSuccess: (d) => { toast.success("Download authorized -- opening file"); window.open(d.downloadUrl, "_blank"); },
    onError: (e) => toast.error(e.message),
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("video/mp4");
  const [fileSizeMb, setFileSizeMb] = useState("");

  function handleRequest() {
    const bytes = parseFloat(fileSizeMb) * 1024 * 1024;
    if (bytes > 500 * 1024 * 1024) { toast.error("File exceeds 500MB limit"); return; }
    requestDownloadMutation.mutate({ fileUrl, fileName, fileType, fileSizeBytes: Math.round(bytes) });
  }

  const canDownload = access?.canDownload ?? false;

  return (
    <VaultLayout title="Media Downloads">
      <div className="space-y-4 max-w-4xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">Media Downloads</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Vetted member file access -- 500MB limit per file</p>
        </div>

        {/* Access status */}
        <Card className={`border ${canDownload ? "border-green-700/40 bg-green-900/10" : "border-yellow-700/40 bg-yellow-900/10"}`}>
          <CardContent className="p-4 flex items-center gap-3">
            {canDownload ? (
              <CheckCircle size={20} className="text-green-400 shrink-0" />
            ) : (
              <Lock size={20} className="text-yellow-400 shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {canDownload ? `Download Access Active -- ${access?.tier} Tier` : "Download Access Restricted"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {canDownload
                  ? "You may download vetted media files up to 500MB each. All downloads are logged."
                  : access?.reason ?? "Contact an administrator to upgrade your access tier."}
              </p>
            </div>
            {canDownload && (
              <Button size="sm" onClick={() => setShowRequestModal(true)}>
                <Download size={14} className="mr-1" /> Request Download
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Access tiers info */}
        {!canDownload && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { tier: "Free / Vetted", desc: "Search and save leads only. No file downloads.", icon: Shield, color: "text-gray-400" },
              { tier: "Supporter", desc: "Limited downloads per month. Configurable by admin.", icon: Download, color: "text-blue-400" },
              { tier: "Investigator", desc: "Unlimited downloads + priority access.", icon: CheckCircle, color: "text-yellow-400" },
            ].map((t) => (
              <Card key={t.tier} className="bg-card border-border">
                <CardContent className="p-3">
                  <t.icon size={16} className={`${t.color} mb-1`} />
                  <p className="text-sm font-semibold text-foreground">{t.tier}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Download log */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Download History</h3>
          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <table className="vault-table">
                <thead>
                  <tr><th>File</th><th>Type</th><th>Size</th><th>Downloaded By</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {logLoading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Loading...</td></tr>
                  ) : downloadLog.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No downloads yet</td></tr>
                  ) : (
                    downloadLog.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {entry.fileType?.startsWith("video") ? <FileVideo size={13} className="text-blue-400 shrink-0" /> : <FileAudio size={13} className="text-green-400 shrink-0" />}
                            <span className="text-sm text-foreground truncate max-w-xs">{entry.fileName}</span>
                          </div>
                        </td>
                        <td className="text-xs text-muted-foreground">{entry.fileType}</td>
                        <td className="text-xs text-muted-foreground">{entry.fileSizeBytes ? `${(entry.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : "--"}</td>
                        <td className="text-xs text-muted-foreground">{entry.researcherName}</td>
                        <td className="text-xs text-muted-foreground">{format(new Date(entry.downloadedAt), "MMM d, yyyy HH:mm")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Request Download Modal */}
        <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader><DialogTitle>Request File Download</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-700/40 rounded-md p-2">
                <AlertCircle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-300">All downloads are logged with your researcher ID, timestamp, file details, and IP address.</p>
              </div>
              <div><Label className="text-xs">File URL *</Label><Input className="mt-1" placeholder="https://..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} /></div>
              <div><Label className="text-xs">File Name *</Label><Input className="mt-1" placeholder="evidence-video.mp4" value={fileName} onChange={(e) => setFileName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">File Type</Label>
                  <Select value={fileType} onValueChange={setFileType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["video/mp4", "video/webm", "video/mov", "audio/mp3", "audio/wav", "audio/m4a", "other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">File Size (MB) *</Label><Input className="mt-1" type="number" placeholder="e.g. 250" value={fileSizeMb} onChange={(e) => setFileSizeMb(e.target.value)} /></div>
              </div>
              {fileSizeMb && parseFloat(fileSizeMb) > 500 && (
                <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={12} /> File exceeds 500MB limit</p>
              )}
              <Button className="w-full" onClick={handleRequest} disabled={!fileUrl || !fileName || !fileSizeMb || requestDownloadMutation.isPending || parseFloat(fileSizeMb) > 500}>
                <Download size={14} className="mr-1" /> {requestDownloadMutation.isPending ? "Processing..." : "Authorize & Download"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </VaultLayout>
  );
}
