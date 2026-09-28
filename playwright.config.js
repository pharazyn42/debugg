// Browser tests for Debuggit: the daily puzzles, the sandbox and Debuggit Ltd.
// Run with `npm test`. The site is served by tests/serve.js, like GitHub Pages would.
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: 'tests',
  timeout: 60000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
    browserName: 'chromium'
  },
  webServer: {
    command: 'node tests/serve.js',
    url: 'http://localhost:4173/index.html',
    reuseExistingServer: !process.env.CI
  }
});
