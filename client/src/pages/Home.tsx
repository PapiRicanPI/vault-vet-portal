import VaultLayout from "@/components/VaultLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Database, Download, Globe, GraduationCap, Heart, Newspaper, Radio, Search, Shield, Users } from "lucide-react";
import { Link } from "wouter";

const MODULES = [
  { label: "Vlogger Inquiries", href: "/admin/vlogger-inquiries", icon: Radio, desc: "Track creator outreach pipeline", color: "text-yellow-400" },
  { label: "School Outreach", href: "/admin/school-outreach", icon: GraduationCap, desc: "Fellowship recruitment contacts", color: "text-blue-400" },
  { label: "Media Outreach", href: "/admin/media-outreach", icon: Newspaper, desc: "Top authorities & press contacts", color: "text-green-400" },
  { label: "Donor Outreach", href: "/admin/donor-outreach", icon: Heart, desc: "Donor engagement pipeline", color: "text-pink-400" },
  { label: "DepEd Directory", href: "/admin/deped-directory", icon: Database, desc: "10,850 SHS records on demand", color: "text-cyan-400" },
  { label: "Resources", href: "/admin/resources", icon: Globe, desc: "OSINT library: PH · PR · US", color: "text-orange-400" },
  { label: "Media Scan", href: "/admin/media-scan", icon: Search, desc: "Multi-source news & media search", color: "text-purple-400" },
  { label: "Media Downloads", href: "/admin/media-downloads", icon: Download, desc: "Vetted member file access", color: "text-emerald-400" },
];

export default function Home() {
  const { data: me } = trpc.auth.me.useQuery();
  const portalRole = (me as any)?.portalRole ?? "Observer";

  return (
    <VaultLayout title="Dashboard">
      <div className="space-y-6 max-w-5xl">
        {/* Welcome */}
        <div className="flex items-start gap-4">
          <Shield size={36} className="text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-foreground">The Vault Investigates</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Admin Portal -- Philippines · Puerto Rico · United States
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Signed in as <span className="text-foreground font-medium">{(me as any)?.name ?? "User"}</span>
              {" · "}
              <span className="text-primary font-medium">{portalRole}</span>
            </p>
          </div>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {MODULES.map((m) => (
            <Link key={m.href} href={m.href} className="block group">
              <Card className="h-full bg-card border-border hover:border-primary/40 transition-colors cursor-pointer">
                <CardHeader className="pb-2 pt-4 px-4">
                  <m.icon size={20} className={m.color} />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Portal Role" value={portalRole} />
          <StatCard label="Download Tier" value={(me as any)?.downloadTier ?? "Free"} />
          <StatCard label="Region Focus" value="PH · PR · US" />
          <StatCard label="Platform" value="v2.0 Rebuilt" />
        </div>
      </div>
    </VaultLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
      </CardContent>
    </Card>
  );
}
