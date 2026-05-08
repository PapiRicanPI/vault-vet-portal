import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Search, Shield, ExternalLink } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  osint_research_trainee: "OSINT Research Trainee",
  data_verification_trainee: "Data Verification Trainee",
  digital_journalism_apprentice: "Digital Journalism Apprentice",
};

export default function VerifyCertificate() {
  const [docId, setDocId] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading } = trpc.volunteer.verifyCertificate.useQuery(
    { docId: submitted },
    { enabled: submitted.length > 0 }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = docId.trim().toUpperCase();
    if (cleaned) setSubmitted(cleaned);
  }

  return (
    <div className="min-h-screen bg-[#0a0905] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#c8a84c]/20 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <span className="text-[#e5c87a] font-bold tracking-widest text-sm cursor-pointer hover:opacity-80 transition-opacity">
            THE VAULT INVESTIGATES
          </span>
        </Link>
        <Link href="/volunteer">
          <span className="text-[#c8a84c]/60 text-xs hover:text-[#c8a84c] transition-colors cursor-pointer">
            Volunteer Program
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Icon + Title */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-full border-2 border-[#c8a84c]/50 flex items-center justify-center mb-5">
            <Shield className="w-8 h-8 text-[#e5c87a]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Certificate Verification
          </h1>
          <p className="text-[#888] text-sm text-center max-w-md">
            Enter the Document ID printed on the certificate to verify its authenticity.
            All certificates issued by The Vault Investigates are registered in this system.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md mb-8">
          <div className="flex gap-2">
            <Input
              value={docId}
              onChange={(e) => setDocId(e.target.value.toUpperCase())}
              placeholder="e.g. VTI-2026-0001"
              className="bg-[#1a1610] border-[#c8a84c]/30 text-white placeholder:text-[#555] focus:border-[#e5c87a] font-mono text-sm"
              maxLength={20}
            />
            <Button
              type="submit"
              disabled={!docId.trim() || isLoading}
              className="bg-[#c8a84c] hover:bg-[#e5c87a] text-black font-semibold px-5"
            >
              {isLoading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>

        {/* Result */}
        {submitted && !isLoading && data && (
          <div className="w-full max-w-md">
            {data.valid && data.data ? (
              <div className="border border-[#c8a84c]/40 rounded-lg bg-[#1a1610] overflow-hidden">
                {/* Valid banner */}
                <div className="bg-emerald-900/40 border-b border-emerald-700/30 px-5 py-3 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-emerald-300 font-semibold text-sm">Certificate Verified</p>
                    <p className="text-emerald-500/70 text-xs">This certificate is authentic and registered in our system.</p>
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 py-5 space-y-4">
                  <div>
                    <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Student</p>
                    <p className="text-white font-semibold text-lg">{data.data.studentName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Role</p>
                      <p className="text-[#e5c87a] text-sm font-medium">
                        {ROLE_LABELS[data.data.role] ?? data.data.role}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Hours</p>
                      <p className="text-white text-sm">{data.data.hoursCompleted} hrs</p>
                    </div>
                    <div>
                      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">School</p>
                      <p className="text-white text-sm">{data.data.schoolName}</p>
                    </div>
                    <div>
                      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">City</p>
                      <p className="text-white text-sm">{data.data.city}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Document ID</p>
                    <Badge variant="outline" className="border-[#c8a84c]/50 text-[#e5c87a] font-mono text-xs">
                      {data.data.docId}
                    </Badge>
                  </div>
                  {data.data.issuedAt && (
                    <div>
                      <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Issued</p>
                      <p className="text-white text-sm">
                        {new Date(data.data.issuedAt).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                  {data.data.certificateUrl && (
                    <a
                      href={data.data.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[#c8a84c] hover:text-[#e5c87a] text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Download Certificate PDF
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-red-800/40 rounded-lg bg-red-950/20 px-5 py-5 flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold text-sm mb-1">Certificate Not Found</p>
                  <p className="text-red-500/70 text-xs">
                    No certificate matching <span className="font-mono text-red-400">{submitted}</span> was found in our system.
                    Please check the Document ID and try again. If you believe this is an error, contact{" "}
                    <a href="mailto:vaultinvestigates@protonmail.com" className="underline hover:text-red-300">
                      vaultinvestigates@protonmail.com
                    </a>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info note */}
        <p className="text-[#444] text-xs text-center mt-10 max-w-sm">
          The Vault Investigates issues certificates only to students who have completed verified hours
          in the Civic Journalism Fellowship Program. Each certificate carries a unique Document ID
          that cannot be transferred or duplicated.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#c8a84c]/10 px-6 py-4 text-center">
        <p className="text-[#333] text-xs">
          © 2026 The Vault Investigates · vet.thevaultinvestigates.cloud
        </p>
      </footer>
    </div>
  );
}
