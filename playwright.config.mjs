import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'*.spec.mjs',workers:1,timeout:30000,use:{baseURL:'http://127.0.0.1:4173/',channel:process.platform==='win32'?'msedge':undefined},reporter:[['list'],['json',{outputFile:'reports/browser-tests.json'}]],webServer:{command:'npm run preview',url:'http://127.0.0.1:4173/',reuseExistingServer:true}});
