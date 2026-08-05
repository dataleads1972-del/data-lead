# Questly AI Leads / Leadly

## Cost-Optimized B2B Lead Generation Platform — Development Concept

## 1. Project Overview

Questly AI Leads, also referred to as Leadly, is a B2B lead-generation platform designed to discover publicly available business information from multiple supported sources, enrich discovered companies using their official websites, validate the collected information, remove duplicates, and produce structured lead lists.

The long-term vision may include AI-powered research and multi-agent workflows.

However, the CURRENT DEVELOPMENT VERSION must prioritize:

* Zero or extremely low operating cost
* Free tiers wherever practical
* No paid LLM dependency
* No Gemini/OpenAI/Claude requirement
* Minimal dependence on paid scraping APIs
* Deterministic TypeScript-based processing
* Publicly available business information
* Modular source connectors
* Easy migration to AI features later
* Scalable architecture without rebuilding the application

The application UI can continue presenting the workflow as multiple "agents", but these agents should currently represent deterministic processing stages rather than LLM-powered autonomous agents.

---

# 2. Primary Objective

A user should be able to enter something like:

Keyword:
Foxnuts

Country:
India

State:
Optional

City:
Optional

Target Leads:
50

The platform should automatically discover relevant businesses such as:

* Foxnuts manufacturers
* Foxnuts suppliers
* Foxnuts exporters
* Foxnuts importers
* Foxnuts distributors
* Foxnuts wholesalers
* Foxnuts dealers
* Foxnuts companies

The system should then:

1. Generate relevant search queries.
2. Search enabled public sources.
3. Discover candidate companies.
4. Identify official company websites.
5. Visit company websites.
6. Find useful contact/business pages.
7. Extract publicly available contact information.
8. Normalize the information.
9. Remove duplicates.
10. Calculate lead quality.
11. Store leads in Supabase.
12. Display leads in real time.
13. Allow CSV/XLSX export.

---

# 3. Important Development Principle

DO NOT use AI for functionality that can be implemented deterministically.

For the development MVP, avoid:

* Gemini
* OpenAI
* Claude
* Paid AI APIs
* LLM-based JSON extraction
* LLM-based validation
* LLM-based query generation
* LLM-based lead scoring

Use:

* TypeScript
* HTML parsing
* Cheerio
* Regex
* URL parsing
* Rule-based classification
* Rule-based scoring
* Source APIs where available
* Public website crawling
* Supabase

AI should be treated as a future optional enhancement.

---

# 4. Existing Technology Stack

Maintain the existing project architecture where possible.

Frontend / Full Stack:

* TanStack Start
* React 19
* TypeScript
* Vite

Routing:

* TanStack Router

UI:

* Tailwind CSS
* Shadcn/UI
* Radix UI

Database:

* Supabase PostgreSQL

Authentication:

* Supabase Auth

Realtime:

* Supabase Realtime

Current Crawling:

* Firecrawl

Current AI:

* Gemini through Vercel AI SDK / Lovable AI Gateway

Exports:

* CSV
* XLSX

Do not unnecessarily rewrite working functionality.

---

# 5. New Cost-Optimized Architecture

Target architecture:

User Search

↓

Search Configuration

↓

Rule-Based Research Stage

↓

Query Generator

↓

Source Router

↓

Parallel Source Connectors

↓

Candidate Company Discovery

↓

Domain Resolution

↓

Website Enrichment

↓

Contact Page Discovery

↓

HTML Parsing

↓

Contact Information Extraction

↓

Data Normalization

↓

Deduplication

↓

Rule-Based Validation

↓

Confidence Score

↓

Supabase

↓

Realtime Dashboard

↓

CSV / XLSX Export

---

# 6. Replace AI Research Agent

The current Research Agent should no longer require Gemini.

Create a deterministic query generator.

Example input:

Keyword:
Foxnuts

Country:
India

The system should generate queries such as:

