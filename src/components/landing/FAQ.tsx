import { useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Where do the leads come from?",
    a: "Agents crawl public sources — business directories, marketplaces, company websites and open registries — then cross-check the results before writing a record.",
  },
  {
    q: "How accurate are the contacts?",
    a: "Every email and phone is format-checked, deduplicated and scored. Low-confidence records are flagged so you can decide whether to keep them.",
  },
  {
    q: "Can I see what the AI did?",
    a: "Yes. The agent workspace streams each agent's reasoning and actions live, and every run is stored in history for auditing.",
  },
  {
    q: "What formats can I export?",
    a: "Excel (.xlsx) and CSV, with your chosen columns. Exports are stored so you can re-download them any time.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-[#0b0f19] px-5 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">FAQ</p>
          <h2 className="mt-3 text-3xl font-normal leading-[1.1] tracking-tight text-white sm:text-5xl">
            Good questions.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
            Still stuck? Reach the team at hello@leadai.app and we'll reply the same day.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={`rounded-[22px] border transition-colors duration-300 ${
                  isOpen ? "border-white/20 bg-white/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base text-white sm:text-lg">{faq.q}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15">
                    <Plus
                      className={`h-4 w-4 text-gray-300 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-gray-400">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
