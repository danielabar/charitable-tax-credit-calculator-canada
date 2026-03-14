import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const e2eTestDir = defineBddConfig({
  features: "tests/e2e/features/*.feature",
  steps: ["tests/e2e/steps/*.js", "tests/e2e/coverage-fixture.js"],
  disableWarnings: { importTestFrom: true },
  importTestFrom: "tests/e2e/coverage-fixture.js",
});

export default defineConfig({
  reporter: [
    ["list"],
    ["monocart-reporter", {
      name: "Coverage Report",
      outputFile: "./coverage/report.html",
      coverage: {
        reports: ["v8", "console-summary"],
        entryFilter: (entry) => {
          return entry.url.includes("/js/") || entry.url.includes("/css/");
        },
        sourceFilter: (sourcePath) => {
          return sourcePath.search(/\/js\//) !== -1;
        },
      },
    }],
  ],
  projects: [
    {
      name: "unit",
      testDir: "tests/unit",
    },
    {
      name: "chromium",
      testDir: e2eTestDir,
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:3000",
        screenshot: "only-on-failure",
        trace: "retain-on-failure",
      },
    },
  ],
  webServer: {
    command: "npx serve . -l 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
