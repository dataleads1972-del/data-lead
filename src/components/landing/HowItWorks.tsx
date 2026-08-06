import { Sparkles, ArrowRight, CheckCircle, Download, Search } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Describe your ideal customer",
    body: "Type a plain-English brief — “foxnut exporters in India with an export licence”. No complex filters or queries required.",
    badge: "Input Brief",
    widget: (
      <div className="mt-6 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 ring-1 ring-white/15 text-xs text-gray-200">
        <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <span className="truncate">"foxnut exporters in India..."</span>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-900">Enter</span>
      </div>
    ),
  },
  {
    n: "02",
    title: "Agents go to work",
    body: "The swarm plans queries, crawls sources, dedupes companies and enriches every record with verified contacts.",
    badge: "Swarm Execution",
    widget: (
      <div className="mt-6 space-y-2 rounded-2xl bg-black/40 p-3 text-xs text-white ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Crawling 42 Sources
          </span>
          <span className="text-[10px] text-gray-400">92% Match</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-3/4 bg-emerald-400 rounded-full" />
        </div>
      </div>
    ),
  },
  {
    n: "03",
    title: "Review and export",
    body: "Sort by score, open a company drawer for the full profile, then export the shortlist directly to Excel or CSV.",
    badge: "Instant Export",
    widget: (
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-500/10 p-3 ring-1 ring-emerald-500/20 text-xs text-emerald-300">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-[11px]">1,284 Leads Ready</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-medium text-gray-950 shadow-2xs">
          <Download className="h-3 w-3" /> Export
        </span>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#0b0f19] px-5 py-20 sm:py-28">
      {/* Background ambient dark mesh glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/15 via-emerald-500/5 to-transparent blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>SIMPLE 3-STEP WORKFLOW</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
            From a sentence
            <span className="block text-gray-400">to a sourced lead list.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.n}
              className="group relative flex flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:border-white/25 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-950 shadow-sm">
                    {step.n}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-gray-200 ring-1 ring-white/15">
                    {step.badge}
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300 font-normal">{step.body}</p>
              </div>

              {step.widget}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


