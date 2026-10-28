import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/real',testMatch:'**/*.spec.ts',fullyParallel:false,workers:1,retries:0,timeout:180000,
 expect:{timeout:15000},outputDir:'test-results/real',reporter:[['list'],['json',{outputFile:'test-results/real-report.json'}]],
 use:{baseURL:process.env.E2E_BASE_URL||'http://localhost:5173',trace:'retain-on-failure',screenshot:'only-on-failure',actionTimeout:15000},
 projects:[
  {name:'desktop',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:900},locale:'pt-BR'}},
  {name:'mobile',testIgnore:'**/*.provider.spec.ts',use:{...devices['Pixel 7'],locale:'es-ES'}},
 ]
});
