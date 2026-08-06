import { Logo } from "../Logo";
import { Sparkles, ArrowRight, ArrowUp, ShieldCheck } from "lucide-react";

export function CTAFooter() {
  return (
    <section className="relative bg-[#0b0f19] px-5 pb-10 pt-20 sm:pt-28 overflow-hidden text-white border-t border-white/10">
      {/* Background ambient dark mesh glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 bottom-1/3 -translate-x-1/2 h-[550px] w-[850px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-blue-500/5 to-transparent blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[36px] border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] px-7 py-14 text-center backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] sm:px-14 sm:py-20">
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>START DISCOVERING LEADS</span>
            </div>

            <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your next 500 leads are one sentence away.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-300 sm:text-base font-normal">
              Start free with 100 credits, no card required. Watch the multi-agent swarm work and export verified leads in minutes.
            </p>

            {/* Prompt Search Preview Bar */}
            <div className="mt-8 w-full max-w-lg">
              <div className="flex items-center gap-3 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/20 pl-5 pr-1.5 py-1.5 shadow-lg">
                <input
                  readOnly
                  className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-gray-400 outline-none cursor-default font-mono"
                  value="Try: foxnut exporters, protein bar manufacturers..."
                />
                <a
                  href="/auth"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-950 hover:scale-105 active:scale-95 transition-transform shrink-0 flex items-center justify-center font-bold shadow-md"
                  aria-label="Search"
                >
                  <ArrowUp className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </a>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/auth"
                className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-gray-950 transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 shadow-md"
              >
                Try It Free
              </a>
              <a
                href="/auth"
                className="rounded-full ring-1 ring-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                Talk to sales
              </a>
            </div>

            {/* Guarantees */}
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Free 100 credits
              </span>
              <span>•</span>
              <span>No credit card needed</span>
              <span>•</span>
              <span>Instant setup</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-14 flex flex-col items-center justify-between gap-6 border-t border-white/10 pt-8 sm:flex-row text-gray-400">
          <a href="/" className="flex items-center gap-2 text-white">
            <Logo className="h-6 w-6" />
            <span className="text-[15px] font-semibold tracking-tight">Leadly</span>
          </a>

          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-semibold text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All systems operational
            </span>
            <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} Leadly AI</p>
          </div>
        </footer>
      </div>
    </section>
  );
}


