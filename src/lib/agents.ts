import { Brain, Search, Compass, Sparkles, ShieldCheck, FileDown } from "lucide-react";

export const AGENTS = [
  { id: "research", name: "Research Agent", icon: Brain, color: "#a78bfa", desc: "Understands the request and forms a strategy" },
  { id: "search", name: "Search Agent", icon: Search, color: "#60a5fa", desc: "Discovers companies from public sources" },
  { id: "discovery", name: "Discovery Agent", icon: Compass, color: "#34d399", desc: "Finds related industries and adjacent markets" },
  { id: "enrichment", name: "Enrichment Agent", icon: Sparkles, color: "#fbbf24", desc: "Adds emails, phones, addresses, socials" },
  { id: "validation", name: "Validation Agent", icon: ShieldCheck, color: "#f472b6", desc: "Deduplicates and scores confidence" },
  { id: "export", name: "Export Agent", icon: FileDown, color: "#22d3ee", desc: "Prepares CSV / XLSX outputs" },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
