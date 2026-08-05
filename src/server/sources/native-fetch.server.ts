import * as cheerio from "cheerio";
import parsePhoneNumberFromString from "libphonenumber-js";

export interface ExtractedData {
  companyName: string | null;
  emails: string[];
  phones: string[];
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  socials: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BAD_EMAIL_DOMAINS = ["sentry", "wixpress", "godaddy", "example.com", "test.com", "domain.com", "jpg", "png", "webp", "gif", "jpeg", "@2x"];

export function cleanEmail(email: string): string | null {
  const cleaned = email.trim().toLowerCase();
  if (BAD_EMAIL_DOMAINS.some(d => cleaned.includes(d))) return null;
  return cleaned;
}

const PHONE_RE = /(\+?\d[\d\s().-]{7,17}\d)/g;

export function cleanPhone(phone: string, defaultCountry?: string): string | null {
  const stripped = phone.replace(/[^\d+]/g, "");
  if (stripped.length < 8 || stripped.length > 15) return null;
  
  try {
    const parsed = parsePhoneNumberFromString(phone, (defaultCountry as any) || undefined);
    if (parsed && parsed.isValid()) {
      return parsed.formatInternational();
    }
  } catch {}
  
  return phone.trim();
}

function parseJSONLD(html: string): Partial<ExtractedData> {
  const result: Partial<ExtractedData> = {};
  try {
    const $ = cheerio.load(html);
    const jsonLdElements = $('script[type="application/ld+json"]');
    jsonLdElements.each((_, el) => {
      try {
        const text = $(el).text().trim();
        if (!text) return;
        const data = JSON.parse(text);
        const schemas = Array.isArray(data) ? data : [data];
        
        for (const schema of schemas) {
          const type = schema["@type"];
          if (
            type === "Organization" ||
            type === "LocalBusiness" ||
            type === "Corporation" ||
            type === "Restaurant" ||
            type === "Store" ||
            type === "MedicalOrganization" ||
            type === "ProfessionalService"
          ) {
            if (schema.name && !result.companyName) {
              result.companyName = schema.name;
            }
            if (schema.telephone) {
              const cleaned = cleanPhone(schema.telephone);
              if (cleaned) result.phones = [cleaned];
            }
            if (schema.email) {
              const cleaned = cleanEmail(schema.email);
              if (cleaned) result.emails = [cleaned];
            }
            if (schema.description && !result.description) {
              result.description = schema.description;
            }
            
            if (schema.address) {
              const addr = schema.address;
              if (typeof addr === "string") {
                result.address = addr;
              } else if (typeof addr === "object") {
                const street = addr.streetAddress || "";
                const locality = addr.addressLocality || "";
                const region = addr.addressRegion || "";
                const postal = addr.postalCode || "";
                const country = addr.addressCountry || "";
                
                result.city = locality || null;
                result.state = region || null;
                result.country = typeof country === "object" ? country.name || null : country || null;
                
                const parts = [street, locality, region, postal, result.country].filter(Boolean);
                result.address = parts.join(", ") || null;
              }
            }
          }
        }
      } catch {}
    });
  } catch {}
  return result;
}

function extractSocialsAndWhatsApp(html: string): { socials: ExtractedData["socials"], whatsapp: string | null } {
  const socials: ExtractedData["socials"] = {};
  let whatsapp: string | null = null;
  
  try {
    const $ = cheerio.load(html);
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href) return;
      
      if (href.includes("wa.me/") || href.includes("api.whatsapp.com/send")) {
        const match = href.match(/phone=(\d+)|wa\.me\/(\d+)/i);
        const waNum = match ? (match[1] || match[2]) : null;
        if (waNum) {
          whatsapp = `+${waNum}`;
        }
      }
      
      if (href.includes("linkedin.com/company/") || href.includes("linkedin.com/in/")) {
        socials.linkedin = href;
      } else if (href.includes("facebook.com/")) {
        socials.facebook = href;
      } else if (href.includes("instagram.com/")) {
        socials.instagram = href;
      } else if (href.includes("twitter.com/") || href.includes("x.com/")) {
        socials.twitter = href;
      } else if (href.includes("youtube.com/")) {
        socials.youtube = href;
      }
    });
  } catch {}
  
  return { socials, whatsapp };
}

function extractTextContacts(html: string, defaultCountry?: string): { emails: string[], phones: string[] } {
  const emails: string[] = [];
  const phones: string[] = [];
  
  try {
    const $ = cheerio.load(html);
    
    // Create a copy to remove unwanted blocks
    const $copy = cheerio.load(html);
    $copy('script, style, iframe, noscript').remove();
    const text = $copy('body').text() || '';
    
    const rawEmails = text.match(EMAIL_RE) || [];
    for (const e of rawEmails) {
      const cleaned = cleanEmail(e);
      if (cleaned && !emails.includes(cleaned)) {
        emails.push(cleaned);
      }
    }
    
    const rawPhones = text.match(PHONE_RE) || [];
    for (const p of rawPhones) {
      const cleaned = cleanPhone(p, defaultCountry);
      if (cleaned && !phones.includes(cleaned)) {
        phones.push(cleaned);
      }
    }
    
    // Parse mailto and tel links
    $('a[href^="mailto:"]').each((_, el) => {
      const mailto = $(el).attr('href')?.replace(/^mailto:/i, '').split('?')[0].trim();
      if (mailto) {
        const cleaned = cleanEmail(mailto);
        if (cleaned && !emails.includes(cleaned)) {
          emails.push(cleaned);
        }
      }
    });
    
    $('a[href^="tel:"]').each((_, el) => {
      const tel = $(el).attr('href')?.replace(/^tel:/i, '').trim();
      if (tel) {
        const cleaned = cleanPhone(tel, defaultCountry);
        if (cleaned && !phones.includes(cleaned)) {
          phones.push(cleaned);
        }
      }
    });
    
  } catch {}
  
  return { emails, phones };
}