* foxnuts manufacturers India
* foxnuts suppliers India
* foxnuts exporters India
* foxnuts importers India
* foxnuts distributors India
* foxnuts wholesalers India
* foxnuts dealers India
* foxnuts companies India

Create configurable query modifiers.

Example:

const businessModifiers = [
"manufacturers",
"suppliers",
"exporters",
"importers",
"distributors",
"wholesalers",
"dealers",
"companies",
"vendors",
"providers"
];

Location should automatically be appended where appropriate.

Example:

keyword + modifier + city + state + country

The query generator should avoid generating duplicate searches.

---

# 7. Industry-Specific Query Templates

Support basic deterministic industry expansion.

For example:

Food:

* manufacturer
* supplier
* distributor
* wholesaler
* exporter
* importer
* food processor
* retailer

Software:

* software company
* SaaS company
* software provider
* software development company
* technology company

Healthcare:

* clinic
* hospital
* healthcare provider
* medical supplier
* medical distributor

Construction:

* contractor
* construction company
* building supplier
* manufacturer
* distributor

The architecture should make it easy to add more templates.

Example file:

src/server/research/industry-templates.ts

Do NOT require AI for this functionality.

---

# 8. Source Connector Architecture

Create a modular source connector layer.

Suggested structure:

src/server/sources/

* source.types.ts
* source-router.server.ts
* web-search.server.ts
* google-places.server.ts
* reddit.server.ts
* website.server.ts
* directory.server.ts
* github.server.ts
* youtube.server.ts
* firecrawl.server.ts

Not every connector must be implemented immediately.

The architecture should allow connectors to be enabled or disabled.

Example:

interface LeadSource {
name: string;

enabled: boolean;

search(
params: SearchParams
): Promise<CandidateLead[]>;
}

---

# 9. Source Router

The Source Router should receive generated queries and determine which enabled sources should run.

Example:

Research Stage

↓

Source Router

↓

Web Search
Google Places
Reddit
Public Directories
Other supported sources

↓

Candidate Pool

Source failures must NOT crash the entire search.

Use Promise.allSettled or equivalent error isolation.

Example:

Google Places failed

Reddit succeeded

Web Search succeeded

Website Discovery succeeded

Search should continue.

---

# 10. Source Priority

Development priority:

P0:

1. Web discovery
2. Company websites
3. Existing Firecrawl integration while free credits are available

P1:

4. Google Places / Business discovery
5. Reddit

P2:

6. GitHub
7. YouTube
8. Selected public business directories

Future:

* Licensed B2B databases
* CRM integrations
* Premium enrichment APIs
* AI research

Do NOT attempt to integrate every source immediately.

---

# 11. Google Business / Places Integration

Google local-business discovery should be treated as a separate connector.

Use supported Google APIs where practical.

Potential information:

* Business name
* Category
* Website
* Phone
* Address
* City
* State
* Country
* Rating
* Review count
* Maps location/reference

The application must implement quotas and result limits.

Google should NOT be assumed to provide unlimited free lead generation.

During development, Google integration should be optional.

Environment variable example:

GOOGLE_PLACES_API_KEY=

If the key does not exist, disable the connector gracefully.

---

# 12. Reddit Integration

Reddit should primarily be used for DISCOVERY and market intelligence.

It is not primarily a contact enrichment source.

Search Reddit for:

* product discussions
* supplier recommendations
* manufacturer recommendations
* company mentions
* business recommendations
* buyer discussions
* industry communities

Example:

Foxnuts suppliers

Makhana manufacturers

Where to buy foxnuts wholesale

Best makhana supplier

Extract potential:

* Company names
* Brand names
* Website URLs where available
* Relevant discussions

Any discovered company should then enter the normal company-discovery pipeline.

Reddit

↓

Company Mention

↓

Website Discovery

↓

Official Website

↓

Website Enrichment

↓

Validated Lead

---

# 13. Company Website Enrichment

Company websites should become one of the most important enrichment sources.

When a candidate domain is discovered, fetch:

1. Homepage
2. Contact page
3. About page
4. Team page where appropriate

