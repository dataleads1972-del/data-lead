import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Youtube,
  Share2,
  Twitter,
  Globe,
  Rss,
  Terminal,
  Ship,
  Building2,
  Flame,
  HelpCircle,
} from "lucide-react";
import { SourcePlatformType } from "@/lib/ai/source-normalizer";

interface AISourceBadgeProps {
  source: string;
  sourceUrl?: string | null;
  className?: string;
}

export function AISourceBadge({ source, sourceUrl, className }: AISourceBadgeProps) {
  const s = (source || "other").toLowerCase();

  let label = "Source";
  let icon = Globe;
  let styleClass = "bg-secondary text-secondary-foreground border-border";

  if (s.includes("reddit")) {
    label = "Reddit";
    icon = MessageSquare;
    styleClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
  } else if (s.includes("youtube")) {
    label = "YouTube";
    icon = Youtube;
    styleClass = "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (s.includes("thread")) {
    label = "Threads";
    icon = Share2;
    styleClass = "bg-pink-500/10 text-pink-400 border-pink-500/20";
  } else if (s.includes("x") || s.includes("twitter")) {
    label = "X / Twitter";
    icon = Twitter;
    styleClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  } else if (s.includes("discourse") || s.includes("forum")) {
    label = "Discourse";
    icon = MessageSquare;
    styleClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  } else if (s.includes("rss")) {
    label = "RSS Feed";
    icon = Rss;
    styleClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  } else if (s.includes("hacker") || s.includes("hn")) {
    label = "Hacker News";
    icon = Terminal;
    styleClass = "bg-orange-600/10 text-orange-500 border-orange-600/20";
  } else if (s.includes("trade") || s.includes("import") || s.includes("export")) {
    label = "Trade Database";
    icon = Ship;
    styleClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  } else if (s.includes("directory") || s.includes("google") || s.includes("places")) {
    label = "Business Directory";
    icon = Building2;
    styleClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  } else if (s.includes("firecrawl") || s.includes("web")) {
    label = "Firecrawl Web";
    icon = Flame;
    styleClass = "bg-red-600/10 text-red-400 border-red-600/20";
  }

  const IconComp = icon;

  const content = (
    <span className="flex items-center gap-1.5 font-medium">
      <IconComp className="h-3 w-3" />
      <span>{label}</span>
    </span>
  );

  if (sourceUrl) {
    return (
      <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-block hover:opacity-80 transition-opacity">
        <Badge variant="outline" className={`${styleClass} text-xs px-2.5 py-0.5 rounded-full ${className || ""}`}>
          {content}
        </Badge>
      </a>
    );
  }

  return (
    <Badge variant="outline" className={`${styleClass} text-xs px-2.5 py-0.5 rounded-full ${className || ""}`}>
      {content}
    </Badge>
  );
}
