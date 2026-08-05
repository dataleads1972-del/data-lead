const stats = [
  { value: "6", label: "AI agents per run" },
  { value: "40+", label: "public sources scanned" },
  { value: "92%", label: "contact match rate" },
  { value: "4 min", label: "average run time" },
];

export function Stats() {
  return (
    <section className="relative bg-[#0b0f19] px-5 py-16 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/10 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#0b0f19] px-6 py-8 text-center sm:py-10">
            <div className="text-4xl tracking-tight text-white sm:text-5xl">{s.value}</div>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
