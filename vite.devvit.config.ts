import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { devvit } from "@devvit/start/vite";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    devvit(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    sourcemap: false,
  },
});
