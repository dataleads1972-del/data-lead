const steps = [
  {
    n: "01",
    title: "Describe your ideal customer",
    body: "Type a plain-English brief — “foxnut exporters in India with an export licence”. No filters to configure.",
  },
  {
    n: "02",
    title: "Agents go to work",
    body: "The swarm plans queries, crawls sources, dedupes companies and enriches every record with contacts.",
  },
  {
    n: "03",
    title: "Review and export",
    body: "Sort by score, open a company drawer for the full profile, then export the shortlist to Excel or CSV.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#0b0f19] px-5 py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-white/5 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">How it works</p>
          <h2 className="mt-3 text-3xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl">
            From a sentence
            <span className="block text-gray-500">to a sourced list.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.n}
              className="group rounded-[26px] border border-white/10 bg-white/[0.03] p-7 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.06]"
            >
              <span className="inline-flex h-9 items-center rounded-full border border-white/15 px-3 text-xs tracking-[0.16em] text-gray-400">
                {step.n}
              </span>
              <h3 className="mt-6 text-xl leading-snug text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
