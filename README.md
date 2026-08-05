# Questly AI Leads / Leadly

Questly is a B2B lead generation and buying intent discovery platform. It automatically scans public sources (like Reddit), profiles companies, retrieves verified contact details, checks intent signals, and formats leads into actionable B2B prospects.

---

## Key Features

* **B2B Discovery Pipeline**: Discovers local businesses via OpenStreetMap (Overpass) and search pages, then scrapes official websites for public emails, phones, and social handles.
* **Buying Intent Discovery**: Continuously monitors public boards (like Reddit) using search endpoints, running posts through a rule-based intent scorer to isolate high-intent hiring/purchasing signals (e.g. *"looking for a web developer"*).
* **Smart Filtering & Deduplication**: Cleans duplicate business domains, filters out self-promoters or tutorials, and computes confidence scores.
* **Realtime Workspace**: Displays active progress indicators, live event logging, and status logs via Supabase broadcast channels.
* **Export Options**: Export structured lists easily to CSV or XLSX formats.

---

## Technology Stack

* **Frontend & Router**: TanStack Start (React 19, Vinxi, TypeScript)
* **Backend Engines**: Nitro server engine mapping server functions and route hooks.
* **Database & PubSub**: Supabase (PostgreSQL + broadcast triggers)
* **Testing & Build Tools**: Vitest and Vite

---

## Development Setup

### 1. Configure Credentials
Create a `.env` file in the root of the project:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Scraper & Search Keys
FIRECRAWL_API_KEY=your_firecrawl_api_key
LOVABLE_API_KEY=your_lovable_api_key

# Reddit API Credentials (Optional - Authenticated path)
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

### 2. Install and Run
```bash
# Install package dependencies
npm install

# Run hot-reloading development server
npm run dev

# Run Vitest test runner
npm run test:run

# Compile static and SSR bundles
npm run build
```

---

## Deployments
The project includes a `vercel.json` preset for easy deployment to Vercel. Pushing code to your main branch on GitHub automatically deploys Vinxi/Nitro bundles.
