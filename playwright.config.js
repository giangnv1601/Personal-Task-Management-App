import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'src/__tests__/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  timeout: 60000, // 60s per test
  expect: {
    timeout: 10000, // 10s for assertions
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
  },
  
  use: { 
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
})