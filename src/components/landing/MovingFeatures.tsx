import { Sparkles, Bot, Database, ShieldCheck, Zap, Download, Filter, RefreshCw, CheckCircle2 } from "lucide-react";

export function MovingFeatures() {
  const cards = [
    {
      badge: "SWARM ENGINE",
      title: "6 Parallel AI Agents",
      desc: "Autonomous research, crawling & contact validation in sync.",
      tag: "100% Parallel",
      icon: Bot,
      color: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
    },
    {
      badge: "SOURCE RADAR",
      title: "40+ Public Registries",
      desc: "Maps, open web, GST & official company registries scanned.",
      tag: "Global Coverage",
      icon: Database,
      color: "bg-blue-50 text-blue-800 ring-blue-600/30",
    },
    {
      badge: "SMTP VERIFIER",
      title: "100% Deliverability",
      desc: "Direct RFC 5322 syntax & MX server mailbox verification.",
      tag: "Zero Bounce",
      icon: ShieldCheck,
      color: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
    },
    {
      badge: "CONSOLE STREAM",
      title: "Live Reasoning Logs",
      desc: "Watch agent execution streams & query decisions live.",
      tag: "Real-Time Log",
      icon: Zap,
      color: "bg-purple-50 text-purple-800 ring-purple-600/30",
    },
    {
      badge: "SMART SCORER",
      title: "Relevance Scoring",
      desc: "Filter lead suitability by region, size & completeness.",
      tag: "98% Precision",
      icon: Filter,
      color: "bg-amber-50 text-amber-800 ring-amber-600/30",
    },
    {
      badge: "DATA EXPORT",
      title: "Excel, CSV & Webhooks",
      desc: "Instant direct export straight into HubSpot, Zapier or CRM.",
      tag: "Instant Export",
      icon: Download,
      color: "bg-indigo-50 text-indigo-800 ring-indigo-600/30",
    },
  ];

  // Duplicate cards array for seamless infinite marquee loop
  const marqueeCards = [...cards, ...cards];

  return (
    <section className="relative h-[230px] bg-[#faf9f6] border-y border-gray-200/80 overflow-hidden flex flex-col justify-center py-6">
      {/* Background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[200px] w-[700px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-violet-500/5 to-transparent blur-[80px]"
      />

      {/* Header Pill */}
      <div className="relative mx-auto mb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-3 py-1 text-[11px] font-semibold text-white shadow-2xs">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          FEATURE SPOTLIGHT • HOVER TO PAUSE
        </span>
      </div>

      {/* Infinite Marquee Slider */}
      <div className="relative w-full overflow-hidden">
        {/* Side fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#faf9f6] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#faf9f6] to-transparent z-10" />

        <div className="animate-marquee flex gap-4 px-4">
          {marqueeCards.map((c, i) => (
            <div
              key={`${c.title}-${i}`}
              className="w-[300px] shrink-0 rounded-2xl border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/60 p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.03)] transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {c.badge}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${c.color}`}>
                  {c.tag}
                </span>
              </div>

              <h4 className="mt-2.5 text-sm font-semibold text-gray-950 flex items-center gap-1.5">
                <c.icon className="h-4 w-4 text-gray-900 shrink-0" />
                {c.title}
              </h4>
              <p className="mt-1 text-xs text-gray-600 leading-snug line-clamp-2">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
