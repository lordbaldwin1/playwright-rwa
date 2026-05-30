import "dotenv/config";
import { defineConfig, devices } from '@playwright/test';
import { config } from "./playwright/config";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './playwright/tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // tests in a file run serially; shared DB requires workers: 1
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1, // serial workers + per-test reseed (see _reseedDatabase fixture) for DB isolation
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  // reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: config.FRONTEND_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: "only-on-failure",
    video: 'retain-on-failure',

    testIdAttribute: "data-test",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'db_setup',
      testMatch: /tests\/global\.setup.ts/,
    },
    {
      name: 'e2e_tests_chrome',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /tests\/ui\/.*\.spec.ts/,
      dependencies: ['db_setup'],
    },
    {
      name: 'api_auth_setup',
      testMatch: /tests\/api\/auth\.setup.ts/,
      dependencies: ['db_setup'],
    },
    {
      name: "api_tests",
      testMatch: /tests\/api\/.*\.spec.ts/,
      use: { storageState: config.API_AUTH_FILE_PATH },
      dependencies: ['api_auth_setup'],
    },
    {
      name: "gql_practice",
      testMatch: /tests\/api\/gql-test.spec.ts/,
      dependencies: ['db_setup'],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /tests\/ui\/.*\.spec.ts/,
      dependencies: ['db_setup'],
    },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "yarn start:api",
      url: config.BACKEND_HEALTH_URL,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "yarn start:react",
      url: config.FRONTEND_URL,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
