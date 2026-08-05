import { Logo } from "../Logo";

export function CTAFooter() {
  return (
    <section className="relative bg-white px-5 pb-10 pt-20 sm:pt-28">
      <div className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[32px] border border-gray-200 bg-gray-50 px-7 py-14 text-center sm:px-14 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-normal leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
              Your next 500 leads are one sentence away.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
              Start free, no card required. Watch the agents work and export in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/auth"
                className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
              >
                Try It Free
              </a>
              <a
                href="/auth"
                className="rounded-full border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-white"
              >
                Talk to sales
              </a>
            </div>
          </div>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-6 border-t border-gray-200 pt-8 sm:flex-row">
          <Logo className="h-8 w-8 rounded-lg" />
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900">How it works</a>
            <a href="#pricing" className="hover:text-gray-900">Pricing</a>
            <a href="#faq" className="hover:text-gray-900">FAQ</a>
          </nav>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} LeadAI</p>
        </footer>
      </div>
    </section>
  );
}
