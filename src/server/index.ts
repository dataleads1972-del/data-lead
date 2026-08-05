import { Hono } from "hono";
import { getRequestListener } from "@hono/node-server";
import { createServer, getServerPort, reddit, context } from "@devvit/web/server";

const app = new Hono();

// Submit custom post from the Subreddit menu item
app.post("/internal/menu/post-create", async (c) => {
  console.log("--> [Devvit Server] Received POST request at /internal/menu/post-create");
  try {
    const subName = context.subredditName;
    console.log("--> [Devvit Server] Subreddit name from context:", subName);
    if (!subName) {
      console.error("--> [Devvit Server] Subreddit name not found in context");
      return c.json({ showToast: "Error: Subreddit name not found in context" });
    }
    
    console.log(`--> [Devvit Server] Submitting interactive custom post to r/${subName}`);
    const customPost = await reddit.submitCustomPost({
      subredditName: subName,
      title: "Reddit Posts Viewer",
      entry: "default",
    });
    
    console.log("--> [Devvit Server] Custom post submitted successfully. Post ID:", customPost.id);
    return c.json({ showToast: "Reddit Posts Viewer created successfully!" });
  } catch (error: any) {
    console.error("--> [Devvit Server] Failed to submit custom post:", error);
    return c.json({ showToast: "Failed: " + (error.message || "Failed to submit custom post") });
  }
});

// Endpoint to fetch real posts from a subreddit
app.get("/api/reddit/posts", async (c) => {
  try {
    let subreddit = c.req.query("subreddit") || "startups";
    
    // Sanitize the subreddit parameter
    subreddit = subreddit.trim();
    if (subreddit.toLowerCase().startsWith("r/")) {
      subreddit = subreddit.substring(2);
    }
    subreddit = subreddit.replace(/^\/+|\/+$/g, ""); // strip leading/trailing slashes
    
    if (!subreddit) {
      subreddit = "startups";
    }

    console.log(`Fetching new posts from subreddit: r/${subreddit}`);
    
    // Fetch 25 posts via the Reddit API client
    const posts = await reddit.getNewPosts({
      subredditName: subreddit,
      limit: 25,
      pageSize: 25
    }).all();

    console.log(`--> [Devvit Server] Successfully fetched ${posts.length} posts for r/${subreddit}`);

    // Map properties safely, resolving names & types
    const mappedPosts = posts.map((post) => {
      let permalink = post.permalink || "";
      if (permalink && permalink.startsWith("/")) {
        permalink = `https://www.reddit.com${permalink}`;
      }
      
      return {
        id: post.id,
        subreddit: post.subredditName || subreddit,
        title: post.title || "",
        body: post.body || "",
        author: post.authorName || "",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : undefined,
        score: typeof post.score === "number" ? post.score : undefined,
        commentCount: typeof post.numberOfComments === "number" ? post.numberOfComments : undefined,
        permalink,
        url: post.url || ""
      };
    });

    return c.json({ posts: mappedPosts });
  } catch (error: any) {
    console.error("--> [Devvit Server] Reddit request failed for r/" + c.req.query("subreddit"), error);
    return c.json({ 
      error: error.message || "Reddit request failed", 
      details: error.stack 
    }, 500);
  }
});

// Boot the server on the Devvit-assigned port
const port = getServerPort();
const server = createServer(getRequestListener(app.fetch));
server.listen(port, () => {
  console.log(`--> [Devvit Server] Hono server listening on port ${port}`);
});

export default app;
