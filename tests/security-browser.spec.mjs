import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.addInitScript(()=>{sessionStorage.setItem('onebe-intro-v2','seen');window.cspFailures=[];document.addEventListener('securitypolicyviolation',e=>window.cspFailures.push({directive:e.effectiveDirective,blocked:e.blockedURI}));});
});
test('CSP allows existing home, inquiry and monthly scripts',async({page})=>{
 for(const route of ['','contact/','contact/confirm/','services/monthly/']){
  await page.goto(route||'./');await expect(page.locator('main h1')).toBeVisible();
  if(route==='contact/')await page.locator('#inquiryType').selectOption('制作依頼・お見積もり');
  await expect.poll(()=>page.evaluate(()=>window.cspFailures)).toEqual([]);
 }
});
test('an injected script without an approved hash is blocked by the browser',async({page})=>{
 await page.goto('contact/');
 await page.evaluate(()=>{const script=document.createElement('script');script.textContent='window.onebeInjectedScriptRan=true';document.head.append(script);});
 await expect.poll(()=>page.evaluate(()=>window.cspFailures.some(e=>e.directive==='script-src-elem'))).toBe(true);
 expect(await page.evaluate(()=>window.onebeInjectedScriptRan)).toBeUndefined();
});
