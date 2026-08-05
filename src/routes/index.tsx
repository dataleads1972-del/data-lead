import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/landing/Stats";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTAFooter } from "@/components/landing/CTAFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Leadly — AI multi-agent lead generation" },
      {
        name: "description",
        content:
          "Leadly deploys multi-agent AI to research industries, discover companies, and enrich verified B2B leads you can export to Excel or CSV.",
      },
      { property: "og:title", content: "Leadly — AI multi-agent lead generation" },
      {
        property: "og:description",
        content:
          "Multi-agent AI that researches, discovers, and enriches verified B2B leads across public sources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main>
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <CTAFooter />
    </main>
  );
}
