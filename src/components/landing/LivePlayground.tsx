import { useState, useEffect } from "react";
import { Sparkles, Search, CheckCircle2, Download, ArrowRight, Bot, ShieldCheck, Database, RefreshCw } from "lucide-react";

interface SampleLead {
  company: string;
  industry: string;
  location: string;
  contact: string;
  email: string;
  phone: string;
  score: number;
}

const PRESETS: Record<string, { prompt: string; leads: SampleLead[] }> = {
  foxnut: {
    prompt: "Foxnut exporters in India with GST licence",
    leads: [
      { company: "Makhana Global Exports", industry: "Agro Food & Spices", location: "Patna, Bihar 🇮🇳", contact: "Rajesh Kumar (Director)", email: "r.kumar@makhanaglobal.in", phone: "+91 98350 12345", score: 98 },
      { company: "Royal Foxnut Industries", industry: "Packaged Snacks", location: "Darbhanga, Bihar 🇮🇳", contact: "Sunil Sharma (Head of Export)", email: "exports@royalfoxnut.com", phone: "+91 94312 67890", score: 96 },
      { company: "GreenEarth Superfoods", industry: "Health Snacks & Organic", location: "New Delhi 🇮🇳", contact: "Ananya Roy (Sourcing Mgr)", email: "a.roy@greenearthsuperfoods.io", phone: "+91 98110 54321", score: 93 },
      { company: "Apex Nutra Agri Corp", industry: "Food Processing", location: "Muzaffarpur, Bihar 🇮🇳", contact: "Vikram Mehta (VP Sales)", email: "v.mehta@apexnutra.co", phone: "+91 97714 89012", score: 91 },
    ],
  },
  protein: {
    prompt: "Protein bar co-manufacturers in USA with FDA registration",
    leads: [
      { company: "NutraBar Manufacturing Co", industry: "Contract Packaging & Food", location: "Austin, TX 🇺🇸", contact: "David Miller (VP Operations)", email: "d.miller@nutrabar.com", phone: "+1 (512) 555-0192", score: 99 },
      { company: "PureFuel Nutrition Labs", industry: "Nutraceuticals & Snacks", location: "Denver, CO 🇺🇸", contact: "Sarah Jenkins (Director of Supply)", email: "s.jenkins@purefuelnutrition.com", phone: "+1 (303) 555-0144", score: 97 },
      { company: "Apex Bar Formulations", industry: "Sport Nutrition OEM", location: "San Diego, CA 🇺🇸", contact: "Michael Chang (Co-Founder)", email: "m.chang@apexbars.io", phone: "+1 (619) 555-0188", score: 94 },
      { company: "Vanguard Botanicals Inc", industry: "Organic Food Products", location: "Portland, OR 🇺🇸", contact: "Emily Watson (Procurement)", email: "emily@vanguardbotanicals.org", phone: "+1 (503) 555-0167", score: 90 },
    ],
  },
  solar: {
    prompt: "Solar equipment distributors in UAE with commercial licence",
    leads: [
      { company: "Gulf Solar Energy LLC", industry: "Renewable Energy", location: "Dubai, UAE 🇦🇪", contact: "Tariq Al-Mansoor (Managing Dir)", email: "tariq@gulfsolarenergy.ae", phone: "+971 4 399 1234", score: 98 },
      { company: "Emirates Clean Tech Ltd", industry: "Power Systems", location: "Abu Dhabi, UAE 🇦🇪", contact: "Zaid Hassan (Head of Business)", email: "z.hassan@emiratescleantech.com", phone: "+971 2 677 8901", score: 95 },
      { company: "Desert Sun Power FZ-LLC", industry: "Commercial Solar OEM", location: "Sharjah, UAE 🇦🇪", contact: "Rashid Khan (Sales VP)", email: "rashid@desertsunsolar.ae", phone: "+971 6 544 3210", score: 92 },
      { company: "Middle East Renewables", industry: "Energy Infrastructure", location: "Dubai, UAE 🇦🇪", contact: "Omar Farooq (Procurement)", email: "o.farooq@merenewables.com", phone: "+971 4 881 4567", score: 90 },
    ],
  },
};

