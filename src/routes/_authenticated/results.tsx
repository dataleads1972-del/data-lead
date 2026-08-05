import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  Check,
  Copy,
  Info,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Search,
  FilterX
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/results")({
  head: () => ({
    meta: [
      { title: "All leads — LeadAI" },
      { name: "description", content: "Every enriched lead across your searches." },
    ],
  }),
  component: Results,
});

export function QualityBadge({ score }: { score: number }) {
  const rounded = Math.round((score || 0) * 100);
  let text = "Low Data";
  let variantClass = "bg-red-500/10 text-red-400 border-red-500/20";
  
  if (rounded >= 90) {
    text = "Excellent";
    variantClass = "bg-green-500/10 text-green-400 border-green-500/20";
  } else if (rounded >= 75) {
    text = "High Quality";
    variantClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (rounded >= 50) {
    text = "Medium Quality";
    variantClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  }
  
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${variantClass}`}>
      {text} ({rounded}%)
    </span>
  );
}

// Regex matching common directories, wikis, social networks and search registries
const AGGREGATOR_PATTERN = /(wikipedia|reddit|quora|medium|pinterest|tripadvisor|glassdoor|indeed|amazon|ebay|blogspot|wordpress|github|slideshare|scribd|youtube|facebook|instagram|linkedin|twitter|x\.com|yelp|crunchbase|google|hhs\.gov|cms\.gov|nih\.gov|cdc\.gov|directory|registry|listings|yellowpages)/i;

function Results() {
  const [q, setQ] = useState("");
  const [minQuality, setMinQuality] = useState<string>("all");
  const [hasEmailOnly, setHasEmailOnly] = useState<boolean>(false);
  const [hasPhoneOnly, setHasPhoneOnly] = useState<boolean>(false);
  const [showAggregators, setShowAggregators] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: leads, isLoading } = useQuery({
    queryKey: ["all-leads"],
    queryFn: async () =>
      (await supabase.from("leads").select("*").or("is_intent_lead.eq.false,is_intent_lead.is.null").order("created_at", { ascending: false }).limit(1000)).data ?? [],
  });

  // Filters leads list
  const filtered = useMemo(() => {
    let list = leads || [];
    
    // 1. Filter directories/aggregators out by default to show only "original business domains"
    if (!showAggregators) {
      list = list.filter((l: any) => {
        const url = (l.website || "").toLowerCase();
        const name = (l.company_name || "").toLowerCase();
        return !AGGREGATOR_PATTERN.test(url) && !AGGREGATOR_PATTERN.test(name);
      });
    }

    // 2. Keyword Search
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((l: any) =>
        [l.company_name, l.email, l.city, l.country, l.industry, l.website].some((v: any) =>
          (v || "").toLowerCase().includes(s)
        )
      );
    }
    
    // 3. Quality Score Threshold Filter
    if (minQuality !== "all") {
      list = list.filter((l: any) => {
        const rounded = Math.round((l.confidence || 0) * 100);
        if (minQuality === "excellent") return rounded >= 90;
        if (minQuality === "high") return rounded >= 75;
        if (minQuality === "medium") return rounded >= 50;
        if (minQuality === "low") return rounded < 50;
        return true;
      });
    }

    // 4. E-Mail Required Filter
    if (hasEmailOnly) {
      list = list.filter((l: any) => !!l.email);
    }

    // 5. Phone Required Filter
    if (hasPhoneOnly) {
      list = list.filter((l: any) => !!l.phone);
    }

    return list;
  }, [leads, q, minQuality, hasEmailOnly, hasPhoneOnly, showAggregators]);

  // Statistics derived metrics
  const stats = useMemo(() => {
    const total = filtered.length;
    const withEmail = filtered.filter((l: any) => !!l.email).length;
    const withPhone = filtered.filter((l: any) => !!l.phone).length;
    
    const totalScore = filtered.reduce((acc: number, cur: any) => acc + (Number(cur.confidence) || 0), 0);
    const avgScore = total > 0 ? Math.round((totalScore / total) * 100) : 0;

    return { total, withEmail, withPhone, avgScore };
  }, [filtered]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Lead Intelligence Hub</h1>
          <p className="text-muted-foreground mt-1">
            Analyze, verify, and filter every business lead collected across your workspaces.
          </p>
        </div>
        
        {/* Toggle Grid/Table */}
        <div className="flex bg-muted p-1 rounded-lg border border-border">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-3 rounded-md"
            onClick={() => setViewMode("table")}
          >
            <TableIcon className="h-4 w-4 mr-1.5" />
            Table View
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-3 rounded-md"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            Card Grid
          </Button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="p-5 bg-gradient-to-br from-violet-500/5 to-transparent border-violet-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground">Total Leads</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight">{stats.total}</span>
            <span className="text-xs text-muted-foreground">original entries</span>
          </div>
        </Card>
        
        <Card className="p-5 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-green-400" /> Emails Found
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-green-400">{stats.withEmail}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.total > 0 ? Math.round((stats.withEmail / stats.total) * 100) : 0}% coverage)
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-blue-400" /> Phones Found
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-blue-400">{stats.withPhone}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.total > 0 ? Math.round((stats.withPhone / stats.total) * 100) : 0}% coverage)
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10 flex flex-col justify-between">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-400" /> Avg Confidence
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold tracking-tight text-amber-400">{stats.avgScore}%</span>
            <span className="text-xs text-muted-foreground">quality rating</span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, email, website or city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            <Select value={minQuality} onValueChange={setMinQuality}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background">
                <SelectValue placeholder="Quality Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality Levels</SelectItem>
                <SelectItem value="excellent">Excellent (90%+)</SelectItem>
                <SelectItem value="high">High Quality (75%+)</SelectItem>
                <SelectItem value="medium">Medium Quality (50%+)</SelectItem>
                <SelectItem value="low">Low Data (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-4 bg-muted/50 px-4 py-2 rounded-lg border border-border">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <Checkbox checked={hasEmailOnly} onCheckedChange={(c) => setHasEmailOnly(!!c)} />
                Has Email
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <Checkbox checked={hasPhoneOnly} onCheckedChange={(c) => setHasPhoneOnly(!!c)} />
                Has Phone
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-violet-300">
                <Checkbox checked={showAggregators} onCheckedChange={(c) => setShowAggregators(!!c)} />
                Show Directories
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Results Display */}
      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-3">Loading enriched lead data...</p>
        </Card>
      ) : viewMode === "table" ? (
        // TABLE VIEW REDESIGNED
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="py-4 font-semibold">Company</TableHead>
                  <TableHead className="py-4 font-semibold">Email</TableHead>
                  <TableHead className="py-4 font-semibold">Phone</TableHead>
                  <TableHead className="py-4 font-semibold">Industry</TableHead>
                  <TableHead className="py-4 font-semibold">Location</TableHead>
                  <TableHead className="py-4 font-semibold">Confidence</TableHead>
                  <TableHead className="py-4 text-center font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l: any) => (
                  <TableRow
                    key={l.id}
                    className="hover:bg-violet-500/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLead(l)}
                  >
                    <TableCell className="py-4">
                      <div className="font-semibold text-violet-100 group-hover:text-violet-300 transition-colors">
                        {l.company_name}
                      </div>
                      {l.website && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span>{l.website}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-xs font-mono">
                      {l.email || <span className="text-muted-foreground/30">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-xs">
                      {l.phone || <span className="text-muted-foreground/30">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-xs">
                      {l.industry || <span className="text-muted-foreground/30">—</span>}
                    </TableCell>
                    <TableCell className="py-4 text-xs">
                      {[l.city, l.country].filter(Boolean).join(", ") || (
                        <span className="text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <QualityBadge score={l.confidence || 0} />
                    </TableCell>
                    <TableCell className="py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLead(l)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                      <FilterX className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      No leads match your active filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        // CARD GRID VIEW
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l: any) => (
            <Card
              key={l.id}
              className="p-5 flex flex-col justify-between hover:border-violet-500/40 hover:bg-violet-500/5 transition-all cursor-pointer group"
              onClick={() => setSelectedLead(l)}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-semibold text-violet-100 group-hover:text-violet-300 transition-colors leading-tight">
                      {l.company_name}
                    </h3>
                    {l.website && (
                      <a
                        href={l.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-violet-400 flex items-center gap-1 mt-1 inline-flex"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>{l.website.replace(/^(https?:\/\/)?(www\.)?/i, "")}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <QualityBadge score={l.confidence || 0} />
                </div>

                <div className="space-y-2 text-xs border-t border-border pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-violet-400" />
                    <span className="font-mono text-violet-200 truncate">
                      {l.email || <span className="text-muted-foreground/30 italic">No email</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-violet-200">
                      {l.phone || <span className="text-muted-foreground/30 italic">No phone</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    <span className="text-violet-200">
                      {[l.city, l.country].filter(Boolean).join(", ") || (
                        <span className="text-muted-foreground/30 italic">No location info</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex justify-end">
                <Button variant="ghost" size="sm" className="h-8">
                  Analyze Lead
                </Button>
              </div>
            </Card>
          ))}
          {!filtered.length && (
            <Card className="col-span-full p-12 text-center text-muted-foreground">
              <FilterX className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No leads match your active filters.
            </Card>
          )}
        </div>
      )}

      {/* LEAD DETAILS SLIDE-OUT SHEET */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto space-y-6">
          {selectedLead && (
            <>
              <SheetHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-fit bg-violet-500/10 text-violet-300">
                    Confidence Profile
                  </Badge>
                  <QualityBadge score={selectedLead.confidence || 0} />
                </div>
                <SheetTitle className="text-2xl font-bold text-violet-100 mt-2">
                  {selectedLead.company_name}
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Scraped and validated via LeadAI Multi-Agent Swarm
                </SheetDescription>
              </SheetHeader>

              {/* Website Section */}
              {selectedLead.website && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Website</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={selectedLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-violet-300 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-4 w-4" />
                      {selectedLead.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Contact Details</h4>
                
                {/* Email detail */}
                <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="h-4 w-4 text-violet-400" />
                    <span className="text-sm font-mono truncate">
                      {selectedLead.email || <span className="text-muted-foreground/30 italic">No email</span>}
                    </span>
                  </div>
                  {selectedLead.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copyToClipboard(selectedLead.email, "Email")}
                    >
                      {copiedField === "Email" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {/* Phone detail */}
                <div className="flex justify-between items-center bg-muted/40 p-2.5 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-violet-400" />
                    <span className="text-sm">
                      {selectedLead.phone || <span className="text-muted-foreground/30 italic">No phone</span>}
                    </span>
                  </div>
                  {selectedLead.phone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyToClipboard(selectedLead.phone, "Phone")}
                    >
                      {copiedField === "Phone" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Location & Address details */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Location Details</h4>
                
                {selectedLead.address && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Full Address</span>
                    <p className="text-sm leading-relaxed">{selectedLead.address}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block">City</span>
                    <span className="font-medium text-violet-100">{selectedLead.city || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Country</span>
                    <span className="font-medium text-violet-100">{selectedLead.country || "—"}</span>
                  </div>
                </div>

                {selectedLead.address && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLead.company_name + " " + selectedLead.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Google Maps
                    </a>
                  </Button>
                )}
              </div>

              {/* Description / Summary */}
              {selectedLead.description && (
                <div className="space-y-2 border-t border-border pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Business Overview</h4>
                  <p className="text-sm leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/40">
                    {selectedLead.description}
                  </p>
                </div>
              )}

              {/* Social Channels */}
              {selectedLead.social_profiles && Object.keys(selectedLead.social_profiles).length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Social Channels</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.social_profiles.linkedin && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedLead.social_profiles.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4 mr-1.5 text-blue-400" /> LinkedIn
                        </a>
                      </Button>
                    )}
                    {selectedLead.social_profiles.facebook && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedLead.social_profiles.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4 mr-1.5 text-blue-600" /> Facebook
                        </a>
                      </Button>
                    )}
                    {selectedLead.social_profiles.instagram && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedLead.social_profiles.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4 mr-1.5 text-pink-400" /> Instagram
                        </a>
                      </Button>
                    )}
                    {selectedLead.social_profiles.twitter && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={selectedLead.social_profiles.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4 mr-1.5 text-sky-400" /> Twitter
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Source Provenance */}
              {selectedLead.source && (
                <div className="space-y-1.5 border-t border-border pt-4 text-xs">
                  <span className="text-muted-foreground uppercase block font-semibold">Lead Sources</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedLead.source.split(",").map((src: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-[10px]">
                        {src.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
