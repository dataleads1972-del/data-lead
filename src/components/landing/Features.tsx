import { Bot, Database, Filter, FileSpreadsheet, ShieldCheck, Workflow } from "lucide-react";

const items = [
  {
    icon: Bot,
    title: "Multi-agent swarm",
    body: "Six specialised agents research, search, discover, enrich, validate and export — all working in parallel on one brief.",
    wide: true,
  },
  {
    icon: Database,
    title: "Multi-source discovery",
    body: "Directories, marketplaces, company sites and public registries scanned in a single run.",
  },
  {
    icon: Workflow,
    title: "Live reasoning",
    body: "Watch every step stream in real time, with an auditable log for each agent.",
  },
  {
    icon: Filter,
    title: "Smart filtering",
    body: "Score by relevance, region, size and contact completeness before you open a row.",
  },
  {
    icon: ShieldCheck,
    title: "Verified contacts",
    body: "Emails and phones checked for format, deliverability signals and duplicates.",
  },
  {
    icon: FileSpreadsheet,
    title: "One-click export",
    body: "Clean Excel or CSV straight into your CRM or outbound sequence.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative bg-white px-5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Platform</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-normal leading-[1.1] tracking-tight text-gray-900 sm:text-5xl">
              Everything a research team does.
              <span className="block text-gray-400">In a few minutes.</span>
            </h2>
          </div>
          <a
            href="/auth"
            className="w-fit rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 hover:shadow-lg"
          >
            Try It Free
          </a>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.title}
              className={`group relative overflow-hidden rounded-[26px] border border-gray-200 bg-gray-50/60 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:bg-white hover:shadow-[0_24px_60px_-40px_rgba(0,0,0,0.6)] ${
                item.wide ? "sm:col-span-2 lg:col-span-1 lg:row-span-1" : ""
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-900 text-white transition-transform duration-300 group-hover:scale-105">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-lg text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
