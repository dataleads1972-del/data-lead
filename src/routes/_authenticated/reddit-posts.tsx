import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchRedditSubPosts } from "@/lib/reddit.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AIIntelligenceDrawer } from "@/components/AIIntelligenceDrawer";
import {
  Search,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Brain,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Flame,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/reddit-posts")({
  head: () => ({
    meta: [
      { title: "Reddit Buying Intent Search — LeadAI" },
      { name: "description", content: "Search real Reddit posts and extract commercial buying signals." },
    ],
  }),
  component: RedditPostsPage,
});

interface RedditPost {
  id: string;
  title: string;
  content: string;
  author: string;
  subreddit: string;
  score: number;
  commentCount?: number;
  permalink: string;
  url: string;
}

function RedditPostsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [currentQuery, setCurrentQuery] = useState("");
  const [searchType, setSearchType] = useState<"subreddit" | "keyword">("keyword");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // AI Drawer state
  const [aiPostRecord, setAiPostRecord] = useState<any | null>(null);

  // Debug Console state
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>(["System initialized. Ready to search buying intent."]);

  const loadPosts = async (queryStr: string) => {
    const trimmed = queryStr.trim();
    if (!trimmed) {
      toast.error("Please enter a search keyword or subreddit.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    setDebugLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Triggered loadPosts for: "${trimmed}"`,
      ...prev
    ]);

    try {
      const data = await fetchRedditSubPosts({ data: { subreddit: trimmed } });
      const fetchedPosts = data?.posts || [];
      const logs = data?.debugLog || [];
      const resSearchType = data?.searchType || "keyword";
      const resQuery = data?.query || trimmed;
      
      setDebugLogs((prev) => [...logs, ...prev]);
      setPosts(fetchedPosts);
      setSearchType(resSearchType);
      setCurrentQuery(resQuery);

      if (fetchedPosts.length === 0) {
        setError(`No active posts found for "${trimmed}". Please try another search or subreddit.`);
        toast.info(`No active posts found for "${trimmed}"`);
      } else {
        toast.success(`Loaded ${fetchedPosts.length} intent posts for "${trimmed}"`);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      const msg = err.message || "Reddit request failed.";
      setError(msg);
      setPosts([]);
      setDebugLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] Exception: ${msg}`,
        ...prev
      ]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(searchInput);
  };

  const handleSuggestionClick = (query: string) => {
    setSearchInput(query);
    loadPosts(query);
  };

  // Pagination Calculations
  const totalPages = Math.ceil(posts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, posts.length);
  const paginatedPosts = posts.slice(startIndex, endIndex);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📑</span>
            <h1 className="text-2xl font-bold tracking-tight">Reddit Buying Intent Search</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Search live Reddit discussions to extract software, agency, and vendor intent signals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
          className="text-xs gap-1.5 self-start sm:self-auto font-mono text-muted-foreground border-border/60"
        >
          <Terminal className="h-3.5 w-3.5 text-orange-400" />
          {showDebug ? "Hide Diagnostics" : "Show Diagnostics"}
        </Button>
      </div>

      {/* Diagnostics Panel */}
      {showDebug && (
        <Card className="p-4 bg-black/80 border border-orange-500/30 text-emerald-400 font-mono text-xs space-y-2 rounded-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 text-white font-semibold">
            <span>Diagnostics Console</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
              Active Connection
            </Badge>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] leading-relaxed">
            {debugLogs.map((log, i) => (
              <div key={i} className="whitespace-pre-wrap">{log}</div>
            ))}
          </div>
        </Card>
      )}

      {/* Search Bar & Preset Chips */}
      <div className="space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search keyword or subreddit (e.g. looking for CRM, recommend agency, r/SaaS)..."
              className="pl-10 h-11 bg-card text-sm rounded-xl border-border/60 focus:border-orange-500"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 px-6 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold rounded-xl gap-2 shadow-md shadow-orange-500/20"
          >
            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Search className="h-4 w-4" />}
            {loading ? "Searching..." : "Search Posts"}
          </Button>
        </form>

        {/* Popular Intent Signal Preset Chips */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span className="font-medium text-[11px] tracking-wider uppercase">Popular Intent Signals:</span>
          {["looking for CRM", "recommend software agency", "r/SaaS", "HubSpot alternative", "r/startups"].map((chip) => (
            <Badge
              key={chip}
              variant="secondary"
              onClick={() => handleSuggestionClick(chip)}
              className="cursor-pointer hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30 transition-all text-xs font-normal border border-border/40 py-1 px-2.5 rounded-lg"
            >
              {chip}
            </Badge>
          ))}
        </div>
      </div>

      {/* Default Clean State (When no search has been performed yet) */}
      {!currentQuery && !loading && (
        <Card className="p-12 text-center space-y-4 border border-dashed border-orange-500/20 bg-card/40 rounded-2xl">
          <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
            <Search className="h-6 w-6 text-orange-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">Ready to Search Buying Intent Signals</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Type a software search term or click any popular intent chip above (such as <span className="text-orange-400 font-medium">"looking for CRM"</span> or <span className="text-orange-400 font-medium">"r/SaaS"</span>) to retrieve up to 100 posts with 10 items per page.
            </p>
          </div>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5 space-y-3 animate-pulse border-border/40 bg-card/60 rounded-xl">
              <div className="h-4 bg-secondary/80 rounded w-1/3" />
              <div className="h-5 bg-secondary rounded w-4/5" />
              <div className="h-12 bg-secondary/40 rounded w-full" />
            </Card>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <Card className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </Card>
      )}

      {/* Results Header */}
      {currentQuery && !loading && posts.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            Found <strong className="text-foreground">{posts.length}</strong> posts for <strong className="text-orange-400">"{currentQuery}"</strong> • Showing page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong>
          </span>
          <Badge variant="outline" className="text-[10px] border-orange-500/30 text-orange-400">
            {searchType === "subreddit" ? "Subreddit Mode" : "Global Keyword Search"}
          </Badge>
        </div>
      )}

      {/* Posts Grid (Page-wise 10 items) */}
      {!loading && posts.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {paginatedPosts.map((post) => (
              <Card key={post.id} className="p-5 flex flex-col justify-between hover:border-orange-500/40 transition-all bg-card/80 backdrop-blur border border-border/60 rounded-2xl shadow-sm space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground gap-2">
                    <span className="font-semibold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                      r/{post.subreddit}
                    </span>
                    <span className="truncate">u/{post.author}</span>
                  </div>
                  
                  <h3 className="font-bold text-foreground text-sm leading-snug hover:text-orange-400 transition-colors">
                    {post.title}
                  </h3>

                  {post.content && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                      {post.content}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                  <a
                    href={`https://reddit.com${post.permalink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] font-medium"
                  >
                    <ExternalLink className="h-3 w-3" /> View on Reddit
                  </a>

                  <Button
                    size="sm"
                    onClick={() => setAiPostRecord({
                      id: post.id,
                      source: "reddit",
                      recordType: "post",
                      title: post.title,
                      content: post.content || post.title,
                      author: post.author,
                      sourceUrl: `https://reddit.com${post.permalink}`,
                      metadata: { subreddit: post.subreddit, score: post.score },
                    })}
                    className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold gap-1.5 h-8"
                  >
                    <Brain className="h-3.5 w-3.5" /> Analyze with AI
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* PAGE-WISE PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
              <div className="text-xs text-muted-foreground font-medium">
                Showing <strong className="text-foreground">{startIndex + 1}</strong> to <strong className="text-foreground">{endIndex}</strong> of <strong className="text-orange-400">{posts.length}</strong> posts
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-8 text-xs gap-1 px-2.5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`h-8 w-8 text-xs p-0 font-mono ${
                        currentPage === pageNum ? "bg-orange-500 text-white hover:bg-orange-600 font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="h-8 text-xs gap-1 px-2.5"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Intelligence Drawer Component */}
      {aiPostRecord && (
        <AIIntelligenceDrawer
          open={!!aiPostRecord}
          onOpenChange={(open) => !open && setAiPostRecord(null)}
          rawRecord={aiPostRecord}
        />
      )}
    </div>
  );
}