Potential URL patterns:

/contact

/contact-us

/about

/about-us

/company

/team

Do not crawl the entire website unnecessarily.

Limit the number of pages per company to control server resources.

Recommended MVP:

Maximum 3-5 pages per domain.

---

# 14. Replace Firecrawl Where Possible

Keep the existing Firecrawl integration initially because it already works.

However, implement a cheaper native crawler for simple websites.

Preferred order:

1. Native fetch()
2. Parse HTML using Cheerio
3. Extract required information
4. Use Firecrawl only when necessary

Possible future fallback:

fetch()

↓

If normal HTML extraction fails

↓

Firecrawl

Do not use expensive browser rendering unless required.

---

# 15. HTML Parser

Use Cheerio for server-side HTML parsing.

Extract:

* Page title
* Meta description
* Headings
* Text
* Links
* mailto links
* tel links
* social links
* internal links

Avoid storing entire raw website HTML unless necessary.

---

# 16. Email Extraction

Extract publicly available business emails.

Sources:

* mailto links
* visible page text
* Contact page
* Footer
* About page

Use regex plus DOM extraction.

Example pattern:

[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,}

Case insensitive.

Normalize:

* lowercase
* trim spaces
* remove punctuation accidentally attached to email
* remove duplicates

Filter obvious invalid examples such as:

[example@example.com](mailto:example@example.com)

[test@test.com](mailto:test@test.com)

[name@domain.com](mailto:name@domain.com)

---

# 17. Phone Extraction

Extract phone numbers from:

* tel links
* Contact page
* Footer
* Visible text

Use libphonenumber-js or equivalent for normalization.

Store:

* raw phone
* normalized phone
* detected country where possible

Do not treat every numeric string as a phone number.

---

# 18. WhatsApp Discovery

Look for:

* wa.me
* api.whatsapp.com
* WhatsApp buttons
* publicly displayed WhatsApp numbers

Store WhatsApp only when publicly available.

---

# 19. Social Profile Discovery

Extract company social links from official websites.

Support:

* LinkedIn
* Facebook
* Instagram
* X / Twitter
* YouTube
* TikTok where available

Example fields:

linkedin_url

facebook_url

instagram_url

twitter_url

youtube_url

Do not scrape LinkedIn profiles as part of the MVP.

Only store public profile URLs discovered from permitted sources such as company websites.

---

# 20. Company Name Extraction

Determine business name using deterministic signals.

Priority:

1. Structured metadata
2. OpenGraph site_name
3. Schema.org Organization name
4. Page title
5. Logo alt text
6. Main H1
7. Search-result title

Avoid using AI.

---

# 21. Address Extraction

Attempt to discover address from:

* Schema.org structured data
* Contact page
* Footer
* Google Places
* Search metadata

Store:

address

city

state

postal_code

country

Only populate values when reasonably confident.

---

# 22. Structured Data Extraction

Parse JSON-LD where available.

Look for:

Organization

LocalBusiness

Corporation

Store

Restaurant

MedicalOrganization

ProfessionalService

etc.

JSON-LD can provide high-quality structured information such as:

* Company name
* Address
* Phone
* Website
* Social profiles

Prefer structured data over regex where available.

---

# 23. Candidate Lead Schema

Standardize every source into one common structure.

Example:

CandidateLead:

companyName

domain

website

email

phone

whatsapp

address

city

state

country

industry

category

description

linkedinUrl

facebookUrl

instagramUrl

twitterUrl

youtubeUrl

source

sourceUrl

sources[]

confidenceScore

metadata

---

# 24. Source Provenance

Every lead must record where information came from.

Example:

Company:
ABC Foods

Website:
abcfoods.com

Email:
[sales@abcfoods.com](mailto:sales@abcfoods.com)

Phone:
+91XXXXXXXXXX

Sources:

* web_search
* company_website
* google_places

Email Source:
company_website

Phone Source:
google_places

This is important for trust and debugging.

---

