import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";

const categories = ["All", "Sources & Accuracy", "Agent Swarm", "Exports & CRM"];

const faqs = [
  {
    category: "Sources & Accuracy",
    q: "Where do the leads come from?",
    a: "Agents crawl public sources — business directories, marketplaces, company websites and open registries — then cross-check the results before writing a record.",
  },
  {
    category: "Sources & Accuracy",
    q: "How accurate are the contacts?",
    a: "Every email and phone is format-checked, deduplicated and scored. Low-confidence records are flagged so you can decide whether to keep them.",
  },
  {
    category: "Agent Swarm",
    q: "Can I see what the AI did?",
    a: "Yes. The agent workspace streams each agent's reasoning and actions live, and every run is stored in history for auditing.",
  },
  {
    category: "Exports & CRM",
    q: "What formats can I export?",
    a: "Excel (.xlsx) and CSV, with your chosen columns. Exports are stored so you can re-download them any time.",
  },
  {
    category: "Exports & CRM",
    q: "Do I need a credit card to start?",
    a: "No card is required. You get 100 free credits upon signing up to test the multi-agent swarm on your target niche.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFaqs = activeCategory === "All" 
    ? faqs 
    : faqs.filter((f) => f.category === activeCategory);

  return (
    <section id="faq" className="relative bg-[#0b0f19] px-5 py-20 sm:py-28 overflow-hidden">
      {/* Background ambient dark mesh glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-1/4 bottom-10 h-[450px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-blue-500/5 to-transparent blur-[140px]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>FREQUENTLY ASKED</span>
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl">
            Good questions.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-300 font-normal">
            Still stuck? Reach out to our team at{" "}
            <a href="mailto:support@leadly.ai" className="font-semibold text-white underline hover:text-gray-200">
              hello@leadly.ai
            </a>{" "}
            and we'll reply the same day.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpen(0);
                }}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-white text-gray-900 shadow-2xs font-semibold"
                    : "bg-white/10 text-gray-300 ring-1 ring-white/15 hover:bg-white/20 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          {filteredFaqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={`rounded-[24px] border backdrop-blur-xl transition-all duration-300 ${
                  isOpen
                    ? "border-white/25 bg-white/[0.08] shadow-2xl ring-1 ring-white/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-medium text-white sm:text-lg">{faq.q}</span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isOpen ? "bg-white text-gray-900" : "bg-white/10 text-white ring-1 ring-white/15"
                    }`}
                  >
                    <Plus
                      className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                    />
                  </span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 pt-1 text-sm leading-relaxed text-gray-300">{faq.a}</p>
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


