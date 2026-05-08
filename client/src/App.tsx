import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import VloggerInquiries from "./pages/VloggerInquiries";
import SchoolOutreach from "./pages/SchoolOutreach";
import MediaOutreach from "./pages/MediaOutreach";
import DonorOutreach from "./pages/DonorOutreach";
import DepEdDirectory from "./pages/DepEdDirectory";
import Resources from "./pages/Resources";
import MediaScan from "./pages/MediaScan";
import MediaDownloads from "./pages/MediaDownloads";
import AccessTiers from "./pages/AccessTiers";
import UserManagement from "./pages/UserManagement";
import AuditLog from "./pages/AuditLog";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/vlogger-inquiries" component={VloggerInquiries} />
      <Route path="/admin/school-outreach" component={SchoolOutreach} />
      <Route path="/admin/media-outreach" component={MediaOutreach} />
      <Route path="/admin/donor-outreach" component={DonorOutreach} />
      <Route path="/admin/deped-directory" component={DepEdDirectory} />
      <Route path="/admin/resources" component={Resources} />
      <Route path="/admin/media-scan" component={MediaScan} />
      <Route path="/admin/media-downloads" component={MediaDownloads} />
      <Route path="/admin/access-tiers" component={AccessTiers} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/audit-log" component={AuditLog} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
