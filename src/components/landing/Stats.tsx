export function Stats() {
  return (
    <section className="relative bg-[#0b0f19] px-5 py-16 sm:py-20 -mt-6 z-20 overflow-hidden">
      {/* Richer background ambient mesh glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[800px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-blue-500/5 to-transparent blur-[140px]"
      />
      
      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 sm:gap-6">
          {/* Custom Stat 1: Agent Swarm */}
          <div className="group relative flex flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/40 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)]">
            <div className="flex items-center justify-between">
              {/* Bespoke Agent Swarm Avatars */}
              <div className="flex -space-x-1.5 overflow-hidden">
                {["Search", "Scrape", "Enrich"].map((name, i) => (
                  <span
                    key={name}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-[10px] font-bold text-gray-950 ring-2 ring-[#0b0f19] shadow-xs"
                  >
                    A{i + 1}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Swarm
              </span>
            </div>

            <div className="my-6">
              <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">6</div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
                AI agents per run
              </p>
            </div>

            <div className="w-full border-t border-white/10 pt-3.5 text-[12px] text-gray-300 font-medium flex items-center justify-between">
              <span>Parallel Execution</span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">100% Sync</span>
            </div>
          </div>

          {/* Custom Stat 2: Public Sources */}
          <div className="group relative flex flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:border-blue-500/40 hover:shadow-[0_20px_50px_-15px_rgba(59,130,246,0.15)]">
            <div className="flex items-center justify-between">
              {/* Bespoke Source Signal Bars */}
              <div className="flex items-end gap-1 h-6">
                <span className="w-1.5 h-3 rounded-full bg-blue-400" />
                <span className="w-1.5 h-4.5 rounded-full bg-blue-400" />
                <span className="w-1.5 h-6 rounded-full bg-blue-400" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-medium text-blue-300 ring-1 ring-inset ring-blue-500/30">
                Global Coverage
              </span>
            </div>

            <div className="my-6">
              <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">40+</div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
                public sources scanned
              </p>
            </div>

            <div className="w-full border-t border-white/10 pt-3.5 text-[12px] text-gray-300 font-medium flex items-center justify-between">
              <span>Maps, Web & Registries</span>
              <span className="text-blue-400 font-mono text-[11px] font-semibold">Live Feed</span>
            </div>
          </div>

          {/* Custom Stat 3: Match Rate */}
          <div className="group relative flex flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/40 hover:shadow-[0_20px_50px_-15px_rgba(16,185,129,0.15)]">
            <div className="flex items-center justify-between">
              {/* Bespoke Match Gauge */}
              <div className="h-6 px-2.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center text-[10px] font-mono text-emerald-300 font-semibold">
                SCORE: 0.92
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30">
                SMTP Checked
              </span>
            </div>

            <div className="my-6">
              <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">92%</div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
                contact match rate
              </p>
            </div>

            <div className="w-full border-t border-white/10 pt-3.5 text-[12px] text-gray-300 font-medium flex items-center justify-between">
              <span>Verified Emails & Phones</span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">High Quality</span>
            </div>
          </div>

          {/* Custom Stat 4: Run Time */}
          <div className="group relative flex flex-col justify-between rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:border-purple-500/40 hover:shadow-[0_20px_50px_-15px_rgba(168,85,247,0.15)]">
            <div className="flex items-center justify-between">
              {/* Bespoke Timer Tag */}
              <div className="h-6 px-2.5 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-1.5 text-[10px] font-mono text-purple-300 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                SPEED
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/15 px-3 py-1 text-[11px] font-medium text-purple-300 ring-1 ring-inset ring-purple-500/30">
                Real-Time
              </span>
            </div>

            <div className="my-6">
              <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">4 min</div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
                average run time
              </p>
            </div>

            <div className="w-full border-t border-white/10 pt-3.5 text-[12px] text-gray-300 font-medium flex items-center justify-between">
              <span>Full Swarm Research</span>
              <span className="text-purple-400 font-mono text-[11px] font-semibold">Auto Export</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



