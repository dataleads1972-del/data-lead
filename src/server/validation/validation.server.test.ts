import { describe, it, expect } from "vitest";
import {
  normalizeDomain,
  calculateConfidence,
  getQualityLevel,
  deduplicateLeads,
} from "./validation.server";

describe("validation.server - normalizeDomain", () => {
  it("should return empty string for null, undefined, or empty values", () => {
    expect(normalizeDomain(null)).toBe("");
    expect(normalizeDomain(undefined)).toBe("");
    expect(normalizeDomain("   ")).toBe("");
  });

  it("should lowercase and trim input", () => {
    expect(normalizeDomain("  EXAMPLE.com  ")).toBe("example.com");
  });

  it("should strip protocols and www subdomain", () => {
    expect(normalizeDomain("http://example.com")).toBe("example.com");
    expect(normalizeDomain("https://example.com")).toBe("example.com");
    expect(normalizeDomain("https://www.example.com")).toBe("example.com");
    expect(normalizeDomain("www.example.com")).toBe("example.com");
  });

  it("should strip paths, trailing slashes, and query parameters", () => {
    expect(normalizeDomain("https://www.example.com/about-us")).toBe("example.com");
    expect(normalizeDomain("example.com/about/team?ref=homepage")).toBe("example.com");
  });
});

describe("validation.server - calculateConfidence", () => {
  it("should return 0 for a lead with no fields", () => {
    expect(calculateConfidence({})).toBe(0);
  });

  it("should correctly score individual fields", () => {
    expect(calculateConfidence({ company_name: "Acme Inc" })).toBe(10);
    expect(calculateConfidence({ website: "https://acme.com" })).toBe(20);
    expect(calculateConfidence({ email: "info@acme.com" })).toBe(25);
    expect(calculateConfidence({ phone: "12345678" })).toBe(20);
    expect(calculateConfidence({ address: "123 Main St" })).toBe(10);
    expect(calculateConfidence({ description: "B2B solutions" })).toBe(4);
    expect(calculateConfidence({ social_profiles: { linkedin: "http://ln" } })).toBe(5);
  });

  it("should add multiple social scores correctly", () => {
    expect(
      calculateConfidence({
        social_profiles: { linkedin: "ln", facebook: "fb", instagram: "ig" },
      })
    ).toBe(11);
  });

  it("should cap the maximum score at 100", () => {
    const perfectLead = {
      company_name: "Acme Corporation",
      website: "https://acme.com",
      email: "hello@acme.com",
      phone: "+15551234567",
      address: "123 Industrial Way, CA",
      description: "A leading manufacturer of widgets and tools.",
      social_profiles: {
        linkedin: "https://linkedin.com/company/acme",
        facebook: "https://facebook.com/acme",
        instagram: "https://instagram.com/acme",
      },
    };
    // Sum is: 10 + 20 + 25 + 20 + 10 + 4 + 5 + 3 + 3 = 100
    expect(calculateConfidence(perfectLead)).toBe(100);

    // Extra score elements shouldn't push it past 100
    const overPerfectLead = {
      ...perfectLead,
      extra_field: "more value",
    };
    expect(calculateConfidence(overPerfectLead)).toBe(100);
  });
});

describe("validation.server - getQualityLevel", () => {
  it("should map scores to correct quality levels", () => {
    expect(getQualityLevel(95)).toBe("Excellent");
    expect(getQualityLevel(90)).toBe("Excellent");
    expect(getQualityLevel(80)).toBe("High Quality");
    expect(getQualityLevel(75)).toBe("High Quality");
    expect(getQualityLevel(60)).toBe("Medium Quality");
    expect(getQualityLevel(50)).toBe("Medium Quality");
    expect(getQualityLevel(45)).toBe("Low Data");
    expect(getQualityLevel(10)).toBe("Low Data");
  });
});

describe("validation.server - deduplicateLeads", () => {
  it("should return empty array when input is empty", () => {
    expect(deduplicateLeads([])).toEqual([]);
  });

  it("should keep unique leads intact", () => {
    const leads = [
      { company_name: "Acme", website: "acme.com", email: "info@acme.com", phone: "11111111", address: "St 1", source: "reddit" },
      { company_name: "Beta", website: "beta.com", email: "info@beta.com", phone: "22222222", address: "St 2", source: "google" },
    ];
    expect(deduplicateLeads(leads)).toHaveLength(2);
  });

  it("should deduplicate by domain", () => {
    const leads = [
      { company_name: "Acme", website: "https://acme.com/page1", source: "reddit" },
      { company_name: "Acme Inc", website: "http://www.acme.com/page2", source: "google" },
    ];
    const result = deduplicateLeads(leads);
    expect(result).toHaveLength(1);
    expect(result[0].company_name).toBe("Acme");
    expect(result[0].source).toContain("reddit");
    expect(result[0].source).toContain("google");
  });

  it("should deduplicate by email", () => {
    const leads = [
      { company_name: "Acme", email: "sales@acme.com", source: "reddit" },
      { company_name: "Acme Software", email: "  sales@acme.com  ", source: "web" },
    ];
    const result = deduplicateLeads(leads);
    expect(result).toHaveLength(1);
    expect(result[0].email?.trim()).toBe("sales@acme.com");
  });

  it("should deduplicate by phone", () => {
    const leads = [
      { company_name: "Acme", phone: "+1 (555) 123-4567", source: "reddit" },
      { company_name: "Acme Group", phone: "15551234567", source: "web" },
    ];
    const result = deduplicateLeads(leads);
    expect(result).toHaveLength(1);
  });

  it("should deduplicate by name and partial address match", () => {
    const leads = [
      { company_name: "Acme Corp", address: "123 Industrial Parkway, Suite A", source: "reddit" },
      { company_name: "  acme corp  ", address: "123 Industrial Parkway, Suite B", source: "google" },
    ];
    const result = deduplicateLeads(leads);
    expect(result).toHaveLength(1);
    expect(result[0].source).toContain("reddit");
    expect(result[0].source).toContain("google");
  });
});
