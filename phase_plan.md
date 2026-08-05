# Development Phase Plan — Questly AI Leads / Leadly

This file tracks the implementation progress of the cost-optimized, rule-based lead generation pipeline.

---

## Overall Progress: 100% (10 / 10 Phases Completed)

- [x] **Phase 1: Remove AI Dependency**
  - *Status*: Completed
  - *Tasks*: Identify and stub/remove all Gemini/Vercel AI SDK/Lovable Gateway dependencies. Ensure searches can run and complete without LLM API keys.

- [x] **Phase 2: Rule-Based Research (Deterministic Query Generation)**
  - *Status*: Completed
  - *Tasks*: Build a deterministic query generator with industry templates and business modifiers.

- [x] **Phase 3: Native Website Enrichment**
  - *Status*: Completed
  - *Tasks*: Integrate Cheerio, create a native HTML fetcher/crawler, parse JSON-LD/meta tags, and use regex for phone, email, and social profile extraction.

- [x] **Phase 4: Source Connector Architecture**
  - *Status*: Completed
  - *Tasks*: Design modular `LeadSource` connector interface, create `SourceRouter`, migrate Firecrawl to a connector, and isolate errors.

- [x] **Phase 5: Google Places Integration**
  - *Status*: Completed
  - *Tasks*: Add optional Google Places connector, parse details, set up result limits/quotas, and handle missing API keys.

- [x] **Phase 6: Reddit Integration**
  - *Status*: Completed
  - *Tasks*: Add optional Reddit connector to search for mentions, brands, and product/supplier discussions.

- [x] **Phase 7: Validation & Deduplication Engine**
  - *Status*: Completed
  - *Tasks*: Normalize URLs, implement rule-based deduplication, and add a deterministic 0-100 confidence scoring system.

- [x] **Phase 8: Database Improvements**
  - *Status*: Completed
  - *Tasks*: Create Supabase migration to store provenance (source urls/types) and validation data.

- [x] **Phase 9: UI Improvements**
  - *Status*: Completed
  - *Tasks*: Map real-time logs to deterministic stages, show confidence quality badges, and add dashboard filtering options.

- [x] **Phase 10: Export & QA**
  - *Status*: Completed
  - *Tasks*: Verify CSV/XLSX export fields, audit credit consumption rules, enforce request timeouts/concurrency/safety limits, and test end-to-end functionality.
