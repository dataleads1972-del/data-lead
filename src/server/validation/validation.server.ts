export function normalizeDomain(urlOrDomain: string | null | undefined): string {
  if (!urlOrDomain) return "";
  let clean = urlOrDomain.trim().toLowerCase();
  
  // Remove protocol
  clean = clean.replace(/^(https?:\/\/)?(www\.)?/i, "");
  
  // Split on paths or queries
  clean = clean.split("/")[0] || "";
  clean = clean.split("?")[0] || "";
  
  return clean;
}

export interface ScoreableLead {
  company_name?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  description?: string | null;
  social_profiles?: Record<string, any> | null;
}

export function calculateConfidence(lead: ScoreableLead): number {
  let score = 0;

  // Business Name: +10
  if (lead.company_name && lead.company_name.trim().length > 0) {
    score += 10;
  }

  // Valid Website: +20
  if (lead.website && lead.website.trim().length > 4) {
    score += 20;
  }

  // Public Email: +25
  if (lead.email && lead.email.includes("@")) {
    score += 25;
  }

  // Valid Phone: +20
  if (lead.phone && lead.phone.trim().length >= 8) {
    score += 20;
  }

  // Address: +10
  if (lead.address && lead.address.trim().length > 0) {
    score += 10;
  }

  // Description: +4
  if (lead.description && lead.description.trim().length > 0) {
    score += 4;
  }

  // Social Links: LinkedIn (+5), Facebook (+3), Instagram (+3)
  if (lead.social_profiles) {
    const socials = lead.social_profiles;
    if (socials.linkedin) score += 5;
    if (socials.facebook) score += 3;
    if (socials.instagram) score += 3;
  }

  return Math.min(100, score);
}

export function getQualityLevel(score: number): "Excellent" | "High Quality" | "Medium Quality" | "Low Data" {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "High Quality";
  if (score >= 50) return "Medium Quality";
  return "Low Data";
}

/**
 * Filter duplicates deterministically. 
 * Merges source arrays or text fields if duplicate matched.
 */
export function deduplicateLeads<T extends { 
  id?: string;
  company_name: string; 
  website?: string | null; 
  email?: string | null; 
  phone?: string | null; 
  address?: string | null;
  source?: string | null;
}>(leads: T[]): T[] {
  const seenDomains = new Set<string>();
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();
  
  const uniqueLeads: T[] = [];

  for (const lead of leads) {
    const domain = normalizeDomain(lead.website);
    const email = lead.email?.trim().toLowerCase();
    const phone = lead.phone?.trim().replace(/\D/g, "");
    const nameKey = `${lead.company_name.toLowerCase().trim()}:${(lead.address || "").toLowerCase().trim().slice(0, 20)}`;

    let isDupe = false;

    if (domain && seenDomains.has(domain)) isDupe = true;
    if (email && seenEmails.has(email)) isDupe = true;
    if (phone && seenPhones.has(phone)) isDupe = true;
    if (lead.company_name && seenNames.has(nameKey)) isDupe = true;

    if (!isDupe) {
      if (domain) seenDomains.add(domain);
      if (email) seenEmails.add(email);
      if (phone) seenPhones.add(phone);
      if (lead.company_name) seenNames.add(nameKey);
      
      uniqueLeads.push(lead);
    } else {
      // Find the existing lead and merge sources/metadata if relevant
      const existing = uniqueLeads.find(l => {
        const d = normalizeDomain(l.website);
        const em = l.email?.trim().toLowerCase();
        const ph = l.phone?.trim().replace(/\D/g, "");
        const nk = `${l.company_name.toLowerCase().trim()}:${(l.address || "").toLowerCase().trim().slice(0, 20)}`;
        return (domain && d === domain) || (email && em === email) || (phone && ph === phone) || (lead.company_name && nk === nameKey);
      });
      
      if (existing && lead.source && existing.source) {
        const mergedSources = Array.from(new Set([
          ...existing.source.split(","),
          ...lead.source.split(",")
        ])).join(",");
        existing.source = mergedSources;
      }
    }
  }

  return uniqueLeads;
}
