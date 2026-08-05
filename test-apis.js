import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env variables
const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value.trim();
  }
}

const API_KEY = env.YOUTUBE_API_KEY || env.GOOGLE_PLACES_API_KEY || "AIzaSyCDyDfCoazi8aLEtCwh7QF1bT0Yr91pbBo";

console.log("Using API Key:", API_KEY);

async function testYouTube() {
  console.log("\n--- Testing YouTube Data API v3 ---");
  const query = "Dentist Patna review";
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    query
  )}&maxResults=3&type=video&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok) {
      console.error("YouTube API Error response:", data);
      return;
    }
    
    const items = data.items || [];
    console.log(`Successfully fetched ${items.length} videos for "${query}":`);
    items.forEach((item, index) => {
      console.log(`\nVideo #${index + 1}:`);
      console.log(`- Title: ${item.snippet?.title}`);
      console.log(`- Video ID: ${item.id?.videoId}`);
      console.log(`- Channel: ${item.snippet?.channelTitle}`);
      console.log(`- Link: https://youtube.com/watch?v=${item.id?.videoId}`);
    });
  } catch (error) {
    console.error("Error calling YouTube API:", error);
  }
}

async function testGooglePlacesLegacy() {
  console.log("\n--- Testing Legacy Google Places API (Text Search) ---");
  const query = "Dental clinics in Patna";
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    query
  )}&key=${API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!res.ok || data.status !== "OK") {
      console.error("Google Places Legacy API error/denied:", data.error_message || data.status);
      return;
    }
    
    const results = data.results || [];
    console.log(`Successfully fetched ${results.length} places (legacy API):`);
    results.slice(0, 3).forEach((place, index) => {
      console.log(`- ${place.name} (${place.formatted_address})`);
    });
  } catch (error) {
    console.error("Error calling legacy Places API:", error);
  }
}

async function testGooglePlacesNew() {
  console.log("\n--- Testing Google Places API (New) ---");
  const query = "Dental clinics in Patna";
  const url = "https://places.googleapis.com/v1/places:searchText";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount",
      },
      body: JSON.stringify({
        textQuery: query,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Places API (New) Error response:", data);
      return;
    }

    const places = data.places || [];
    console.log(`Successfully fetched ${places.length} places (New API) for "${query}":`);
    places.slice(0, 5).forEach((place, index) => {
      console.log(`\nPlace #${index + 1}:`);
      console.log(`- Name: ${place.displayName?.text}`);
      console.log(`- Address: ${place.formattedAddress}`);
      console.log(`- Rating: ${place.rating} (${place.userRatingCount} reviews)`);
      console.log(`- Place ID: ${place.id}`);
    });
  } catch (error) {
    console.error("Error calling Places API (New):", error);
  }
}

async function runTests() {
  await testYouTube();
  await testGooglePlacesLegacy();
  await testGooglePlacesNew();
}

runTests();
