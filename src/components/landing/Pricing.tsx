import { Check } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    note: "100 credits / month",
    features: ["1 project", "Up to 50 leads per search", "CSV export", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$49",
    note: "per month",
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
    price: "Custom",
    note: "talk to us",
    features: ["Volume credits", "Custom sources", "Team seats & roles", "Dedicated onboarding"],
    cta: "Talk to sales",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Pricing</p>
          <h2 className="mt-3 text-3xl font-normal leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
            Pay for leads, not seats.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
            Every plan includes the full agent swarm. Scale credits as your pipeline grows.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={
                tier.highlight
                  ? "relative rounded-[26px] bg-[#0b0f19] p-8 shadow-[0_40px_80px_-50px_rgba(0,0,0,0.9)] lg:-mt-4 lg:pb-10"
                  : "relative rounded-[26px] border border-gray-200 bg-gray-50/60 p-8"
              }
            >
              {tier.highlight && (
                <span className="absolute right-6 top-6 rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-gray-300">
                  Popular
                </span>
              )}
              <h3 className={tier.highlight ? "text-sm text-gray-400" : "text-sm text-gray-500"}>
                {tier.name}
              </h3>
              <div className="mt-4 flex items-end gap-2">
                <span
                  className={
                    tier.highlight ? "text-5xl tracking-tight text-white" : "text-5xl tracking-tight text-gray-900"
                  }
                >
                  {tier.price}
                </span>
                <span className={tier.highlight ? "pb-2 text-xs text-gray-500" : "pb-2 text-xs text-gray-400"}>
                  {tier.note}
                </span>
              </div>

              <div className={tier.highlight ? "my-7 h-px bg-white/10" : "my-7 h-px bg-gray-200"} />

              <ul className="space-y-3">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className={
                      tier.highlight ? "flex items-start gap-3 text-sm text-gray-300" : "flex items-start gap-3 text-sm text-gray-600"
                    }
                  >
                    <Check
                      className={
                        tier.highlight ? "mt-0.5 h-4 w-4 shrink-0 text-white" : "mt-0.5 h-4 w-4 shrink-0 text-gray-900"
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
                    ? "mt-9 block rounded-full bg-white px-6 py-3 text-center text-sm font-medium text-gray-900 transition-all hover:shadow-lg"
                    : "mt-9 block rounded-full bg-gray-900 px-6 py-3 text-center text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
                }
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
