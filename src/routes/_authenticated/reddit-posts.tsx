import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchRedditSubPosts } from "@/lib/reddit.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, RefreshCw, ExternalLink, AlertCircle, Loader2, Terminal, Bug, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reddit-posts")({
  head: () => ({
    meta: [
      { title: "Reddit Posts & Intent Leads — LeadAI" },
      { name: "description", content: "Search real public Reddit posts and buying intent signals." }
    ]
  }),
  component: RedditPostsPage,
});

interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  body: string;
  author: string;
  createdAt?: string;
  score?: number;
  commentCount?: number;
  permalink: string;
  url: string;
}

function RedditPostsPage() {
  const [searchInput, setSearchInput] = useState("r/startups");
  const [currentQuery, setCurrentQuery] = useState("startups");
  const [searchType, setSearchType] = useState<"subreddit" | "keyword">("subreddit");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debug Console state (hidden by default)
  const [showDebug, setShowDebug] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>(["System initialized. Ready to fetch posts."]);

  const loadPosts = async (queryStr: string) => {
    setLoading(true);
    setError(null);

    const trimmed = queryStr.trim();
    if (!trimmed) {
      setLoading(false);
      return;
    }

    setDebugLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] Triggered loadPosts for: "${trimmed}"`,
      ...prev
    ]);

    try {
      const data = await fetchRedditSubPosts({ data: { subreddit: trimmed } });
      const fetchedPosts = data?.posts || [];
      const logs = data?.debugLog || [];
      const resSearchType = data?.searchType || "subreddit";
      const resQuery = data?.query || trimmed;
      
      setDebugLogs((prev) => [...logs, ...prev]);
      setPosts(fetchedPosts);
      setSearchType(resSearchType);
      setCurrentQuery(resQuery);
      setSearchInput(resSearchType === "subreddit" ? `r/${resQuery}` : trimmed);

      if (fetchedPosts.length === 0) {
        setError(`No active posts found for "${trimmed}". Please try another search or subreddit.`);
        toast.info(`No active posts found for "${trimmed}"`);
      } else {
        toast.success(`Loaded ${fetchedPosts.length} posts for "${trimmed}"`);
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

  useEffect(() => {
    loadPosts("startups");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPosts(searchInput);
  };

  const handleRefresh = () => {
    loadPosts(searchInput);
  };

  const handleSuggestionClick = (query: string) => {
    setSearchInput(query);
    loadPosts(query);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🟧</span>
            <h1 className="text-3xl font-bold tracking-tight">Reddit Posts & Intent Leads</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Search subreddits or query keywords like <code className="text-orange-400 bg-orange-500/10 px-1 rounded">"looking for a developer"</code> across Reddit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="h-8 gap-1.5 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
          >
            <Bug className="w-3.5 h-3.5" />
            {showDebug ? "Hide Console" : "Show Console"}
          </Button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Devvit Integration Active
          </span>
        </div>
      </div>

      {/* Control / Search Card */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground select-none" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Enter subreddit (e.g. r/startups) or keyword (e.g. "looking for developer")'
                className="pl-10 h-11 bg-background/80"
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading} className="h-11 px-6 font-semibold bg-orange-600 hover:bg-orange-500 text-white">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Search Posts
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
                className="h-11 px-4"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" />
              Try searches:
            </span>
            {[
              "looking for a developer",
              "need developer",
              "hiring react dev",
              "r/startups",
              "r/SaaS",
              "r/webdev"
            ].map((chip) => {
              const active = searchInput.toLowerCase() === chip.toLowerCase();
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSuggestionClick(chip)}
                  disabled={loading}
                  className={`px-3 py-1 rounded-full transition-colors font-medium border ${
                    active
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                      : "bg-secondary/40 hover:bg-secondary/80 text-muted-foreground border-border/40"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Search Mode Badge */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          {searchType === "keyword" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
              <Search className="w-3.5 h-3.5" />
              Keyword Search: "{currentQuery}"
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium">
              <MessageSquare className="w-3.5 h-3.5" />
              Subreddit Feed: r/{currentQuery}
            </span>
          )}
          {posts.length > 0 && (
            <span className="text-muted-foreground">({posts.length} results)</span>
          )}
        </div>
      </div>

      {/* Optional Debug Console */}
      {showDebug && (
        <Card className="border-zinc-800 bg-zinc-950 text-zinc-200 font-mono text-xs shadow-xl">
          <CardHeader className="py-3 px-4 border-b border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400 font-semibold">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Browser & Server Diagnostics Console</span>
            </div>
            <button
              onClick={() => setDebugLogs([`[${new Date().toLocaleTimeString()}] Console cleared.`])}
              className="text-zinc-500 hover:text-zinc-300 text-[11px] underline"
            >
              Clear Logs
            </button>
          </CardHeader>
          <CardContent className="p-4 max-h-48 overflow-y-auto space-y-1 select-text">
            {debugLogs.map((log, index) => (
              <div
                key={index}
                className={`leading-relaxed ${
                  log.includes("Exception") || log.includes("failed") || log.includes("Error") || log.includes("429")
                    ? "text-red-400 font-semibold"
                    : log.includes("Successfully") || log.includes("200")
                    ? "text-emerald-400 font-semibold"
                    : "text-zinc-300"
                }`}
              >
                {log}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-500/40 bg-red-500/10">
          <CardContent className="pt-6 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to fetch posts</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-border/40 bg-card/40 animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-secondary/80 rounded w-1/4 mb-2"></div>
                <div className="h-5 bg-secondary rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 bg-secondary/60 rounded w-full"></div>
                <div className="h-3 bg-secondary/60 rounded w-5/6"></div>
                <div className="h-3 bg-secondary/60 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 && !error ? (
        <Card className="border-dashed border-border/60 bg-card/30 py-12 text-center">
          <CardContent className="space-y-3">
            <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <h3 className="text-lg font-semibold">No posts found for "{currentQuery}"</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Try typing a keyword like "looking for developer" or a subreddit like "r/startups".
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Card key={post.id} className="border-border/50 bg-card/60 hover:border-orange-500/40 transition-colors flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="font-semibold text-orange-400">r/{post.subreddit}</span>
                  {post.author && (
                    <span>u/{post.author}</span>
                  )}
                </div>
                <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
                  {post.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {post.body && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {post.body}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {post.createdAt && (
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {post.permalink && (
                    <a
                      href={post.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium text-xs hover:underline"
                    >
                      View on Reddit
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
