import config from './playwright.config.mjs';
export default {...config,webServer:{...config.webServer,reuseExistingServer:false},reporter:[['list'],['json',{outputFile:'reports/security/browser-tests.json'}]]};
