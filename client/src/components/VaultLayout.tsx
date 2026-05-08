import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  ChevronRight,
  Database,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Radio,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["Observer", "Researcher", "Custodian", "Admin"] },
  {
    label: "Outreach",
    icon: Globe,
    children: [
      { label: "Vlogger Inquiries", href: "/admin/vlogger-inquiries", icon: Radio, roles: ["Researcher", "Custodian", "Admin"] },
      { label: "School Outreach", href: "/admin/school-outreach", icon: GraduationCap, roles: ["Researcher", "Custodian", "Admin"] },
      { label: "Media Outreach", href: "/admin/media-outreach", icon: Newspaper, roles: ["Researcher", "Custodian", "Admin"] },
      { label: "Donor Outreach", href: "/admin/donor-outreach", icon: Heart, roles: ["Researcher", "Custodian", "Admin"] },
    ],
  },
  {
    label: "Research",
    icon: Search,
    children: [
      { label: "DepEd Directory", href: "/admin/deped-directory", icon: Database, roles: ["Observer", "Researcher", "Custodian", "Admin"] },
      { label: "Resources", href: "/admin/resources", icon: BookOpen, roles: ["Observer", "Researcher", "Custodian", "Admin"] },
      { label: "Media Scan", href: "/admin/media-scan", icon: Search, roles: ["Researcher", "Custodian", "Admin"] },
    ],
  },
  {
    label: "Downloads",
    icon: Download,
    children: [
      { label: "Media Downloads", href: "/admin/media-downloads", icon: Download, roles: ["Researcher", "Custodian", "Admin"] },
      { label: "Access Tiers", href: "/admin/access-tiers", icon: Shield, roles: ["Admin"] },
    ],
  },
  {
    label: "Admin",
    icon: Settings,
    children: [
      { label: "User Management", href: "/admin/users", icon: Users, roles: ["Admin"] },
      { label: "Audit Log", href: "/admin/audit-log", icon: FileText, roles: ["Custodian", "Admin"] },
    ],
  },
];

const ROLE_COLORS: Record<string, string> = {
  Observer: "bg-gray-700 text-gray-300",
  Researcher: "bg-blue-900/60 text-blue-300",
  Custodian: "bg-purple-900/60 text-purple-300",
  Admin: "bg-yellow-900/60 text-yellow-300",
};

function NavItem({ item, portalRole, collapsed }: { item: any; portalRole: string; collapsed: boolean }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(() => item.children?.some((c: any) => c.href === location));

  if (item.children) {
    const visibleChildren = item.children.filter((c: any) => !c.roles || c.roles.includes(portalRole));
    if (visibleChildren.length === 0) return null;
    return (
      <div>
        <button
          onClick={() => setOpen((o: boolean) => !o)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            collapsed && "justify-center px-2"
          )}
        >
          <item.icon size={16} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronRight size={14} className={cn("transition-transform", open && "rotate-90")} />
            </>
          )}
        </button>
        {open && !collapsed && (
          <div className="ml-4 mt-1 space-y-0.5 border-l border-border pl-3">
            {visibleChildren.map((child: any) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  location === child.href
                    ? "bg-primary/20 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <child.icon size={14} className="shrink-0" />
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (item.roles && !item.roles.includes(portalRole)) return null;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        location === item.href
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon size={16} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

export default function VaultLayout({ children, title }: { children: React.ReactNode; title?: string }) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: me } = trpc.auth.me.useQuery();
  const portalRole = (me as any)?.portalRole ?? "Observer";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="mx-auto text-primary animate-pulse" size={40} />
          <p className="text-muted-foreground text-sm">Loading The Vault...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="space-y-2">
            <Shield className="mx-auto text-primary" size={48} />
            <h1 className="text-2xl font-bold text-foreground">The Vault Investigates</h1>
            <p className="text-muted-foreground text-sm">Admin Portal -- Philippines · Puerto Rico · United States</p>
          </div>
          <Button asChild className="w-full" size="lg">
            <a href={getLoginUrl()}>Sign in with Manus</a>
          </Button>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-14" : "w-56"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-3 py-4 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
        <Shield size={20} className="text-primary shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight truncate">The Vault</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Investigates Portal</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <NavItem key={i} item={item} portalRole={portalRole} collapsed={collapsed} />
        ))}
      </nav>

      {/* User */}
      <div className={cn("border-t border-sidebar-border p-2 space-y-1", collapsed && "items-center")}>
        {!collapsed && me && (
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-foreground truncate">{(me as any).name ?? "User"}</p>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", ROLE_COLORS[portalRole] ?? ROLE_COLORS.Observer)}>
              {portalRole}
            </span>
          </div>
        )}
        <button
          onClick={() => logout()}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut size={14} />
          {!collapsed && "Sign out"}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute bottom-20 -right-3 bg-sidebar border border-sidebar-border rounded-full p-1 text-muted-foreground hover:text-foreground hidden lg:flex"
      >
        <ChevronRight size={12} className={cn("transition-transform", collapsed && "rotate-180")} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex shrink-0 relative">{sidebar}</div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-56">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="shrink-0 h-12 border-b border-border flex items-center gap-3 px-4">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(true)}>
            <Menu size={18} />
          </button>
          <h1 className="text-sm font-semibold text-foreground flex-1 truncate">{title ?? "The Vault Investigates"}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">PH · PR · US</span>
            <Shield size={14} className="text-primary" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
