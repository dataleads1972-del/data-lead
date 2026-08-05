import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

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

function App() {
  const [subredditInput, setSubredditInput] = useState("r/startups");
  const [currentSubreddit, setCurrentSubreddit] = useState("startups");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async (sub: string) => {
    if (loading) return; // Prevent duplicate requests
    setLoading(true);
    setError(null);
    
    // Clean and sanitize the input for the fetch request
    let sanitizedSub = sub.trim();
    if (sanitizedSub.toLowerCase().startsWith("r/")) {
      sanitizedSub = sanitizedSub.substring(2);
    }
    sanitizedSub = sanitizedSub.replace(/^\/+|\/+$/g, "");
    
    if (!sanitizedSub) {
      sanitizedSub = "startups";
    }

    try {
      const response = await fetch(`/api/reddit/posts?subreddit=${encodeURIComponent(sanitizedSub)}`);
      
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Reddit request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPosts(data.posts || []);
      setCurrentSubreddit(sanitizedSub);
      // Keep input updated in clean r/ format
      setSubredditInput(`r/${sanitizedSub}`);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      setError(err.message || "Reddit request failed.");
      setPosts([]); // Clear posts on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial posts on mount
  useEffect(() => {
    fetchPosts("startups");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(subredditInput);
  };

  const handleRefresh = () => {
    fetchPosts(currentSubreddit);
  };

  const handleSuggestionClick = (sub: string) => {
    setSubredditInput(sub);
    fetchPosts(sub);
  };

  return (
    <div className="app-container">
      <div className="glow-effect"></div>
      
      <header className="app-header">
        <div className="logo-section">
          <span className="logo-dot"></span>
          <span className="logo-text">Devvit Web Leads</span>
        </div>
        <h1>Reddit Posts</h1>
        <p className="subtitle">View real-time public Reddit posts to discover buying intent signals</p>
      </header>

      <section className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="input-wrapper">
            <span className="input-prefix">r/</span>
            <input
              type="text"
              value={subredditInput.replace(/^r\//i, "")}
              onChange={(e) => setSubredditInput(`r/${e.target.value}`)}
              placeholder="startups"
              disabled={loading}
            />
          </div>
          <div className="action-buttons">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                "Load Posts"
              )}
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="btn btn-secondary"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </form>

        <div className="suggestions-container">
          <span className="suggestions-label">Popular:</span>
          <div className="suggestions-list">
            {["r/startups", "r/SaaS", "r/smallbusiness", "r/Entrepreneur", "r/webdev"].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => handleSuggestionClick(sub)}
                className={`suggestion-chip ${subredditInput.toLowerCase() === sub.toLowerCase() ? "active" : ""}`}
                disabled={loading}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="error-card animate-fade-in">
          <div className="error-icon">⚠️</div>
          <div className="error-details">
            <h3>Reddit Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="cards-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card skeleton-card">
              <div className="skeleton-row header-row">
                <div className="skeleton-item sub-badge"></div>
                <div className="skeleton-item author-badge"></div>
              </div>
              <div className="skeleton-item title-line"></div>
              <div className="skeleton-item title-line short"></div>
              <div className="skeleton-item paragraph-line"></div>
              <div className="skeleton-item paragraph-line"></div>
              <div className="skeleton-item paragraph-line short"></div>
              <div className="skeleton-row footer-row">
                <div className="skeleton-item stats-badge"></div>
                <div className="skeleton-item action-btn"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 && !error ? (
        <div className="empty-state animate-fade-in">
          <div className="empty-icon">📭</div>
          <h3>No Posts Found</h3>
          <p>No active posts were found in r/{currentSubreddit}. Let's try searching a different community.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {posts.map((post, idx) => (
            <div 
              key={post.id} 
              className="card post-card animate-fade-in" 
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="post-meta">
                <span className="post-subreddit">r/{post.subreddit}</span>
                {post.author && (
                  <span className="post-author">
                    u/{post.author}
                    {post.createdAt && ` • ${formatTimeAgo(post.createdAt)}`}
                  </span>
                )}
              </div>
              
              <h2 className="post-title">{post.title}</h2>
              
              {post.body && (
                <p className="post-body">
                  {truncateText(post.body, 280)}
                </p>
              )}
              
              <div className="post-stats-row">
                <div className="stats-group">
                  {post.score !== undefined && (
                    <span className="stat-badge score-badge" title="Score">
                      <span className="badge-icon">▲</span>
                      {post.score}
                    </span>
                  )}
                  {post.commentCount !== undefined && (
                    <span className="stat-badge comment-badge" title="Comments">
                      <span className="badge-icon">💬</span>
                      {post.commentCount}
                    </span>
                  )}
                </div>
                
                {post.permalink && (
                  <a
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-text-link"
                  >
                    View on Reddit
                    <span className="link-arrow">→</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function truncateText(text: string, limit: number) {
  if (text.length <= limit) return text;
  return text.substring(0, limit) + "...";
}

function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
