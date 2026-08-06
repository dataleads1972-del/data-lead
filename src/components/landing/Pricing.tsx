import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  const tiers = [
    {
      name: "Starter",
      monthlyPrice: "$0",
      annualPrice: "$0",
      note: "100 credits / month",
      features: ["1 project", "Up to 50 leads per search", "CSV export", "Community support"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Growth",
      monthlyPrice: "$49",
      annualPrice: "$39",
      note: annual ? "per month, billed annually" : "per month",
      features: [
        "Unlimited projects",
        "2,500 leads / month",
        "Excel + CSV export",
        "Live agent workspace",
        "Priority support",
      ],
      cta: "Try It Free",
      highlight: true,
    },
    {
      name: "Scale",
      monthlyPrice: "Custom",
      annualPrice: "Custom",
      note: "talk to sales team",
      features: ["Volume credits", "Custom sources", "Team seats & roles", "Dedicated onboarding"],
      cta: "Talk to sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="relative bg-[#faf9f6] px-5 py-20 sm:py-28 overflow-hidden">
      {/* Background ambient light mesh glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[550px] w-[750px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500/10 via-emerald-500/5 to-transparent blur-[140px]"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-900/10 px-3.5 py-1.5 text-xs font-semibold text-gray-900 ring-1 ring-gray-900/15 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-gray-900" />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-gray-950 sm:text-5xl">
            Pay for leads, not seats.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-700 sm:text-base font-normal">
            Every plan includes the full multi-agent swarm. Scale credits as your pipeline grows.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-xs ${!annual ? "text-gray-950 font-bold" : "text-gray-500 font-medium"}`}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-950 p-1 transition-colors focus:outline-none shadow-xs"
              aria-label="Toggle annual billing"
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white transition-transform shadow-xs ${
                  annual ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs ${annual ? "text-gray-950 font-bold" : "text-gray-500 font-medium"}`}>
                Annual
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-600/30">
                Save 20%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice;
            return (
              <div
                key={tier.name}
                className={
                  tier.highlight
                    ? "relative rounded-[32px] bg-[#121622] p-8 sm:p-9 text-white shadow-[0_35px_80px_-20px_rgba(15,23,42,0.55)] ring-1 ring-white/20 lg:-mt-4 lg:pb-10 transition-all duration-300 hover:scale-[1.02]"
                    : "relative rounded-[32px] border border-gray-200/90 bg-gradient-to-b from-white to-gray-50/50 p-8 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] transition-all duration-300 hover:-translate-y-1.5 hover:border-gray-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
                }
              >
                {tier.highlight && (
                  <span className="absolute right-6 top-6 rounded-full bg-emerald-400/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/40">
                    Most Popular
                  </span>
                )}
                <h3 className={tier.highlight ? "text-sm font-semibold text-gray-300" : "text-sm font-semibold text-gray-600"}>
                  {tier.name}
                </h3>
                <div className="mt-4 flex items-end gap-2">
                  <span
                    className={
                      tier.highlight ? "text-5xl font-semibold tracking-tight text-white" : "text-5xl font-semibold tracking-tight text-gray-950"
                    }
                  >
                    {price}
                  </span>
                  <span className={tier.highlight ? "pb-2 text-xs font-medium text-gray-400" : "pb-2 text-xs font-medium text-gray-600"}>
                    {tier.note}
                  </span>
                </div>

                <div className={tier.highlight ? "my-7 h-px bg-white/10" : "my-7 h-px bg-gray-100"} />

                <ul className="space-y-3.5">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className={
                        tier.highlight
                          ? "flex items-center gap-3 text-sm text-gray-200"
                          : "flex items-center gap-3 text-sm text-gray-600"
                      }
                    >
                      <Check
                        className={
                          tier.highlight ? "h-4 w-4 shrink-0 text-emerald-400" : "h-4 w-4 shrink-0 text-emerald-600"
                        }
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/auth"
                  className={
                    tier.highlight
                      ? "mt-9 block rounded-full bg-white px-6 py-3.5 text-center text-sm font-medium text-gray-900 transition-all hover:bg-gray-100 hover:scale-[1.02] active:scale-95 shadow-md"
                      : "mt-9 block rounded-full bg-gray-900 px-6 py-3.5 text-center text-sm font-medium text-white transition-all hover:bg-gray-800 hover:scale-[1.02] active:scale-95 shadow-xs"
                  }
                >
                  {tier.cta}
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