# 25. Database Changes

Review the existing leads table.

Add fields where required:

source_types

source_urls

email_source

phone_source

website_source

discovery_source

validation_status

confidence_score

last_enriched_at

Consider creating a separate table:

lead_sources

Fields:

id

lead_id

source_type

source_url

data_found

created_at

This provides proper provenance without stuffing everything into one JSON field.

---

# 26. Deduplication

Implement deterministic deduplication.

Primary signals:

1. Same normalized domain
2. Same website
3. Same phone
4. Same email
5. Same business name + city
6. Same business name + address

Domain should have the strongest priority.

Normalize domains.

Example:

https://www.abcfoods.com/

http://abcfoods.com

https://abcfoods.com/contact

should resolve to:

abcfoods.com

Do not create three different leads.

---

# 27. Lead Validation

Remove the Gemini-based validation dependency.

Create rule-based validation.

Possible scoring:

Business Name:
+10

Valid Website:
+20

Public Email:
+25

Valid Phone:
+20

Address:
+10

LinkedIn:
+5

Facebook:
+3

Instagram:
+3

Business Description:
+4

Maximum:
100

Final score should be normalized to 0-100.

---

# 28. Lead Quality Levels

Display:

90-100:
Excellent

75-89:
High Quality

50-74:
Medium Quality

Below 50:
Low Data

Allow users to filter leads by quality.

---

# 29. Website Validation

Check:

* valid URL
* HTTP response
* reasonable status code
* domain normalization
* redirect handling

Store final resolved URL.

Avoid repeatedly requesting the same domain.

---

# 30. Email Validation

Development version should perform basic validation only.

Check:

* valid syntax
* domain exists where practical
* not obviously fake
* not duplicated

Do NOT send emails to verify addresses.

Advanced email verification can be added later through a dedicated provider.

---

# 31. Search Pipeline

Final MVP pipeline:

STEP 1

User submits search.

STEP 2

Create search record in Supabase.

Status:

queued

STEP 3

Generate deterministic search queries.

STEP 4

Update:

research → completed

STEP 5

Execute enabled source connectors.

STEP 6

Collect candidate companies.

STEP 7

Normalize domains.

STEP 8

Remove obvious duplicates.

STEP 9

Enrich candidate websites.

STEP 10

Extract:

company name

email

phone

WhatsApp

address

social profiles

description

STEP 11

Normalize data.

STEP 12

Validate data.

STEP 13

Calculate confidence score.

STEP 14

Perform final deduplication.

STEP 15

Insert leads into Supabase.

STEP 16

Send realtime updates.

STEP 17

Mark search completed.

STEP 18

Allow export.

---

# 32. Existing Agent UI

KEEP the current multi-agent visual experience.

Do not remove it.

Instead, reinterpret agents.

Research Agent

Actually performs:

* Query generation
* Search strategy generation
* Industry template selection

Search Agent

Actually performs:

* Source queries
* Candidate discovery

Discovery Agent

Actually performs:

* Domain extraction
* Company clustering
* Aggregator filtering

Enrichment Agent

Actually performs:

* Website crawling
* Contact page crawling
* HTML extraction

Structuring Agent

Actually performs:

* Regex
* DOM parsing
* JSON-LD parsing
* Data normalization

Validation Agent

Actually performs:

* Deduplication
* URL validation
* Contact validation
* Confidence scoring

The user experience can therefore remain:

Researching...

Searching...

Discovering companies...

Enriching leads...

Validating...

without requiring AI.

---

# 33. Agent Events

Continue using the existing agent_events table.

Example events:

Research Agent:
"Generated 8 search queries"

Search Agent:
"Searching: foxnuts manufacturers India"

Discovery Agent:
"23 candidate companies discovered"

Enrichment Agent:
"Checking contact information for ABC Foods"

Structuring Agent:
"2 emails and 1 phone number extracted"

Validation Agent:
"Duplicate company removed"

Validation Agent:
"Lead quality score: 90%"