function extractCompanyNameAndDesc(html: string): { companyName: string | null, description: string | null } {
  let companyName: string | null = null;
  let description: string | null = null;
  
  try {
    const $ = cheerio.load(html);
    
    companyName = $('meta[property="og:site_name"]').attr('content')?.trim() || null;
    
    if (!companyName) {
      companyName = $('meta[property="og:title"]').attr('content')?.split(/[|\-–—·:]/)[0]?.trim() || null;
    }
    
    if (!companyName) {
      companyName = $('title').text()?.split(/[|\-–—·:]/)[0]?.trim() || null;
    }
    
    if (!companyName) {
      companyName = $('h1').first().text()?.trim() || null;
    }
    
    description = $('meta[name="description"]').attr('content')?.trim() || null;
    if (!description) {
      description = $('meta[property="og:description"]').attr('content')?.trim() || null;
    }
  } catch {}
  
  return { companyName, description };
}

export function extractDetailsFromHtml(html: string, domain: string, defaultCountry?: string): ExtractedData {
  const ld = parseJSONLD(html);
  const socialsAndWa = extractSocialsAndWhatsApp(html);
  const textContacts = extractTextContacts(html, defaultCountry);
  const basic = extractCompanyNameAndDesc(html);
  
  return {
    companyName: ld.companyName || basic.companyName || domain,
    emails: Array.from(new Set([...(ld.emails || []), ...textContacts.emails])),
    phones: Array.from(new Set([...(ld.phones || []), ...textContacts.phones])),
    whatsapp: socialsAndWa.whatsapp || ld.whatsapp || null,
    address: ld.address || null,
    city: ld.city || null,
    state: ld.state || null,
    country: ld.country || null,
    description: ld.description || basic.description || null,
    socials: {
      ...ld.socials,
      ...socialsAndWa.socials
    }
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      }
    });
    clearTimeout(id);
    
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Invalid content type ${contentType}`);
    }
    
    const text = await res.text();
    return text.slice(0, 500 * 1024);
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function findContactLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  try {
    const $ = cheerio.load(html);
    const base = new URL(baseUrl);
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      if (!href) return;
      
      try {
        const resolved = new URL(href, baseUrl);
        if (resolved.hostname.replace(/^www\./i, "") !== base.hostname.replace(/^www\./i, "")) {
          return;
        }
        
        const path = resolved.pathname.toLowerCase();
        const text = $(el).text().toLowerCase();
        
        const matchesKeywords = 
          path.includes("contact") ||
          path.includes("about") ||
          path.includes("team") ||
          path.includes("company") ||
          text.includes("contact") ||
          text.includes("about") ||
          text.includes("team") ||
          text.includes("who we are");
          
        if (matchesKeywords) {
          links.add(resolved.toString());
        }
      } catch {}
    });
  } catch {}
  return Array.from(links).slice(0, 4);
}

export async function crawlAndEnrichDomain(domain: string, defaultCountry?: string): Promise<ExtractedData> {
  const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, "").split("/")[0].toLowerCase();
  const startUrl = `https://${normalizedDomain}`;
  
  let mainHtml = "";
  try {
    mainHtml = await fetchWithTimeout(startUrl, 8000);
  } catch {
    try {
      mainHtml = await fetchWithTimeout(`http://${normalizedDomain}`, 8000);
    } catch (e) {
      return {
        companyName: normalizedDomain,
        emails: [],
        phones: [],
        whatsapp: null,
        address: null,
        city: null,
        state: null,
        country: null,
        description: null,
        socials: {}
      };
    }
  }
  
  const rootData = extractDetailsFromHtml(mainHtml, normalizedDomain, defaultCountry);
  const contactLinks = findContactLinks(mainHtml, startUrl);
  const pagesHtml: string[] = [];
  
  await Promise.all(
    contactLinks.map(async (url) => {
      try {
        const html = await fetchWithTimeout(url, 6000);
        pagesHtml.push(html);
      } catch {}
    })
  );
  
  for (const subHtml of pagesHtml) {
    const subData = extractDetailsFromHtml(subHtml, normalizedDomain, defaultCountry);
    rootData.emails = Array.from(new Set([...rootData.emails, ...subData.emails]));
    rootData.phones = Array.from(new Set([...rootData.phones, ...subData.phones]));
    if (!rootData.whatsapp && subData.whatsapp) rootData.whatsapp = subData.whatsapp;
    if (!rootData.address && subData.address) {
      rootData.address = subData.address;
      rootData.city = subData.city;
      rootData.state = subData.state;
      rootData.country = subData.country;
    }
    if (!rootData.description && subData.description) rootData.description = subData.description;
    rootData.socials = {
      ...subData.socials,
      ...rootData.socials
    };
  }
  
  return rootData;
}
