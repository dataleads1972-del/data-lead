import { useState } from "react";
import { Sparkles, CheckCircle2, Download, Bot, Database, Filter, ShieldCheck, Workflow, FileSpreadsheet, ArrowRight, Zap, RefreshCw } from "lucide-react";

export function Features() {
  const [activeTab, setActiveTab] = useState<string>("swarm");
  const [scoreFilter, setScoreFilter] = useState<number>(85);
  const [activeAgent, setActiveAgent] = useState<number>(0);

  const agents = [
    { title: "Discovery Agent", role: "Search Planning", query: "foxnut exporters in India", status: "Active" },
    { title: "Crawler Agent", role: "Web & Map Crawling", query: "Scanning 42 domains...", status: "Active" },
    { title: "Enricher Agent", role: "Contact Extraction", query: "Extracting emails & phones", status: "Active" },
    { title: "Deduper Agent", role: "Record Matching", query: "0 duplicate rows", status: "Completed" },
    { title: "SMTP Verifier", role: "Deliverability Ping", query: "100% SMTP Check", status: "Active" },
    { title: "Export Agent", role: "Format Generation", query: "Excel & CSV Ready", status: "Ready" },
  ];

  return (
    <section id="features" className="relative bg-[#faf9f6] px-5 py-20 sm:py-28 overflow-hidden">
      {/* Soft background ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-amber-500/5 to-transparent blur-[140px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 bottom-1/4 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/10 via-violet-500/5 to-transparent blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-900/10 px-3.5 py-1.5 text-xs font-semibold text-gray-900 ring-1 ring-gray-900/15 shadow-2xs">
              <Sparkles className="h-3.5 w-3.5 text-gray-900" />
              <span>PLATFORM CAPABILITIES</span>
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-tight text-gray-950 sm:text-5xl">
              Everything a research team does.
              <span className="block text-gray-400">In a few minutes.</span>
            </h2>
          </div>
          <a
            href="/auth"
            className="w-fit rounded-full bg-gray-950 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-gray-800 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
          >
            Try It Free
          </a>
        </div>

        {/* Interactive Capability Tabs */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-b border-gray-200/80 pb-4">
          {[
            { id: "swarm", label: "🤖 AI Swarm Engine", badge: "6 Agents" },
            { id: "radar", label: "🌐 Source Radar", badge: "40+ Sources" },
            { id: "scoring", label: "⚡ Smart Scoring", badge: "Relevance Filter" },
            { id: "verify", label: "🛡️ SMTP Verifier", badge: "100% Valid" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-gray-950 text-white shadow-md ring-2 ring-gray-950"
                  : "bg-white/80 text-gray-700 ring-1 ring-gray-200 hover:bg-white hover:text-gray-950"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Featured Live Demonstrator Canvas */}
        <div className="mt-6 overflow-hidden rounded-[32px] border border-gray-200/90 bg-gradient-to-b from-white via-white to-gray-50/60 p-6 sm:p-8 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_20px_50px_-15px_rgba(0,0,0,0.06)]">
          {activeTab === "swarm" && (
            <div className="animate-fade-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-950">Multi-Agent Swarm Visualizer</h3>
                  <p className="text-xs text-gray-600">Click any agent below to inspect its active tasks and data stream.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-700 font-semibold">Swarm Active • 6 Parallel Nodes</span>
                </div>
              </div>

              {/* Agent Grid */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {agents.map((ag, i) => (
                  <button
                    key={ag.title}
                    onClick={() => setActiveAgent(i)}
                    className={`flex flex-col text-left rounded-2xl p-4 transition-all ${
                      activeAgent === i
                        ? "bg-gray-950 text-white shadow-lg ring-2 ring-gray-950 scale-[1.03]"
                        : "bg-gray-50/80 text-gray-800 ring-1 ring-gray-200/80 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold ${activeAgent === i ? "text-emerald-400" : "text-gray-400"}`}>
                        0{i + 1}
                      </span>
                      <span className={`h-1.5 w-1.5 rounded-full ${activeAgent === i ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`} />
                    </div>
                    <span className="mt-3 text-xs font-semibold truncate">{ag.title}</span>
                    <span className={`mt-1 text-[10px] ${activeAgent === i ? "text-gray-300" : "text-gray-500"}`}>
                      {ag.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Agent Detail Panel */}
              <div className="mt-6 rounded-2xl bg-[#121622] p-5 text-white ring-1 ring-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <Bot className="h-4 w-4" />
                    <span>Agent #{activeAgent + 1}: {agents[activeAgent].title}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-200 font-medium">{agents[activeAgent].query}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    Status: {agents[activeAgent].status}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">Latency: 12ms</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "radar" && (
            <div className="animate-fade-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-950">Multi-Source Discovery Radar</h3>
                  <p className="text-xs text-gray-600">Simultaneous data ingestion from global business registries and open maps.</p>
                </div>
                <span className="text-xs font-mono text-emerald-700 font-semibold">40+ Active Data Feeds</span>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { name: "Google Places API", type: "Geospatial & Address", status: "99.9% Uptime", latency: "14ms" },
                  { name: "OpenStreetMap Overpass", type: "Open Registries", status: "Live Feed", latency: "22ms" },
                  { name: "Company Web Scraper", type: "Domain Contacts", status: "Active Crawl", latency: "35ms" },
                  { name: "Government Registries", type: "GST & Export Licences", status: "Verified", latency: "18ms" },
                ].map((src) => (
                  <div key={src.name} className="rounded-2xl bg-gray-50/90 p-4 ring-1 ring-gray-200/80">
                    <div className="flex items-center justify-between">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-gray-500">{src.latency}</span>
                    </div>
                    <h4 className="mt-3 text-xs font-semibold text-gray-950">{src.name}</h4>
                    <p className="mt-1 text-[11px] text-gray-600">{src.type}</p>
                    <span className="mt-3 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      {src.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "scoring" && (
            <div className="animate-fade-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-950">Relevance Score Filter</h3>
                  <p className="text-xs text-gray-600">Drag the slider below to dynamically set lead relevance threshold.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Threshold:</span>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                    {scoreFilter}% Min Score
                  </span>
                </div>
              </div>

              <div className="mt-6 max-w-xl mx-auto">
                <input
                  type="range"
                  min="50"
                  max="98"
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-950"
                />
                <div className="flex justify-between text-xs text-gray-500 font-mono mt-2">
                  <span>50% (Broad Leads)</span>
                  <span>75% (Targeted)</span>
                  <span>98% (Strict Match)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "verify" && (
            <div className="animate-fade-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-950">SMTP Deliverability Engine</h3>
                  <p className="text-xs text-gray-600">Real-time email format, MX record, and mailbox deliverability check.</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full ring-1 ring-emerald-600/30">
                  100% Deliverability Signal
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-950">Format & Regex Check</span>
                  <p className="mt-1 text-gray-600 text-[11px]">Valid RFC 5322 syntax validation</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                  </span>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-950">MX Server Lookup</span>
                  <p className="mt-1 text-gray-600 text-[11px]">Verifies domain DNS mail exchange</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active Server
                  </span>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                  <span className="font-semibold text-gray-950">Deliverability Score</span>
                  <p className="mt-1 text-gray-600 text-[11px]">Low bounce risk guaranteed</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> High Confidence
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bento Grid */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Multi-Agent Swarm (Large Bento) */}
          <div className="group relative overflow-hidden rounded-[28px] border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/50 p-7 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-gray-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                SWARM ENGINE
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/30">
                6 Parallel Agents
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-xl font-semibold tracking-tight text-gray-950">Multi-agent swarm</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-700 font-normal">
                Six specialised agents research, search, discover, enrich, validate and export — all working in parallel on one brief.
              </p>
            </div>

            {/* Embedded Live Agent Swarm Preview Widget */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-2xl bg-gray-50/80 p-3 ring-1 ring-gray-200/60">
              {[
                { name: "Search Agent", status: "Active", count: "128 queries" },
                { name: "Crawler Agent", status: "Active", count: "42 sites" },
                { name: "Enricher Agent", status: "Active", count: "962 records" },
                { name: "Validator Agent", status: "Active", count: "100% verified" },
                { name: "Deduper Agent", status: "Done", count: "0 duplicates" },
                { name: "Exporter Agent", status: "Ready", count: "Excel / CSV" },
              ].map((ag) => (
                <div key={ag.name} className="flex flex-col rounded-xl bg-white p-2.5 shadow-2xs ring-1 ring-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-800 truncate">{ag.name}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="mt-1 text-[10px] text-gray-400">{ag.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Multi-source discovery */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-gray-200/80 bg-white/80 p-7 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:bg-white hover:shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gray-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                  SOURCE RADAR
                </span>
                <span className="text-xs font-semibold text-gray-600">40+ Sources</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-gray-950">Multi-source discovery</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 font-normal">
                Directories, marketplaces, company sites and public registries scanned in a single run.
              </p>
            </div>

            {/* Source Badges */}
            <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-gray-100">
              {["Google Maps", "OpenStreetMap", "Web Crawl", "Registries", "LinkedIn Signal"].map((s) => (
                <span key={s} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-800 ring-1 ring-gray-200">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: Live reasoning */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-gray-200/80 bg-white/80 p-7 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:bg-white hover:shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gray-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                  CONSOLE LOG
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
                </span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-gray-950">Live reasoning</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 font-normal">
                Watch every step stream in real time, with an auditable log for each agent.
              </p>
            </div>

            {/* Live Terminal Log Snippet */}
            <div className="mt-6 rounded-xl bg-[#121622] p-3 text-[11px] font-mono text-gray-300 ring-1 ring-white/10">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Agent #2: Scraping domain data...</span>
              </div>
              <p className="mt-1 text-gray-400 truncate">&gt; Sourced 14 emails & 8 phones</p>
            </div>
          </div>

          {/* Card 4: Smart filtering */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-gray-200/80 bg-white/80 p-7 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:bg-white hover:shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gray-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                  LEAD SCORER
                </span>
                <span className="text-xs font-semibold text-emerald-700 font-mono">98% SCORE</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-gray-950">Smart filtering</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 font-normal">
                Score by relevance, region, size and contact completeness before you open a row.
              </p>
            </div>

            {/* Score Pill Card */}
            <div className="mt-6 flex items-center justify-between rounded-xl bg-emerald-50/80 p-3 ring-1 ring-emerald-200/70">
              <span className="text-xs font-semibold text-emerald-950">Relevance Score</span>
              <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">98% Match</span>
            </div>
          </div>

          {/* Card 5: Verified contacts */}
          <div className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-gray-200/80 bg-white/80 p-7 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:bg-white hover:shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-gray-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                  SMTP VERIFIER
                </span>
                <span className="text-xs font-semibold text-emerald-700">VERIFIED</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight text-gray-950">Verified contacts</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700 font-normal">
                Emails and phones checked for format, deliverability signals and duplicates.
              </p>
            </div>

            {/* Verification Badge */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-gray-50 p-3 ring-1 ring-gray-200/70 text-xs text-gray-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">100% Deliverability Verified</span>
            </div>
          </div>

          {/* Card 6: One-click export & CRM Sync (Full Width Bento Banner) */}
          <div className="group relative overflow-hidden rounded-[28px] border border-gray-200/90 bg-gradient-to-r from-white via-white to-emerald-50/40 p-7 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] sm:col-span-2 lg:col-span-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-gray-950 px-3.5 py-1 text-xs font-semibold text-white shadow-xs">
                    DATA EXPORT & CRM SYNC
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/30">
                    Instant Download & Webhook
                  </span>
                </div>

                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-gray-950">
                  One-click export to Excel, CSV, or your CRM
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 font-normal">
                  Clean, structured lead data ready for instant outbound sequences. Stream directly into HubSpot, Salesforce, Zapier, or download clean spreadsheets.
                </p>

                {/* Export Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-950 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors cursor-pointer">
                    <Download className="h-3.5 w-3.5" /> Download Excel (.xlsx)
                  </span>
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-gray-800 ring-1 ring-gray-200 hover:bg-gray-100 transition-colors cursor-pointer shadow-2xs">
                    <Download className="h-3.5 w-3.5" /> Download CSV (.csv)
                  </span>
                  <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-600/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Webhook API Ready
                  </span>
                </div>
              </div>

              {/* Supported CRM Badges */}
              <div className="flex flex-col gap-2.5 rounded-2xl bg-gray-50/90 p-4.5 ring-1 ring-gray-200/80 shrink-0 min-w-[260px]">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Direct Integrations</span>
                <div className="flex flex-wrap gap-1.5">
                  {["HubSpot", "Salesforce", "Zapier", "Pipedrive", "Airtable", "Notion"].map((crm) => (
                    <span key={crm} className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs ring-1 ring-gray-200/60">
                      {crm}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold pt-2 border-t border-gray-200/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> 100% Schema Auto-mapped
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

