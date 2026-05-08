/**
 * ExportTest — Admin-only page to validate the PDF watermark pipeline end-to-end.
 * Accessible at /export-test (admin only).
 * Lets you enter a case title, content lines, and researcher alias,
 * then downloads a watermarked PDF and shows the export log entry.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function ExportTest() {
  const { user } = useAuth();
  const [caseId, setCaseId] = useState("CASE-2024-001");
  const [caseTitle, setCaseTitle] = useState("Operation Phantom Aid — Preliminary Findings");
  const [alias, setAlias] = useState(user?.name ?? "TheVaultArchivist");
  const [content, setContent] = useState(
    `Subject: Suspected misappropriation of humanitarian aid funds in Region X\n\nKey findings:\n- Organisation A reported $4.2M in field disbursements with no supporting receipts\n- Three shell companies linked to the same beneficial owner received 78% of subgrants\n- Satellite imagery contradicts claimed construction activity at reported sites\n\nRecommended next steps:\n1. Cross-reference beneficiary lists with national ID database\n2. Request bank statements from implementing partners\n3. Commission independent site verification`
  );
  const [result, setResult] = useState<{ documentId: string; fileUrl: string; exportedAt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportMutation = trpc.pdf.exportCase.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setError(null);
      // Auto-open the PDF in a new tab
      window.open(data.fileUrl, "_blank");
    },
    onError: (err) => {
      setError(err.message);
      setResult(null);
    },
  });

  const { data: exportLogs } = trpc.pdf.listExportLogs.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#888" }}>Please log in to access this page.</p>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#c0392b" }}>Access denied — admin only.</p>
      </div>
    );
  }

  const handleExport = () => {
    const contentLines = content.split("\n").filter(l => l.trim() !== "");
    exportMutation.mutate({
      caseId,
      caseTitle,
      contentLines,
      researcherAlias: alias,
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#e8e0d0",
      fontFamily: "'IBM Plex Mono', monospace",
      padding: "2rem",
    }}>
      {/* Header */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link href="/admin" style={{ color: "#b8960c", textDecoration: "none", fontSize: "0.8rem" }}>
          ← Back to Admin
        </Link>
        <h1 style={{
          fontFamily: "Cinzel, serif",
          color: "#b8960c",
          fontSize: "1.4rem",
          marginTop: "1rem",
          marginBottom: "0.25rem",
        }}>
          PDF Watermark — Export Test
        </h1>
        <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "2rem" }}>
          Admin-only validation page. Tests the full chain: watermark → S3 → export log.
        </p>

        {/* Form */}
        <div style={{
          background: "#111",
          border: "1px solid #2a2a2a",
          borderRadius: "4px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#b8960c", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
              CASE ID
            </label>
            <input
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid #333",
                color: "#e8e0d0", padding: "0.5rem", fontFamily: "inherit", fontSize: "0.85rem",
                borderRadius: "2px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#b8960c", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
              CASE TITLE
            </label>
            <input
              value={caseTitle}
              onChange={e => setCaseTitle(e.target.value)}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid #333",
                color: "#e8e0d0", padding: "0.5rem", fontFamily: "inherit", fontSize: "0.85rem",
                borderRadius: "2px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#b8960c", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
              RESEARCHER ALIAS (stamped on watermark)
            </label>
            <input
              value={alias}
              onChange={e => setAlias(e.target.value)}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid #333",
                color: "#e8e0d0", padding: "0.5rem", fontFamily: "inherit", fontSize: "0.85rem",
                borderRadius: "2px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: "#b8960c", fontSize: "0.75rem", marginBottom: "0.4rem" }}>
              DOCUMENT CONTENT (one line per paragraph)
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={10}
              style={{
                width: "100%", background: "#0a0a0a", border: "1px solid #333",
                color: "#e8e0d0", padding: "0.5rem", fontFamily: "inherit", fontSize: "0.8rem",
                borderRadius: "2px", resize: "vertical",
              }}
            />
          </div>

          <button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            style={{
              background: exportMutation.isPending ? "#333" : "#b8960c",
              color: exportMutation.isPending ? "#888" : "#0a0a0a",
              border: "none",
              padding: "0.75rem 2rem",
              fontFamily: "Cinzel, serif",
              fontSize: "0.85rem",
              letterSpacing: "0.05em",
              cursor: exportMutation.isPending ? "not-allowed" : "pointer",
              borderRadius: "2px",
              fontWeight: "bold",
            }}
          >
            {exportMutation.isPending ? "Generating watermarked PDF…" : "Export Watermarked PDF"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#1a0a0a", border: "1px solid #c0392b",
            borderRadius: "4px", padding: "1rem", marginBottom: "1.5rem",
            color: "#e74c3c", fontSize: "0.85rem",
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success result */}
        {result && (
          <div style={{
            background: "#0a1a0a", border: "1px solid #27ae60",
            borderRadius: "4px", padding: "1.5rem", marginBottom: "2rem",
          }}>
            <h3 style={{ color: "#27ae60", fontFamily: "Cinzel, serif", fontSize: "0.9rem", marginBottom: "1rem" }}>
              ✓ PDF Generated — Chain of Custody Record Created
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <tbody>
                <tr>
                  <td style={{ color: "#888", padding: "0.3rem 0", width: "140px" }}>Document ID</td>
                  <td style={{ color: "#e8e0d0", fontFamily: "monospace" }}>{result.documentId}</td>
                </tr>
                <tr>
                  <td style={{ color: "#888", padding: "0.3rem 0" }}>Exported At</td>
                  <td style={{ color: "#e8e0d0" }}>{result.exportedAt}</td>
                </tr>
                <tr>
                  <td style={{ color: "#888", padding: "0.3rem 0" }}>File URL</td>
                  <td>
                    <a href={result.fileUrl} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#b8960c", fontSize: "0.75rem", wordBreak: "break-all" }}>
                      {result.fileUrl}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
            <p style={{ color: "#888", fontSize: "0.75rem", marginTop: "1rem" }}>
              The PDF opened in a new tab. The export log entry is recorded below. This entry is admin-only and never visible to researchers.
            </p>
          </div>
        )}

        {/* Export log */}
        {exportLogs && exportLogs.length > 0 && (
          <div>
            <h3 style={{ color: "#b8960c", fontFamily: "Cinzel, serif", fontSize: "0.9rem", marginBottom: "1rem" }}>
              Chain of Custody — Export Log ({exportLogs.length} entries)
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                    {["Doc ID", "Researcher", "Case ID", "Case Title", "Exported At"].map(h => (
                      <th key={h} style={{ color: "#888", textAlign: "left", padding: "0.5rem 0.75rem", fontWeight: "normal" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...exportLogs].reverse().map((log: any) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#e8e0d0", fontFamily: "monospace", fontSize: "0.7rem" }}>
                        {String(log.documentId).substring(0, 8)}…
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#e8e0d0" }}>{log.researcherAlias}</td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#888" }}>{log.caseId}</td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#888" }}>{log.caseTitle ?? "—"}</td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "#888" }}>
                        {new Date(log.exportedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
