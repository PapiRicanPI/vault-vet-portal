import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Apply from "./pages/Apply";
import Success from "./pages/Success";
import AdminDashboard from "./pages/AdminDashboard";
import SubmitTip from "./pages/SubmitTip";
import ExportTest from "./pages/ExportTest";
import Donate from "./pages/Donate";
import DonateThankYou from "./pages/DonateThankYou";
import VolunteerPage from "./pages/VolunteerPage";
import VerifyCertificate from "./pages/VerifyCertificate";
import WeeklyOps from "./pages/WeeklyOps";
import FocusMode from "./pages/FocusMode";
import CampaignSequencer from "./pages/CampaignSequencer";
import ResearcherDashboard from "./pages/ResearcherDashboard";
import DonorOutreach from "./pages/DonorOutreach";
import Receipts from "./pages/Receipts";
import VloggerInquiries from "./pages/VloggerInquiries";
import ContactsExport from "./pages/ContactsExport";
import CreatorScan from "./pages/CreatorScan";
import MediaScan from "./pages/MediaScan";
import Resources from "./pages/Resources";
import DepEdDirectory from "./pages/DepEdDirectory";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/apply"} component={Apply} />
      <Route path={"/success"} component={Success} />
      <Route path={"/admin"} component={AdminDashboard} />
      <Route path={"/tip"} component={SubmitTip} />
      <Route path={"/export-test"} component={ExportTest} />
      <Route path={"/donate"} component={Donate} />
      <Route path={"/donate/thank-you"} component={DonateThankYou} />
      <Route path={"/volunteer"} component={VolunteerPage} />
      <Route path={"/verify"} component={VerifyCertificate} />
      <Route path={"/admin/weekly-ops"} component={WeeklyOps} />
      <Route path={"/admin/focus"} component={FocusMode} />
      <Route path={"/admin/campaigns"} component={CampaignSequencer} />
      <Route path={"/admin/donors"} component={DonorOutreach} />
      <Route path={"/workspace"} component={ResearcherDashboard} />
      <Route path={"/receipts"} component={Receipts} />
      <Route path={"/admin/vlogger-inquiries"} component={VloggerInquiries} />
      <Route path={"/admin/contacts-export"} component={ContactsExport} />
      <Route path={"/admin/creator-scan"} component={CreatorScan} />
      <Route path={"/admin/media-scan"} component={MediaScan} />
      <Route path={"/admin/resources"} component={Resources} />
      <Route path={"/admin/deped-directory"} component={DepEdDirectory} />
      <Route path={"/404"} component={NotFound} />
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