Do NOT claim that AI is reasoning when no AI is actually being used.

---

# 34. Realtime Search UI

Continue using Supabase Realtime.

During search display:

Queries generated

Sources searched

Pages scanned

Candidate companies found

Companies enriched

Emails found

Phones found

Duplicates removed

Validated leads

Target leads

Example:

Target Leads

50

Companies Discovered

83

Websites Processed

61

Emails Found

38

Phones Found

44

Duplicates Removed

11

Final Leads

50

---

# 35. Search Termination

The crawler should not continue forever.

Stop when:

Target number of valid leads has been reached

OR

All generated queries have been processed

OR

Maximum page/domain limit reached

OR

Maximum execution time reached

Add configurable safety limits.

---

# 36. Resource Protection

Because the goal is free-tier development, resource usage must be tightly controlled.

Implement:

* Search concurrency limits
* Domain crawl limits
* Page limits
* Request timeouts
* Retry limits
* Rate limiting
* Search result limits
* Per-user limits

Example:

Maximum concurrent website requests:
5

Maximum pages/company:
3

Maximum retries:
2

Request timeout:
10 seconds

These should be configurable.

---

# 37. Credits

Keep the existing credit system.

However, credits currently represent internal application usage rather than actual AI tokens.

Example:

1 successfully generated lead = 1 credit.

New account:

100 free credits.

50-lead search:

Maximum 50 credits.

Only charge credits for accepted final leads.

Do not charge credits for:

* duplicate leads
* failed websites
* invalid results
* crawler errors

---

# 38. Search Configuration UI

Existing search page should support:

Keyword

Industry

Country

State

City

Target Leads

Search Strategy

Strategies:

Broad

Balanced

Narrow

Broad:

More query modifiers and sources.

Balanced:

Default search.

Narrow:

Strict keyword/location matching.

Remove or disable AI-specific options for the development version.

---

# 39. Source Selection

Optionally allow advanced users to select sources.

Example:

Sources

☑ Web

☑ Company Websites

☑ Google Places

☑ Reddit

☐ GitHub

☐ YouTube

Unavailable connectors should show:

"Not configured"

instead of crashing.

---

# 40. Results Table

Lead table should display:

Company

Industry

Email

Phone

Website

City

State

Country

Source

Quality

Actions

Provide filters:

Has Email

Has Phone

Has Website

Has WhatsApp

Country

State

City

Industry

Source

Quality

---

# 41. Lead Details

Clicking a lead should open a detailed view.

Display:

Company Name

Description

Industry

Website

Email

Phone

WhatsApp

Address

Location

Social Profiles

Confidence Score

Sources

Discovery Information

Last Updated

---

# 42. Source Evidence

Provide a "Sources" section.

Example:

ABC Foods

Sources:

Company Website
Google Places
Web Search

Email:

[sales@abcfoods.com](mailto:sales@abcfoods.com)

Found on:

Company Contact Page

This will improve user trust in generated data.

---

# 43. Export

Keep existing:

CSV

XLSX

Exports should contain:

Company Name

Industry

Website

Email

Phone

WhatsApp

Address

City

State

Country

LinkedIn

Facebook

Instagram

X/Twitter

YouTube

Lead Quality

Sources

---

# 44. Search History

Keep search history.

Store:

Keyword

Industry

Location

Target Leads

Actual Leads

Sources Used

Search Duration

Credits Used

Created At

Status

Allow:

View

Export

Duplicate Search

Delete

---

# 45. Projects

Keep existing project functionality.

Users can group searches into projects.

Example:

Project:

India Food Exporters

Searches:

Foxnuts

Cashews

Almonds

Healthy Snacks

Allow leads to be associated with project/search.

---

# 46. Error Handling

One failing source must never destroy the entire search.

Example:

Google Places:
FAILED

Reddit:
COMPLETED

Web:
COMPLETED

Website Enrichment:
COMPLETED

Overall Search:
COMPLETED WITH WARNINGS

Store source errors for debugging.

