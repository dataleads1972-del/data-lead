import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TRADE_PROVIDERS } from "@/lib/trade-data/provider-registry";
import { TradeRecord, TradeProviderInfo } from "@/lib/trade-data/trade-data.types";
import { searchTradeData, saveTradeRecordAsLead } from "@/lib/trade.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Ship,
  Search,
  Globe,
  Building2,
  Package,
  Calendar,
  ExternalLink,
  BookmarkPlus,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/trade-data")({
  head: () => ({
    meta: [
      { title: "Import & Export Database — LeadAI" },
      { name: "description", content: "Discover companies and trade activity from supported public trade-data sources." },
    ],
  }),
  component: TradeDatabasePage,
});

function TradeDatabasePage() {
  const queryClient = useQueryClient();

  // Filters State
  const [selectedCountry, setSelectedCountry] = useState<string>("United States");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("us-census-api");
  const [tradeDirection, setTradeDirection] = useState<"imports" | "exports" | "both">("both");
  const [companyQuery, setCompanyQuery] = useState<string>("");
  const [productQuery, setProductQuery] = useState<string>("");
  const [hsCode, setHsCode] = useState<string>("");
  const [originCountry, setOriginCountry] = useState<string>("");
  const [destinationCountry, setDestinationCountry] = useState<string>("");

  // Setup Required Provider Modal State
  const [setupModalProvider, setSetupModalProvider] = useState<TradeProviderInfo | null>(null);

  // Available Providers for Selected Country
  const availableProviders = useMemo(() => {
    return TRADE_PROVIDERS.filter((p) => {
      if (selectedCountry === "Global") return p.country.includes("Global");
      return p.country === selectedCountry || p.country.includes("Global");
    });
  }, [selectedCountry]);

  // Current Selected Provider Info
  const currentProvider = useMemo(() => {
    return (
      TRADE_PROVIDERS.find((p) => p.id === selectedProviderId) || availableProviders[0] || TRADE_PROVIDERS[0]
    );
  }, [selectedProviderId, availableProviders]);

  // Handle Country Change
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    const countryProviders = TRADE_PROVIDERS.filter((p) => p.country === country || p.country.includes("Global"));
    if (countryProviders.length > 0) {
      setSelectedProviderId(countryProviders[0].id);
    }
  };

  // Handle Provider Select
  const handleProviderSelect = (providerId: string) => {
    const prov = TRADE_PROVIDERS.find((p) => p.id === providerId);
    if (prov?.status === "setup-required") {
      setSetupModalProvider(prov);
    } else {
      setSelectedProviderId(providerId);
    }
  };

  // Search Query
  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: [
      "trade-search",
      selectedCountry,
      selectedProviderId,
      tradeDirection,
      companyQuery,
      productQuery,
      hsCode,
      originCountry,
      destinationCountry,
    ],
    queryFn: async () => {
      const res = await searchTradeData({
        data: {
          country: selectedCountry,
          providerId: selectedProviderId,
          tradeDirection,
          companyQuery: companyQuery || undefined,
          productQuery: productQuery || undefined,
          hsCode: hsCode || undefined,
          originCountry: originCountry || undefined,
          destinationCountry: destinationCountry || undefined,
        },
      });
      return res.records as TradeRecord[];
    },
    enabled: true,
  });

  // Save Lead Mutation
  const saveLeadMutation = useMutation({
    mutationFn: async (record: TradeRecord) => {
      return await saveTradeRecordAsLead({ data: { tradeRecord: record } });
    },
    onSuccess: (data, record) => {
      const name = record.importer?.name || record.exporter?.name || "Company";
      toast.success(`Saved "${name}" as lead!`);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save lead");
    },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Import & Export Database</h1>
              <p className="text-sm text-muted-foreground">
                Discover companies and trade activity from supported public trade-data sources.
              </p>
            </div>
          </div>
        </div>

        {/* Source Categories Legend */}
        <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg text-xs">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            Company / Shipment Data
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            Aggregate Trade Statistics
          </Badge>
        </div>
      </div>

      {/* Filter Panel */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Search className="h-4 w-4 text-orange-400" />
            Trade Database Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Globe className="h-3.5 w-3.5" /> Country / Jurisdiction
              </label>
              <Select value={selectedCountry} onValueChange={handleCountryChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">🇺🇸 United States</SelectItem>
                  <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                  <SelectItem value="Global">🌐 Global (UN Comtrade)</SelectItem>
                  <SelectItem value="India">🇮🇳 India (Setup Required)</SelectItem>
                  <SelectItem value="Canada">🇨🇦 Canada (Setup Required)</SelectItem>
                  <SelectItem value="Australia">🇦🇺 Australia (Setup Required)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Ship className="h-3.5 w-3.5" /> Data Source Provider
              </label>
              <Select value={selectedProviderId} onValueChange={handleProviderSelect}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span>{p.countryFlag}</span>
                        <span>{p.name}</span>
                        {p.status === "setup-required" && (
                          <Badge variant="outline" className="ml-1 text-[10px] bg-amber-500/10 text-amber-400">
                            Setup Required
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trade Direction */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Trade Direction</label>
              <Select
                value={tradeDirection}
                onValueChange={(v: "imports" | "exports" | "both") => setTradeDirection(v)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Imports & Exports</SelectItem>
                  <SelectItem value="imports">Imports Only</SelectItem>
                  <SelectItem value="exports">Exports Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HS Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3.5 w-3.5" /> HS Commodity Code
              </label>
              <Input
                placeholder="e.g. 8517 or 8542"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Company Search Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> Company Search
                {!currentProvider.supportsCompanySearch && (
                  <span className="text-[10px] text-amber-400 font-normal ml-1">(Not supported by source)</span>
                )}
              </label>
              <Input
                placeholder={
                  currentProvider.supportsCompanySearch
                    ? "Search company / importer name..."
                    : "Company data unavailable for this source"
                }
                value={companyQuery}
                onChange={(e) => setCompanyQuery(e.target.value)}
                disabled={!currentProvider.supportsCompanySearch}
                className="bg-background"
              />
            </div>

            {/* Product / Commodity Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Product / Commodity Keywords</label>
              <Input
                placeholder="e.g. Electronics, Semiconductors, Machinery"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              <Button
                onClick={() => refetch()}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Searching Trade Data...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Trade Data
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Active Provider Info Banner */}
          <div className="rounded-lg bg-secondary/30 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border/40">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  currentProvider.type === "company"
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                }
              >
                {currentProvider.type === "company" ? "Company / Shipment Source" : "Aggregate Statistics Source"}
              </Badge>
              <span className="font-medium">{currentProvider.name}</span>
            </div>

            <div className="text-muted-foreground text-[11px] flex items-center gap-1">
              <span>{currentProvider.description}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            Trade Records & Opportunities
            {searchResults && (
              <Badge variant="secondary" className="rounded-full px-2.5">
                {searchResults.length} {searchResults.length === 1 ? "record" : "records"}
              </Badge>
            )}
          </h2>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm font-medium">Fetching verified public trade records...</p>
          </div>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {searchResults.map((record) => (
              <Card key={record.id} className="border-border/60 hover:border-border transition-colors shadow-sm">
                <CardContent className="p-5 space-y-4">
                  {/* Category Banner & Source Tag */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          record.recordCategory === "company"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }
                      >
                        {record.recordCategory === "company" ? "Company Lead Record" : "Aggregate Trade Statistics"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">HS {record.hsCode}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Source:</span>
                      <span className="font-medium text-foreground">{record.source}</span>
                      {record.sourceUrl && (
                        <a
                          href={record.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                        >
                          View Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Record Details Body */}
                  {record.recordCategory === "company" ? (
                    /* COMPANY RECORD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Importer */}
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Importer (Buyer)
                        </span>
                        <div className="font-semibold text-sm">{record.importer?.name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{record.importer?.address || "Address available in official record"}</div>
                        <div className="text-xs font-medium text-orange-400">{record.importer?.country || record.destinationCountry}</div>
                      </div>

                      {/* Exporter */}
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Exporter (Supplier)
                        </span>
                        <div className="font-semibold text-sm">{record.exporter?.name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{record.exporter?.address || "Address available in official record"}</div>
                        <div className="text-xs font-medium text-blue-400">{record.exporter?.country || record.originCountry}</div>
                      </div>

                      {/* Trade Summary */}
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Commodity & Value
                        </span>
                        <div className="font-medium text-xs line-clamp-1">{record.product}</div>
                        {record.tradeValue && (
                          <div className="text-base font-bold text-emerald-400">
                            ${record.tradeValue.toLocaleString()} {record.currency || "USD"}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          {record.shipmentDate && `Date: ${record.shipmentDate}`}
                          {record.portOfEntry && ` • Port: ${record.portOfEntry}`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* AGGREGATE STATISTICS VIEW */
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                        <div>
                          <div className="font-semibold text-base text-purple-200">{record.product}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{record.description}</div>
                        </div>

                        {record.tradeValue && (
                          <div className="text-right sm:min-w-[140px]">
                            <div className="text-xs text-muted-foreground">Trade Volume</div>
                            <div className="text-lg font-bold text-emerald-400">
                              ${record.tradeValue.toLocaleString()} {record.currency || "USD"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="p-2 rounded bg-secondary/30">
                          <span className="text-muted-foreground">Origin:</span>{" "}
                          <span className="font-medium">{record.originCountry || "N/A"}</span>
                        </div>
                        <div className="p-2 rounded bg-secondary/30">
                          <span className="text-muted-foreground">Destination:</span>{" "}
                          <span className="font-medium">{record.destinationCountry || "N/A"}</span>
                        </div>
                        <div className="p-2 rounded bg-secondary/30">
                          <span className="text-muted-foreground">Quantity / Weight:</span>{" "}
                          <span className="font-medium">
                            {record.quantity ? `${record.quantity.toLocaleString()} ${record.unit || ""}` : "N/A"}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-secondary/30">
                          <span className="text-muted-foreground">Port of Entry:</span>{" "}
                          <span className="font-medium">{record.portOfEntry || "N/A"}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-amber-400/80 flex items-center gap-1.5 pt-1">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Aggregate trade statistics. Company-level importer identities are protected under national confidentiality laws.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  {record.recordCategory === "company" && (
                    <div className="flex items-center justify-end border-t border-border/40 pt-3">
                      <Button
                        size="sm"
                        onClick={() => saveLeadMutation.mutate(record)}
                        disabled={saveLeadMutation.isPending}
                        className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs font-medium"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" />
                        Save as Lead
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed p-12 text-center text-muted-foreground">
            <Ship className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No trade records found for the selected filters.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your HS commodity code, product keywords, or trade direction.
            </p>
          </Card>
        )}
      </div>

      {/* Setup Required Provider Modal */}
      {setupModalProvider && (
        <Dialog open={!!setupModalProvider} onOpenChange={() => setSetupModalProvider(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400">
                <Lock className="h-5 w-5" />
                Setup Required — {setupModalProvider.name}
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                This provider requires API credentials or developer account registration. DataLead strictly uses real API integrations and does not fabricate data.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1.5">
                <div className="font-semibold text-foreground">{setupModalProvider.name}</div>
                <div><span className="text-muted-foreground">Country:</span> {setupModalProvider.countryFlag} {setupModalProvider.country}</div>
                <div><span className="text-muted-foreground">Data Type:</span> {setupModalProvider.type === "company" ? "Company Importer/Exporter Records" : "Aggregate Trade Statistics"}</div>
                <div><span className="text-muted-foreground">Credentials Needed:</span> {setupModalProvider.setupInstructions?.credentialsRequired}</div>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Setup Action Required
                </div>
                <div>
                  Register on the official portal below and add your API key to your <code className="bg-black/40 px-1 py-0.5 rounded text-[11px]">{setupModalProvider.setupInstructions?.envVarName}</code> environment variable.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              {setupModalProvider.setupInstructions?.registrationUrl && (
                <a
                  href={setupModalProvider.setupInstructions.registrationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-orange-400 hover:underline font-medium"
                >
                  Register on Official Portal <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button size="sm" variant="secondary" onClick={() => setSetupModalProvider(null)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
