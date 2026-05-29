/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `base: "./"` makes built assets reference URLs relative to index.html so the
// bundle works when served from a subpath such as
// https://agntdev.github.io/satellitesnap/.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: { port: 5173 },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