---

# 47. Environment Configuration

Create clear optional environment variables.

Example:

SUPABASE_URL=

SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

FIRECRAWL_API_KEY=

GOOGLE_PLACES_API_KEY=

REDDIT_CLIENT_ID=

REDDIT_CLIENT_SECRET=

GITHUB_TOKEN=

YOUTUBE_API_KEY=

Connectors without credentials should automatically disable themselves.

The application should still function with available connectors.

---

# 48. Development Cost Objective

Target development operating cost:

As close to $0/month as practical.

Use:

Supabase free tier

Vercel free tier where suitable

Native Node.js processing

Cheerio

Regex

Public APIs/free API allowances where permitted

Firecrawl free allowance only when useful

Avoid:

Paid LLM calls

Expensive scraping services

Paid enrichment APIs

Paid email verification APIs

Large proxy networks

Paid browser automation infrastructure

---

# 49. Important Compliance Requirement

Only collect business information from sources where access and use are permitted.

Respect:

* robots.txt where applicable
* API terms
* platform terms
* rate limits
* privacy requirements

Do not attempt to bypass:

* authentication
* CAPTCHAs
* anti-bot protections
* private profiles
* restricted APIs
* paywalls

Do not build unauthorized LinkedIn scraping as a core feature.

Prefer official APIs, licensed data, public company websites, and permitted public sources.

---

# 50. LinkedIn Strategy

For the MVP:

DO NOT scrape LinkedIn.

Instead:

Discover LinkedIn company URLs from:

* Company websites
* Search metadata
* Supported APIs where available

Store:

linkedin_url

Example:

Company Website

↓

Footer

↓

LinkedIn icon

↓

linkedin.com/company/example

↓

Store URL

Do not crawl the LinkedIn profile.

---

# 51. Future AI Upgrade

The architecture must remain AI-ready.

Later, the Research Stage can change from:

Rule-Based Query Generator

to:

AI Research Agent

Later, Structuring can change from:

Regex + DOM Parsing

to:

Parser + AI fallback

Later, Validation can add:

AI Lead Qualification

Later, the platform can add:

* Semantic lead scoring
* Industry relationship discovery
* Buyer/supplier identification
* Competitor discovery
* Natural-language search
* Personalized lead recommendations
* Outreach generation
* Lead summaries
* Deep research
* Automated market analysis

These are NOT required for the current development version.

---

# 52. Future Premium Architecture

Future:

User

↓

AI Research Agent

↓

Source Router

↓

Google / Reddit / Web / Directories / Licensed Data

↓

Candidate Discovery

↓

Website Enrichment

↓

AI Qualification

↓

Advanced Verification

↓

Lead Scoring

↓

CRM

↓

Automated Outreach

The current deterministic architecture should be reusable inside this future architecture.

---

# 53. Development Phases

## Phase 1 — Remove AI Dependency

Tasks:

* Identify every Gemini call.
* Identify every Lovable AI Gateway call.
* Remove mandatory AI dependency.
* Replace AI query generation.
* Replace AI structuring.
* Replace AI validation.
* Ensure existing search UI still works.

Expected result:

A search can complete without any LLM API key.

---

## Phase 2 — Rule-Based Research

Build:

* Query generator
* Business modifiers
* Industry templates
* Location expansion
* Duplicate query removal

Test with:

Foxnuts

Dental Clinics

Software Companies

Solar Panels

Construction Companies

---

## Phase 3 — Native Website Enrichment

Build:

* HTTP fetcher
* Cheerio parser
* Internal page discovery
* Contact page extraction
* About page extraction
* JSON-LD extraction

Extract:

* company
* email
* phone
* WhatsApp
* address
* social links

---

## Phase 4 — Source Connector Architecture

Build:

* LeadSource interface
* Source Router
* Connector configuration
* Error isolation
* Source provenance

Migrate existing Firecrawl functionality into the connector architecture.

---

## Phase 5 — Google Places

Implement optional Google Places connector.

