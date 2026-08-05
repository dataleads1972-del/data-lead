import { describe, it, expect } from "vitest";
import { getOSMQuery } from "./directory.functions";

describe("directory.functions - getOSMQuery", () => {
  it("should generate clinic and hospital query tags for clinics/hospitals keyword", () => {
    const query = getOSMQuery("clinics", "San Francisco");
    expect(query).toContain('area["name"="San Francisco"]');
    expect(query).toContain('["amenity"="clinic"]');
    expect(query).toContain('["amenity"="hospital"]');
    expect(query).toContain('["healthcare"="doctor"]');
  });

  it("should normalize lowercase city inputs to Title Case", () => {
    const query = getOSMQuery("hotels", "chennai");
    expect(query).toContain('area["name"="Chennai"]');
    
    const query2 = getOSMQuery("hotels", "new york city");
    expect(query2).toContain('area["name"="New York City"]');
  });

  it("should generate dentist query tags for dental keyword", () => {
    const query = getOSMQuery("dental clinics", "London");
    expect(query).toContain('area["name"="London"]');
    expect(query).toContain('["amenity"="dentist"]');
    expect(query).toContain('["healthcare"="dentist"]');
  });

  it("should generate restaurant and cafe query tags for restaurants keyword", () => {
    const query = getOSMQuery("restaurants", "Paris");
    expect(query).toContain('area["name"="Paris"]');
    expect(query).toContain('["amenity"="restaurant"]');
    expect(query).toContain('["amenity"="cafe"]');
  });

  it("should generate fitness centre query tags for gyms keyword", () => {
    const query = getOSMQuery("gyms", "New York");
    expect(query).toContain('area["name"="New York"]');
    expect(query).toContain('["leisure"="fitness_centre"]');
  });

  it("should generate hotel query tags for hotels keyword", () => {
    const query = getOSMQuery("hotels", "Tokyo");
    expect(query).toContain('area["name"="Tokyo"]');
    expect(query).toContain('["tourism"="hotel"]');
  });

  it("should generate school and college query tags for schools keyword", () => {
    const query = getOSMQuery("schools", "Berlin");
    expect(query).toContain('area["name"="Berlin"]');
    expect(query).toContain('["amenity"="school"]');
    expect(query).toContain('["amenity"="college"]');
  });

  it("should handle custom shop queries when prefix is shop", () => {
    const query = getOSMQuery("shop bakery", "Rome");
    expect(query).toContain('area["name"="Rome"]');
    expect(query).toContain('["shop"="bakery"]');
  });

  it("should handle general shop/store queries by extracting the shop type", () => {
    const query = getOSMQuery("book store", "Boston");
    expect(query).toContain('area["name"="Boston"]');
    expect(query).toContain('["shop"="book"]');
  });

  it("should fallback to name/amenity/shop/tourism case-insensitive matching for other keywords", () => {
    const query = getOSMQuery("software developers", "Seattle");
    expect(query).toContain('area["name"="Seattle"]');
    expect(query).toContain('["name"~"software developers",i]');
    expect(query).toContain('["amenity"~"software developers",i]');
    expect(query).toContain('["shop"~"software developers",i]');
    expect(query).toContain('["tourism"~"software developers",i]');
  });
});
