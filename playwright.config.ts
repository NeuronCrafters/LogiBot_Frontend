import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  outputDir: "test-results/artifacts",
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:5173", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], locale: "pt-BR" } },
    { name: "mobile", use: { ...devices["Pixel 7"], locale: "es-ES" } },
    { name: "firefox-accessibility", testMatch: /accessibility-overlays\.spec\.ts/, use: { ...devices["Desktop Firefox"], locale: "pt-BR" } },
    { name: "webkit-accessibility", testMatch: /accessibility-overlays\.spec\.ts/, use: { ...devices["Desktop Safari"], locale: "pt-BR" } },
  ],
});
