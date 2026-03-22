import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "capture-screenshots.js",
  use: {
    browserName: "chromium",
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: "npx serve .. -l 3000",
    port: 3000,
    reuseExistingServer: true,
  },
});
