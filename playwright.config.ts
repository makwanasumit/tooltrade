import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function findLocalChromium(): string | undefined {
  const candidates = [
    path.join(os.homedir(), ".cache/ms-playwright/chromium-1248/chrome-linux64/chrome"),
    path.join(os.homedir(), ".cache/ms-playwright/chromium-1234/chrome-linux64/chrome"),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

const localChrome = findLocalChromium();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
    ...(localChrome ? { launchOptions: { executablePath: localChrome } } : {}),
  },
  webServer: {
    command: "npm run start -- -p 3100 -H 127.0.0.1",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
