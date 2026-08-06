import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const apiKey = process.env.XAI_API_KEY;
  const res = await fetch("https://api.x.ai/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Models:", JSON.stringify(data, null, 2));
}

listModels();
