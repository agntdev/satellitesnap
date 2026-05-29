import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Builds and serves the real frontend with `vite preview`, then
 * drives it in a headless browser. Run with:
 *
 *   cd frontend && npm ci && npm run build
 *   cd e2e && npm ci && npm run install-browsers && npm test
 */
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4173/",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm --prefix ../frontend run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
