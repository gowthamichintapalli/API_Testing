
import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  use: {
    baseURL: 'https://api.qa.realtimerecs.net',
    extraHTTPHeaders: {
      Accept: 'application/json',
    },
  },

  fullyParallel: false,
  reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
],
});