export function LivePlayground() {
  const [selectedKey, setSelectedKey] = useState<string>("foxnut");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(100);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const activePreset = PRESETS[selectedKey];

  const handleSelectPreset = (key: string) => {
    if (isSearching) return;
    setSelectedKey(key);
    setIsSearching(true);
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(55), 400);
    const timer2 = setTimeout(() => setProgress(85), 800);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setIsSearching(false);
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  };

  const handleExport = (type: string) => {
    setDownloadSuccess(`Exported ${activePreset.leads.length} verified leads as .${type}!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <section className="relative bg-[#0b0f19] px-5 py-20 sm:py-28 overflow-hidden text-white border-y border-white/10">
      {/* Ambient background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[850px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-blue-500/5 to-transparent blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>INTERACTIVE DEMO PLAYGROUND</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Test the AI Swarm Live
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-gray-300 sm:text-base">
            Select a sample brief to watch our 6 parallel agents plan queries, crawl public registries, and verify B2B lead records.
          </p>
        </div>

        {/* Interactive Preset Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
          {[
            { key: "foxnut", label: "🌾 Foxnut Exporters India" },
            { key: "protein", label: "🏋️ Protein Bar Manufacturers USA" },
            { key: "solar", label: "☀️ Solar Distributors UAE" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelectPreset(item.key)}
              disabled={isSearching}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                selectedKey === item.key
                  ? "bg-white text-gray-950 shadow-md ring-2 ring-white"
                  : "bg-white/10 text-gray-200 ring-1 ring-white/15 hover:bg-white/20 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Bar Visualizer */}
        <div className="mt-8 mx-auto max-w-2xl rounded-full bg-white/10 p-2 backdrop-blur-xl ring-1 ring-white/20 shadow-2xl flex items-center gap-3 px-5">
          <Search className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="flex-1 text-xs sm:text-sm text-gray-200 font-mono truncate">
            {activePreset.prompt}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
            {isSearching ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                Agents Active...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Completed ({activePreset.leads.length} Leads)
              </>
            )}
          </span>
        </div>

        {/* Active Progress Bar */}
        {isSearching && (
          <div className="mt-4 mx-auto max-w-2xl">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1.5">
              <span>Swarm Status: Crawling & Validating Contacts...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Notification Alert for Export */}
        {downloadSuccess && (
          <div className="mt-4 mx-auto max-w-md rounded-full bg-emerald-500/20 border border-emerald-500/40 p-3 text-center text-xs font-semibold text-emerald-300 animate-fade-down">
            ✅ {downloadSuccess}
          </div>
        )}

        {/* Interactive Lead Data Table Card */}
        <div className="mt-8 overflow-hidden rounded-[28px] border border-white/15 bg-gradient-to-b from-white/[0.07] to-white/[0.02] backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]">
          {/* Table Control Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">Sourced Lead Results ({activePreset.leads.length} companies)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport("xlsx")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-950 transition-all hover:bg-gray-100 shadow-sm"
              >
                <Download className="h-3.5 w-3.5" /> Export Excel (.xlsx)
              </button>
              <button
                onClick={() => handleExport("csv")}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-all"
              >
                <Download className="h-3.5 w-3.5" /> .CSV
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Company Name</th>
                  <th className="px-6 py-3.5">Industry</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Decision Maker</th>
                  <th className="px-6 py-3.5">Verified Email</th>
                  <th className="px-6 py-3.5">Match Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-200">
                {activePreset.leads.map((lead, idx) => (
                  <tr key={idx} className="transition-colors hover:bg-white/[0.04]">
                    <td className="px-6 py-4 font-semibold text-white truncate max-w-[180px]">
                      {lead.company}
                    </td>
                    <td className="px-6 py-4 text-gray-300">{lead.industry}</td>
                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{lead.location}</td>
                    <td className="px-6 py-4 text-gray-200 font-medium">{lead.contact}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        {lead.email}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                        {lead.score}% Match
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
