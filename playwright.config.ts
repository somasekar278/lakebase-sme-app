import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',workers:1,use:{baseURL:process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:5173',launchOptions:{executablePath:'/usr/bin/chromium',args:['--no-sandbox']},viewport:{width:1512,height:1050}},reporter:'list'});
