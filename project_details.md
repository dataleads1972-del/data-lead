# Questly / Leadly B2B Lead Generation & Buying Intent Discovery Platform

Questly is a B2B lead-generation and buying intent discovery platform built to fetch, validate, score, and manage high-quality business leads and public hire-intent postings.

---

## 1. Core Architecture

The platform features two distinct pipelines that run logically separated workflows:

### A. Business Discovery Pipeline
1. **Query Generation**: Formulates location and industry-specific keywords (e.g. *"Foxnut suppliers Patna"*).
2. **Multi-Source Discovery**: Queries APIs like OpenStreetMap (Overpass), Google Places, and search feeds.
3. **Domain Enrichment**: Resolves candidate domains, then scrapes official websites to discover contacts (emails, phone numbers, social handles, WhatsApp).
4. **Scoring & Verification**: Runs a confidence rating based on data availability, deduplicates entries, and logs milestones.

### B. Buying Intent Discovery Pipeline
1. **Target Sourcing**: Uses Reddit public API search (falling back to authenticated OAuth credentials when configured) to query forums for hiring keywords (e.g. *"looking for a web developer"*, *"hiring designer"*).
2. **Intent Scorer**: Passes titles and body descriptions through a rule-based matching engine:
   * **Positive Signals**: *"looking for"*, *"need"*, *"hiring"*, *"recommend someone"*, *"budget"*, *"DM me"*.
   * **Negative Signals (Auto-Reject)**: Tutorials, self-promotion, job seeking (e.g., *"for hire"*, *"hire me"*, *"looking for work"*, portfolios, resumes).
3. **Database Insertion**: Saves high-intent posts as distinct lead entities containing: post author, original post link, matched keyword, intent score, and body snippet, bypassing website enrichment entirely.

---

## 2. Technology Stack

* **Frontend & SSR Framework**: [TanStack Start](https://tanstack.com/router/latest/docs/start/overview) (React 19 + TypeScript + Vinxi)
* **Backend Engines**: Nitro server engine mapping server functions and route hooks.
* **Database & Realtime PubSub**: [Supabase](https://supabase.com) (PostgreSQL database with realtime broadcast channels for live agent workspace logs).
* **Styling**: Vanilla CSS with TailwindCSS integration.
* **Testing**: Vitest for query scoring and validation unit tests.

---

## 3. Environment Setup & Configuration

Create a `.env` file in the root directory (which is excluded from Git tracking via `.gitignore`):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Scraper & Search Keys
FIRECRAWL_API_KEY=your_firecrawl_api_key
LOVABLE_API_KEY=your_lovable_api_key

# Reddit API Setup (Optional - Authenticated Path)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

---

## 4. Local Development

Execute the following commands to install dependencies, run the test suites, or launch the development server locally:

```bash
# Install package dependencies
npm install

# Start the hot-reloading development server
npm run dev

# Run Vitest test runner for scoring & pipeline validation
npm run test:run

# Compile production-ready builds
npm run build
```

---

## 5. Deployment Setup

* **Vercel Deployments**: The project includes a `vercel.json` configuring the framework preset to `tanstack-start`. The Vinxi/Nitro build preset will automatically compile serverless function outputs to Vercel upon pushes to GitHub.
