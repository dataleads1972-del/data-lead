import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Monitor,
  RotateCw,
  Share,
  Plus,
  Copy,
  Grid,
  Compass,
  Layers,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";

export function ScaledDashboard({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = outerRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const update = () => {
      const w = el.clientWidth;
      const s = Math.min(1, w / 896);
      setScale(s);
      setHeight(inner.offsetHeight * s);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={outerRef} style={{ height }} className="relative w-full">
      <div
        ref={innerRef}
        style={{ width: 896, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}

const recent = [
  "Foxnuts exporters India",
  "Protein bar manufacturers",
  "Organic snack distributors",
  "Nutraceutical buyers EU",
];

const stats = [
  { label: "LEADS FOUND", value: "1,284", sub: "This search" },
  { label: "INDUSTRIES", value: "18", sub: "Auto-discovered" },
  { label: "ENRICHED", value: "962", sub: "With contact info" },
  { label: "REACHABLE", value: "3,156,200", sub: "Total market" },
];

const subjects = [
  { title: "Manufacturers", count: 214, tint: "#e8553f" },
  { title: "Wholesale Buyers", count: 168, tint: "#f5a524" },
  { title: "Retail Chains", count: 92, tint: "#28c840" },
];

const inbox = [
  { q: "Foxnut exporters in Bihar with GST", vol: "1.2k", diff: "Low", status: "Enriching" },
  { q: "Protein bar co-manufacturers USA", vol: "820", diff: "Med", status: "Enriching" },
  { q: "Healthy snack distributors UAE", vol: "540", diff: "Med", status: "Enriching" },
  { q: "Nutraceutical brands with makhana", vol: "310", diff: "High", status: "Enriching" },
  { q: "Airport retail buyers snacks", vol: "180", diff: "High", status: "Enriching" },
];

export function DashboardMockup() {
  return (
    <div className="rounded-t-2xl overflow-hidden bg-[#1a1a1c] shadow-[0_-20px_80px_rgba(0,0,0,0.35)] ring-1 ring-white/10 text-left">
      {/* Title bar */}
      <div className="bg-[#242427] border-b border-white/5 px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <div className="flex items-center gap-2 ml-2">
          <PanelLeft className="w-3.5 h-3.5 text-white/40" />
          <ChevronLeft className="w-3.5 h-3.5 text-white/40" />
          <ChevronRight className="w-3.5 h-3.5 text-white/25" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="bg-[#1a1a1c] rounded-md px-6 py-1 text-[10px] text-white/60 flex items-center gap-2">
            <Monitor className="w-3 h-3" />
            leadly.ai
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-white/40" />
          <Share className="w-3.5 h-3.5 text-white/40" />
          <Plus className="w-3.5 h-3.5 text-white/40" />
          <Copy className="w-3.5 h-3.5 text-white/40" />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-[22%] border-r border-white/5 bg-[#1e1e21] px-3 py-3.5">
          <div className="flex items-center justify-between mb-4">
            <Logo className="w-4 h-4 text-white/70" />
            <Grid className="w-3.5 h-3.5 text-white/30" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 rounded bg-[#e8553f] text-[9px] text-white flex items-center justify-center font-semibold">
              F
            </div>
            <span className="text-[10px] text-white/80">Foxnut Co.</span>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { icon: Compass, label: "Discover" },
              { icon: Layers, label: "Industries" },
              { icon: ListTodo, label: "Inbox" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-[10px] text-white/60">
                <Icon className="w-3 h-3" />
                {label}
              </div>
            ))}
          </div>

          <div className="text-[8px] uppercase tracking-wider text-white/30 mb-2">Recent</div>
          <div className="space-y-1.5">
            {recent.map((r) => (
              <div key={r} className="flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-[#28c840]/70 shrink-0" />
                <span className="text-[10px] text-white/60 leading-tight line-clamp-2">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#e8553f] text-white flex items-center justify-center text-sm font-semibold">
                F
              </div>
              <div>
                <div className="text-sm font-medium text-white">Foxnut Co.</div>
                <div className="text-[10px] text-white/45">Lead workspace · 5 agents active</div>
              </div>
            </div>
            <button className="flex items-center gap-1.5 bg-white text-gray-900 text-[11px] font-medium px-3 py-1.5 rounded-md">
              <Sparkles className="w-3 h-3" />
              Generate
            </button>
          </div>

          <div className="grid grid-cols-4 divide-x divide-white/5 rounded-xl bg-white/[0.03] ring-1 ring-white/5 mb-4">
            {stats.map((s) => (
              <div key={s.label} className="p-3">
                <div className="text-[8px] tracking-wider text-white/35">{s.label}</div>
                <div className="text-xl font-medium text-white mt-1">{s.value}</div>
                <div className="text-[9px] text-white/40 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {subjects.map((s) => (
              <div key={s.title} className="rounded-lg bg-white/[0.03] ring-1 ring-white/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: s.tint }} />
                  <span className="text-[10px] text-white/80">{s.title}</span>
                </div>
                <div className="text-lg font-medium text-white">{s.count}</div>
                <div className="text-[9px] text-white/40">companies</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg ring-1 ring-white/5 bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-[1fr_60px_70px_90px] px-3 py-2 text-[8px] uppercase tracking-wider text-white/35 border-b border-white/5">
              <div>Query</div>
              <div>Volume</div>
              <div>Difficulty</div>
              <div>Status</div>
            </div>
            {inbox.map((r) => (
              <div
                key={r.q}
                className="grid grid-cols-[1fr_60px_70px_90px] px-3 py-2 text-[10px] text-white/70 border-b border-white/5 last:border-0"
              >
                <div className="truncate">{r.q}</div>
                <div>{r.vol}</div>
                <div>{r.diff}</div>
                <div className="text-[#febc2e]/80">{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
