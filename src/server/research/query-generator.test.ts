import { describe, it, expect } from "vitest";
import { getModifiers, DEFAULT_MODIFIERS } from "./industry-templates";
import { generateQueries } from "./query-generator";

describe("industry-templates - getModifiers", () => {
  it("should return DEFAULT_MODIFIERS if no industry is provided", () => {
    expect(getModifiers(null)).toEqual(DEFAULT_MODIFIERS);
    expect(getModifiers(undefined)).toEqual(DEFAULT_MODIFIERS);
    expect(getModifiers("")).toEqual(DEFAULT_MODIFIERS);
  });

  it("should return specific modifiers for a recognized industry key", () => {
    const foodModifiers = getModifiers("food");
    expect(foodModifiers).toContain("food processor");
    expect(foodModifiers).toContain("manufacturer");

    const softwareModifiers = getModifiers("software");
    expect(softwareModifiers).toContain("SaaS company");
    expect(softwareModifiers).toContain("software development company");
  });

  it("should match industry keys case-insensitively and handle spaces/characters", () => {
    const softwareModifiers = getModifiers("  Software  ");
    expect(softwareModifiers).toContain("SaaS company");
  });

  it("should fallback to DEFAULT_MODIFIERS if industry is unrecognized", () => {
    expect(getModifiers("unknown-random-industry")).toEqual(DEFAULT_MODIFIERS);
  });
});

describe("query-generator - generateQueries", () => {
  it("should return only base query for narrow strategy", () => {
    const params = {
      keyword: "Foxnuts",
      strategy: "narrow" as const,
    };
    const queries = generateQueries(params);
    expect(queries).toEqual(["Foxnuts"]);
  });

  it("should append location details to narrow strategy query", () => {
    const params = {
      keyword: "Foxnuts",
      city: "Patna",
      state: "Bihar",
      country: "India",
      strategy: "narrow" as const,
    };
    const queries = generateQueries(params);
    expect(queries).toEqual(["Foxnuts Patna Bihar India"]);
  });

  it("should generate balanced queries using limited modifiers", () => {
    const params = {
      keyword: "Foxnuts",
      industry: "food",
      city: "Patna",
      country: "India",
      strategy: "balanced" as const,
    };
    const queries = generateQueries(params);
    
    // Balanced strategy limits modifiers to 3 (slice(0, 3) from food template: manufacturer, supplier, distributor)
    expect(queries).toContain("Foxnuts Patna India"); // base query
    expect(queries).toContain("Foxnuts manufacturer Patna India");
    expect(queries).toContain("Foxnuts supplier Patna India");
    expect(queries).toContain("Foxnuts distributor Patna India");
    
    // Should NOT contain modifiers beyond limit of 3 (e.g. exporter, importer)
    expect(queries).not.toContain("Foxnuts exporter Patna India");
  });

  it("should generate broad queries with up to 5 modifiers and discovery phrases", () => {
    const params = {
      keyword: "SaaS",
      industry: "software",
      city: "San Francisco",
      country: "USA",
      strategy: "broad" as const,
    };
    const queries = generateQueries(params);
    
    // Broad strategy limits modifiers to 5
    expect(queries).toContain("SaaS San Francisco USA"); // base query
    expect(queries).toContain("SaaS software company San Francisco USA");
    
    // Extra discovery phrases for broad strategy when location is present
    expect(queries).toContain("top SaaS in San Francisco USA");
    expect(queries).toContain("best SaaS providers San Francisco USA");
  });

  it("should avoid duplicates in generated query list", () => {
    const params = {
      keyword: "Software",
      industry: "software", // industry name matches keyword, check deduplication
      strategy: "balanced" as const,
    };
    const queries = generateQueries(params);
    
    const uniqueQueries = Array.from(new Set(queries));
    expect(queries.length).toBe(uniqueQueries.length);
  });
});
