import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { directorySearch } from "@/lib/directory.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Youtube, ExternalLink, Calendar, User, Clock, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/directory")({
  head: () => ({
    meta: [
      { title: "Directory Agent — LeadAI" },
      { name: "description", content: "Smart Business Directory Search Agent powered by Overpass and YouTube APIs." },
    ],
  }),
  component: DirectoryAgent,
});

function DirectoryAgent() {
  const searchFn = useServerFn(directorySearch);
  const [searchTerm, setSearchTerm] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return toast.error("Please enter a business type or search term");
    if (!city.trim()) return toast.error("Please enter a city name");

    setLoading(true);
    setResults(null);
    try {
      const data = await searchFn({ data: { searchTerm, city } });
      setResults(data);
      toast.success(`Successfully found ${data.length} businesses!`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred during search");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!results) return;
    const jsonStr = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    toast.success("JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 text-xs text-violet-300 mb-2">
          <MapPin className="h-3 w-3" /> Smart Directory Agent
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Smart Directory Search</h1>
        <p className="text-muted-foreground mt-1">
          Find matching business listings via OpenStreetMap (Overpass) and fetch top YouTube reviews in sequence.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2">
            <Label htmlFor="searchTerm">Business Type / Search Term</Label>
            <Input
              id="searchTerm"
              placeholder="e.g. Restaurants, Dental, Clinics, Gyms"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="e.g. San Francisco, Patna"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching Listings & Videos..." : "Run Directory Search"}
          </Button>
        </form>
      </Card>

      {loading && (
        <Card className="p-12 text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto"></div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Executing tasks: (1) Fetching OpenStreetMap listings, (2) Enriching with YouTube review videos...
          </p>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">Search Results ({results.length})</h2>
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Combined JSON
            </Button>
          </div>

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="json">Raw JSON Output</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              {results.length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-muted-foreground">No businesses found. Try a different city or search term.</p>
                </Card>
              ) : (
                results.map((item, idx) => {
                  const info = item.basic_info;
                  return (
                    <Card key={idx} className="p-6 space-y-6">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-semibold text-violet-100">{info.name || `Business #${idx + 1}`}</h3>
                            {info.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300">
                                {info.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {info.address && (
                              <p className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                {[info.address.street, info.address.area, info.address.city, info.address.postcode]
                                  .filter(Boolean)
                                  .join(", ") || "No address details available"}
                              </p>
                            )}
                            {info.opening_hours && (
                              <p className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                Hours: {info.opening_hours}
                              </p>
                            )}
                            {info.coordinates && (info.coordinates.lat || info.coordinates.lon) && (
                              <p className="text-xs text-muted-foreground/60 pl-5">
                                Lat: {info.coordinates.lat || "null"}, Lon: {info.coordinates.lon || "null"}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {info.phone && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`tel:${info.phone}`}>
                                Call: {info.phone}
                              </a>
                            </Button>
                          )}
                          {info.website && (
                            <Button size="sm" asChild>
                              <a href={info.website} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                Visit Website
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* YouTube Section */}
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-medium flex items-center gap-1.5 text-red-400 mb-3">
                          <Youtube className="h-4 w-4" /> YouTube Review Videos ({item.videos.length})
                        </h4>

                        {item.videos.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">No relevant review videos found.</p>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-3">
                            {item.videos.map((vid: any, vIdx: number) => (
                              <a
                                key={vIdx}
                                href={vid.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block rounded-lg border border-border bg-card/40 p-3 hover:bg-card/80 transition-colors"
                              >
                                {vid.thumbnail_url && (
                                  <div className="aspect-video w-full rounded overflow-hidden mb-2 relative">
                                    <img
                                      src={vid.thumbnail_url}
                                      alt={vid.video_title}
                                      className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Youtube className="h-8 w-8 text-red-500" />
                                    </div>
                                  </div>
                                )}
                                <div className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-red-400 transition-colors">
                                  {vid.video_title}
                                </div>
                                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{vid.channel_name}</span>
                                  </div>
                                  {vid.published_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(vid.published_date).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                                {vid.short_description && (
                                  <p className="mt-2 text-xs text-muted-foreground/80 line-clamp-2">
                                    {vid.short_description}
                                  </p>
                                )}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="json" className="rounded-lg border border-border bg-black/60 p-4 max-h-[600px] overflow-auto">
              <pre className="text-xs text-violet-200 font-mono whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
