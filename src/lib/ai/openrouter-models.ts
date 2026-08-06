export interface OpenRouterModelPreset {
  id: string;
  name: string;
  contextWindow: string;
  price: string;
  rating: string;
  fitStars: number;
}

export const OPENROUTER_FREE_MODELS: OpenRouterModelPreset[] = [
  {
    id: "nvidia/nemotron-3-ultra:free",
    name: "Nemotron 3 Ultra (free)",
    contextWindow: "1M",
    price: "Free",
    rating: "⭐⭐⭐⭐⭐",
    fitStars: 5,
  },
  {
    id: "nvidia/nemotron-3-super:free",
    name: "Nemotron 3 Super (free)",
    contextWindow: "262K",
    price: "Free",
    rating: "⭐⭐⭐⭐⭐",
    fitStars: 5,
  },
  {
    id: "google/gemma-2-27b-it:free",
    name: "Gemma 4 26B A4B (free)",
    contextWindow: "262K",
    price: "Free",
    rating: "⭐⭐⭐⭐",
    fitStars: 4,
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    name: "Nemotron 3 Nano 30B A3B (free)",
    contextWindow: "256K",
    price: "Free",
    rating: "⭐⭐⭐⭐",
    fitStars: 4,
  },
  {
    id: "openai/gpt-oss-20b:free",
    name: "GPT-OSS 20B (free)",
    contextWindow: "128K",
    price: "Free",
    rating: "⭐⭐⭐⭐",
    fitStars: 4,
  },
  {
    id: "openrouter/free",
    name: "openrouter/free",
    contextWindow: "200K",
    price: "Free",
    rating: "⭐⭐⭐",
    fitStars: 3,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    contextWindow: "128K",
    price: "Standard",
    rating: "⭐⭐⭐⭐⭐",
    fitStars: 5,
  },
];
