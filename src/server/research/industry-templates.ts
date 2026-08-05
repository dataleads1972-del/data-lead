export interface IndustryTemplate {
  modifiers: string[];
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  food: {
    modifiers: [
      "manufacturer",
      "supplier",
      "distributor",
      "wholesaler",
      "exporter",
      "importer",
      "food processor",
      "retailer",
    ],
  },
  software: {
    modifiers: [
      "software company",
      "SaaS company",
      "software provider",
      "software development company",
      "technology company",
      "IT services company",
    ],
  },
  healthcare: {
    modifiers: [
      "clinic",
      "hospital",
      "healthcare provider",
      "medical supplier",
      "medical distributor",
    ],
  },
  construction: {
    modifiers: [
      "contractor",
      "construction company",
      "building supplier",
      "builder",
      "wholesaler",
    ],
  },
  retail: {
    modifiers: [
      "retailer",
      "store",
      "shop",
      "wholesaler",
      "brand",
    ],
  },
  real_estate: {
    modifiers: [
      "agency",
      "brokerage",
      "realtor",
      "property manager",
      "developer",
    ],
  },
};

export const DEFAULT_MODIFIERS = [
  "manufacturers",
  "suppliers",
  "exporters",
  "importers",
  "distributors",
  "wholesalers",
  "dealers",
  "companies",
  "vendors",
  "providers",
];

export function getModifiers(industry?: string | null): string[] {
  if (!industry) return DEFAULT_MODIFIERS;
  
  const key = industry.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");
  
  // Try to find matching template
  for (const [k, template] of Object.entries(INDUSTRY_TEMPLATES)) {
    if (key.includes(k) || k.includes(key)) {
      return template.modifiers;
    }
  }
  
  return DEFAULT_MODIFIERS;
}
