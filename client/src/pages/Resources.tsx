import VaultLayout from "@/components/VaultLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Globe, Lock, Search, Shield } from "lucide-react";
import { useState } from "react";

interface Resource {
  name: string;
  url: string;
  description: string;
  tags: string[];
  territory: "PH" | "PR" | "US" | "Global";
  category: string;
}

const RESOURCES: Resource[] = [
  // --- PHILIPPINES ---------------------------------------------------------
  { name: "PSA Open Stat", url: "https://openstat.psa.gov.ph", description: "Philippine Statistics Authority open data portal -- poverty incidence, household surveys, census data", tags: ["Government", "Statistics", "Poverty"], territory: "PH", category: "Government Databases" },
  { name: "DepEd Data Portal", url: "https://www.deped.gov.ph/alternative-learning-system/resources/facts-and-figures/", description: "Department of Education enrollment, school, and learner statistics", tags: ["Education", "Government"], territory: "PH", category: "Government Databases" },
  { name: "DSWD Data Repository", url: "https://www.dswd.gov.ph/issuances/", description: "Department of Social Welfare and Development -- 4Ps beneficiary data, social protection programs", tags: ["Social Welfare", "Government"], territory: "PH", category: "Government Databases" },
  { name: "SEC Philippines iView", url: "https://efiling.sec.gov.ph/eFiling/", description: "Securities and Exchange Commission -- NGO and corporation registration lookup", tags: ["Corporate", "NGO", "Legal"], territory: "PH", category: "Legal Resources" },
  { name: "BIR eServices", url: "https://www.bir.gov.ph/index.php/eservices.html", description: "Bureau of Internal Revenue -- TIN verification and tax compliance lookup", tags: ["Tax", "Government"], territory: "PH", category: "Legal Resources" },
  { name: "COA Reports", url: "https://www.coa.gov.ph/reports/", description: "Commission on Audit -- annual audit reports for government agencies and NGOs receiving public funds", tags: ["Audit", "Government", "NGO"], territory: "PH", category: "Legal Resources" },
  { name: "PCIJ iReport", url: "https://pcij.org/", description: "Philippine Center for Investigative Journalism -- reference archive and investigative methodology guides", tags: ["Journalism", "OSINT"], territory: "PH", category: "Investigative Journalism" },
  { name: "Rappler Newsbreak", url: "https://www.rappler.com/newsbreak/", description: "In-depth investigative reporting on Philippine politics, social issues, and accountability", tags: ["Journalism", "News"], territory: "PH", category: "Investigative Journalism" },
  { name: "Philippine e-Legal Forum", url: "https://elibrary.judiciary.gov.ph/", description: "Supreme Court e-Library -- full text of Philippine court decisions and legal opinions", tags: ["Legal", "Court Records"], territory: "PH", category: "Legal Resources" },
  { name: "NEDA Open Data", url: "https://data.gov.ph/", description: "National Economic and Development Authority open data -- regional development plans, poverty maps", tags: ["Government", "Development", "Maps"], territory: "PH", category: "Government Databases" },

  // --- PUERTO RICO ---------------------------------------------------------
  { name: "PR Department of State Corporations", url: "https://prcorporations.com/", description: "Puerto Rico corporation and nonprofit registration lookup", tags: ["Corporate", "NGO", "Legal"], territory: "PR", category: "Legal Resources" },
  { name: "CRIM Property Registry", url: "https://www.crimpr.net/crimdnn/", description: "Centro de Recaudacion de Ingresos Municipales -- property ownership and tax records", tags: ["Property", "Tax"], territory: "PR", category: "Government Databases" },
  { name: "PR Planning Board Data", url: "https://gis.jp.pr.gov/", description: "Puerto Rico Planning Board GIS and census data -- population, poverty, housing", tags: ["GIS", "Census", "Poverty"], territory: "PR", category: "Government Databases" },
  { name: "USDC Puerto Rico PACER", url: "https://ecf.prd.uscourts.gov/", description: "US District Court for Puerto Rico -- federal court filings and case records", tags: ["Court Records", "Legal", "Federal"], territory: "PR", category: "Legal Resources" },
  { name: "PR Comptroller Audit Reports", url: "https://www.ocpr.gov.pr/", description: "Oficina del Contralor -- audit reports for Puerto Rico government agencies and municipalities", tags: ["Audit", "Government"], territory: "PR", category: "Legal Resources" },
  { name: "Centro de Periodismo Investigativo", url: "https://periodismoinvestigativo.com/", description: "Puerto Rico's premier investigative journalism outlet -- accountability reporting, corruption investigations", tags: ["Journalism", "OSINT"], territory: "PR", category: "Investigative Journalism" },
  { name: "FEMA Puerto Rico Disaster Data", url: "https://www.fema.gov/disaster/4339", description: "FEMA Hurricane Maria disaster relief data -- aid distribution, contractor records, fraud investigations", tags: ["FEMA", "Disaster", "Aid"], territory: "PR", category: "Government Databases" },
  { name: "PR Treasury SURI", url: "https://suri.hacienda.pr.gov/", description: "Puerto Rico Department of Treasury -- tax filings and business registration", tags: ["Tax", "Corporate"], territory: "PR", category: "Government Databases" },

  // --- UNITED STATES -------------------------------------------------------
  { name: "ProPublica Nonprofit Explorer", url: "https://projects.propublica.org/nonprofits/", description: "Search IRS Form 990 filings for all US nonprofits -- revenue, executive pay, program expenses", tags: ["NGO", "IRS", "990"], territory: "US", category: "Government Databases" },
  { name: "IRS Tax Exempt Organization Search", url: "https://apps.irs.gov/app/eos/", description: "Official IRS lookup for tax-exempt organizations -- status, filings, revocations", tags: ["IRS", "NGO", "Tax"], territory: "US", category: "Government Databases" },
  { name: "PACER Federal Court Records", url: "https://pacer.uscourts.gov/", description: "Public Access to Court Electronic Records -- all federal court filings nationwide", tags: ["Court Records", "Legal", "Federal"], territory: "US", category: "Legal Resources" },
  { name: "SEC EDGAR", url: "https://www.sec.gov/cgi-bin/browse-edgar", description: "Securities and Exchange Commission -- corporate filings, annual reports, beneficial ownership", tags: ["Corporate", "SEC", "Financial"], territory: "US", category: "Legal Resources" },
  { name: "OpenSecrets", url: "https://www.opensecrets.org/", description: "Campaign finance and lobbying data -- follow the money in US politics", tags: ["Finance", "Politics", "Lobbying"], territory: "US", category: "Investigative Journalism" },
  { name: "USAID Foreign Aid Explorer", url: "https://explorer.usaid.gov/", description: "Track US foreign aid flows -- recipient countries, implementing organizations, project data", tags: ["Aid", "Foreign Policy", "NGO"], territory: "US", category: "Government Databases" },
  { name: "Charity Navigator", url: "https://www.charitynavigator.org/", description: "Independent ratings of US charities -- financial health, accountability, transparency scores", tags: ["NGO", "Charity", "Ratings"], territory: "US", category: "Investigative Journalism" },
  { name: "GuideStar / Candid", url: "https://candid.org/", description: "Comprehensive nonprofit data -- Form 990s, leadership, program descriptions, financials", tags: ["NGO", "990", "Financial"], territory: "US", category: "Government Databases" },
  { name: "MuckRock FOIA Requests", url: "https://www.muckrock.com/", description: "FOIA request platform and archive -- file requests and access thousands of government documents", tags: ["FOIA", "Government", "Documents"], territory: "US", category: "Investigative Journalism" },
  { name: "IRE NICAR Database Library", url: "https://www.ire.org/resources/databases/", description: "Investigative Reporters and Editors -- database library and data journalism resources", tags: ["Journalism", "Data", "OSINT"], territory: "US", category: "Investigative Journalism" },

  // --- GLOBAL / OSINT ------------------------------------------------------
  { name: "ICIJ Offshore Leaks", url: "https://offshoreleaks.icij.org/", description: "International Consortium of Investigative Journalists -- Panama Papers, Pandora Papers, offshore entity search", tags: ["Financial", "Offshore", "ICIJ"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "OpenCorporates", url: "https://opencorporates.com/", description: "World's largest open database of companies -- 200M+ corporate entities across 140 jurisdictions", tags: ["Corporate", "Global", "Registry"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "Bellingcat Online Investigation Toolkit", url: "https://docs.google.com/spreadsheets/d/18rtqh8EG2q1xBo2cLNyhIDuK9jrPGwYr9DI2UncoqJQ/", description: "Comprehensive OSINT toolkit -- geolocation, social media, satellite imagery, verification tools", tags: ["OSINT", "Geolocation", "Verification"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "Google Dorks for Investigators", url: "https://www.exploit-db.com/google-hacking-database", description: "Google advanced search operators for investigative research -- finding hidden documents and data", tags: ["OSINT", "Google", "Search"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "Wayback Machine", url: "https://web.archive.org/", description: "Internet Archive -- access historical versions of websites, deleted content, cached pages", tags: ["Archive", "Verification", "OSINT"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "InVID / WeVerify", url: "https://weverify.eu/verification-plugin/", description: "Video and image verification tool -- reverse image search, metadata extraction, deepfake detection", tags: ["Verification", "Video", "Images"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "Shodan", url: "https://www.shodan.io/", description: "Search engine for internet-connected devices -- useful for infrastructure investigation", tags: ["Technical", "Infrastructure", "OSINT"], territory: "Global", category: "Forensics & OSINT Tools" },
  { name: "EFF Surveillance Self-Defense", url: "https://ssd.eff.org/", description: "Electronic Frontier Foundation OPSEC guide -- secure communications, threat modeling, digital safety", tags: ["OPSEC", "Security", "Privacy"], territory: "Global", category: "OPSEC Guides" },
  { name: "Security in a Box", url: "https://securityinabox.org/", description: "Digital security tools and tactics for activists and journalists -- encrypted communications, secure devices", tags: ["OPSEC", "Security", "Journalists"], territory: "Global", category: "OPSEC Guides" },
  { name: "Access Now Digital Security Helpline", url: "https://www.accessnow.org/help/", description: "Free digital security assistance for journalists, activists, and civil society organizations", tags: ["OPSEC", "Security", "Support"], territory: "Global", category: "OPSEC Guides" },
  { name: "CPJ Digital Safety Kit", url: "https://cpj.org/2019/07/digital-safety-kit/", description: "Committee to Protect Journalists -- digital safety resources for journalists in high-risk environments", tags: ["OPSEC", "Journalists", "Safety"], territory: "Global", category: "OPSEC Guides" },
];

const CATEGORIES = ["All", "Government Databases", "Legal Resources", "Investigative Journalism", "Forensics & OSINT Tools", "OPSEC Guides"];
const TERRITORIES = ["All", "PH", "PR", "US", "Global"];

const TERRITORY_LABELS: Record<string, string> = { PH: "Philippines", PR: "Puerto Rico", US: "United States", Global: "Global" };
const TERRITORY_COLORS: Record<string, string> = {
  PH: "bg-blue-900/40 text-blue-300 border-blue-700/40",
  PR: "bg-green-900/40 text-green-300 border-green-700/40",
  US: "bg-red-900/40 text-red-300 border-red-700/40",
  Global: "bg-purple-900/40 text-purple-300 border-purple-700/40",
};

export default function Resources() {
  const [category, setCategory] = useState("All");
  const [territory, setTerritory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = RESOURCES.filter((r) => {
    if (category !== "All" && r.category !== category) return false;
    if (territory !== "All" && r.territory !== territory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.description.toLowerCase().includes(search.toLowerCase()) && !r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Resource[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  return (
    <VaultLayout title="Resources -- OSINT Library">
      <div className="space-y-4 max-w-5xl">
        <div>
          <h2 className="text-lg font-bold text-foreground">OSINT Resource Library</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Curated investigative resources -- Philippines  |  Puerto Rico  |  United States  |  Global</p>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="w-full bg-input border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Search resources..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {TERRITORIES.map((t) => (
              <button key={t} onClick={() => setTerritory(t)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${territory === t ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {t === "All" ? "All Territories" : TERRITORY_LABELS[t] ?? t}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`text-xs px-3 py-1 rounded-full border transition-colors ${category === c ? "bg-secondary text-secondary-foreground border-secondary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-muted-foreground">{filtered.length} resources</p>

        {/* Grouped resources */}
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">{cat}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {items.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="block group">
                  <Card className="h-full bg-card border-border hover:border-primary/40 transition-colors cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{r.name}</p>
                            <ExternalLink size={11} className="text-muted-foreground shrink-0" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>
                          <div className="flex gap-1 flex-wrap mt-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${TERRITORY_COLORS[r.territory] ?? ""}`}>{r.territory}</span>
                            {r.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground border border-border/50">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Globe size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No resources match your filters</p>
          </div>
        )}
      </div>
    </VaultLayout>
  );
}