Add:

* configuration
* quotas
* business discovery
* field normalization
* provenance

Do not make it mandatory.

---

## Phase 6 — Reddit

Implement Reddit discovery connector.

Use Reddit primarily to discover:

* companies
* brands
* suppliers
* manufacturers
* market discussions

Send discovered companies into the standard enrichment pipeline.

---

## Phase 7 — Validation

Implement:

* Domain normalization
* Email validation
* Phone normalization
* Duplicate detection
* Confidence scoring

---

## Phase 8 — Database Improvements

Add:

* provenance
* source tracking
* enrichment timestamps
* validation information

Create migrations safely.

Do not destroy existing user/search/lead data.

---

## Phase 9 — UI Improvements

Update real-time workspace to display actual deterministic pipeline activity.

Show:

Sources

Queries

Companies

Websites

Emails

Phones

Duplicates

Final Leads

Keep premium multi-agent visual design.

---

## Phase 10 — Export & QA

Verify:

CSV

XLSX

Search history

Projects

Credits

Realtime

Authentication

Mobile responsiveness

Error handling

Source failure handling

---

# 54. Acceptance Criteria

The MVP is considered successful when:

1. A user can register/login.

2. A user receives initial free credits.

3. A user can create a search.

4. A search works WITHOUT Gemini/OpenAI/Claude.

5. Queries are generated automatically.

6. Multiple enabled sources can participate.

7. Candidate companies are discovered.

8. Official company websites can be identified.

9. Websites can be enriched.

10. Public emails can be extracted.

11. Public phones can be extracted.

12. Social URLs can be discovered.

13. Leads are normalized.

14. Duplicate companies are removed.

15. Every lead receives a deterministic quality score.

16. Source provenance is stored.

17. Leads appear in the UI.

18. Realtime progress works.

19. Credits are consumed correctly.

20. Results can be exported to CSV/XLSX.

21. One source failing does not crash the entire search.

22. Missing API credentials do not crash the application.

23. Resource limits prevent runaway crawling.

24. Existing authentication/projects/dashboard functionality continues working.

---

# 55. Instructions to Coding Agent

IMPORTANT:

Before modifying the codebase:

1. Inspect the complete existing implementation.

2. Identify existing working functionality.

3. Identify Gemini/Vercel AI SDK dependencies.

4. Identify Firecrawl dependencies.

5. Inspect current Supabase schema/migrations.

6. Inspect current lead pipeline.

7. Inspect current realtime implementation.

DO NOT blindly rewrite the project.

Reuse working components.

Create a TODO plan before implementation.

Categorize every task:

DONE

PARTIALLY DONE

NOT IMPLEMENTED

NEEDS MODIFICATION

Then implement incrementally.

After each major phase:

* Run TypeScript checks.
* Run build.
* Check routes.
* Check database types.
* Check environment variables.
* Check search pipeline.
* Verify no existing feature was broken.

---

# 56. Final Product Definition

The CURRENT Questly / Leadly product should be considered:

"A cost-optimized B2B business discovery and lead enrichment platform that searches supported public sources, discovers relevant companies, enriches them using publicly available information from official websites and other permitted sources, validates and deduplicates the results, and generates structured business lead lists."

It should NOT currently depend on AI to function.

The "agent" terminology represents modular processing workers:

Research

Search

Discovery

Enrichment

Structuring

Validation

The long-term product can evolve into a genuine AI-powered multi-agent research platform once the deterministic lead-generation engine has been validated and the project has users/revenue.

---

# 57. Primary Engineering Goal

Build the DATA ENGINE first.

AI comes later.

The priority order is:

Reliable Discovery

↓

Reliable Company Identification

↓

Reliable Website Enrichment

↓

Reliable Contact Extraction

↓

Reliable Deduplication

↓

Reliable Source Tracking

↓

Reliable Export

↓

THEN AI

The MVP must prove that users can enter a business requirement and receive useful, structured, source-backed business leads without requiring expensive AI infrastructure.
