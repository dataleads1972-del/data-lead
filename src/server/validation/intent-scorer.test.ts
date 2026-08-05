import { describe, it, expect } from "vitest";
import { scorePost } from "./intent-scorer";

describe("Intent Scorer", () => {
  it("should detect positive hiring intent posts", () => {
    const title = "Looking for a website developer to build my Shopify store";
    const body = "I have a budget of $2000. Please DM me with your portfolio and rates.";
    const result = scorePost(title, body, "developer");
    
    expect(result.isIntent).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.matchedKeyword).toBe("developer");
  });

  it("should reject self-promotional or job-seeker posts", () => {
    const title = "[For Hire] Professional Web Developer | React, Node.js, Next.js";
    const body = "Hi, I am looking for work. Check out my portfolio website at dev.com";
    const result = scorePost(title, body, "developer");
    
    expect(result.isIntent).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should reject tutorials or guides", () => {
    const title = "How to become a React developer in 2026 - A complete guide";
    const body = "In this tutorial we will cover everything you need to build React apps.";
    const result = scorePost(title, body, "developer");
    
    expect(result.isIntent).toBe(false);
    expect(result.score).toBe(0);
  });

  it("should award higher scores for hiring subreddits", () => {
    const title = "Need a software developer for custom CRM";
    const body = "Looking for someone to build a portal.";
    const withoutSub = scorePost(title, body, "developer");
    const withSub = scorePost(title, body, "developer", "forhire");
    
    expect(withSub.score).toBeGreaterThan(withoutSub.score);
  });

  it("should return false if keyword is not mentioned at all", () => {
    const title = "Looking for a copywriter to write articles";
    const body = "Need someone immediately.";
    const result = scorePost(title, body, "developer");
    
    expect(result.isIntent).toBe(false);
    expect(result.score).toBe(0);
  });
});
