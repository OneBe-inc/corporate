import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>page.addInitScript(()=>sessionStorage.setItem('onebe-intro-v2','seen')));
for(const [width,variant] of [[1440,'pc'],[834,'tablet'],[390,'mobile']]){
 test(`typography film fits ${width} and supports pause and play`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('./');
  const v=page.locator('#hero-video');await expect(v).toBeVisible();
  await page.waitForFunction(()=>document.querySelector('#hero-video').currentTime>.1);
  expect(await v.evaluate(v=>v.currentSrc)).toContain(`hero-type-${variant}.mp4`);
  expect(await v.evaluate(v=>({duration:v.duration,muted:v.muted,loop:v.loop,inline:v.playsInline}))).toEqual({duration:12,muted:true,loop:true,inline:true});
  await page.getByRole('button',{name:'FVの映像を一時停止'}).click();
  expect(await v.evaluate(v=>v.paused)).toBe(true);
  await page.getByRole('button',{name:'FVの映像を再生'}).click();
  await expect.poll(()=>v.evaluate(v=>v.paused)).toBe(false);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await v.evaluate(async v=>{v.pause();await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=6.7;});});
  await page.screenshot({path:`reports/hero-type-${width}.png`});
 });
}
test('resizing selects another film and preserves a manual pause',async({page})=>{
 await page.setViewportSize({width:1440,height:1000});await page.goto('./');await expect(page.locator('#hero-video')).toBeVisible();
 await page.setViewportSize({width:834,height:1000});await expect.poll(()=>page.locator('#hero-video').evaluate(v=>v.currentSrc)).toContain('hero-type-tablet.mp4');
 await page.getByRole('button',{name:'FVの映像を一時停止'}).click();await page.setViewportSize({width:390,height:1000});
 await expect(page.locator('.hero-poster')).toBeVisible();expect(await page.locator('#hero-video').evaluate(v=>v.paused)).toBe(true);
 await page.getByRole('button',{name:'FVの映像を再生'}).click();await expect.poll(()=>page.locator('#hero-video').evaluate(v=>v.currentSrc)).toContain('hero-type-mobile.mp4');
});
test('reduced motion shows a poster without fetching a film until requested',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});const requests=[];page.on('request',r=>{if(/hero-type-.*mp4/.test(r.url()))requests.push(r.url());});
 await page.goto('./');await expect(page.locator('.hero-poster')).toBeVisible();expect(requests).toEqual([]);
 await page.getByRole('button',{name:'FVの映像を再生'}).click();await expect(page.locator('#hero-video')).toBeVisible();
});
test('failed video leaves the poster and navigation available',async({page})=>{
 await page.route('**/hero-type-*.mp4',r=>r.abort());await page.goto('./');
 await expect(page.getByRole('button',{name:'FVの映像を再生'})).toBeVisible();await expect(page.locator('.hero-poster')).toBeVisible();await expect(page.locator('main h1')).toBeVisible();
});
test('hero playback waits for the opening animation',async({page})=>{
 await page.addInitScript(()=>sessionStorage.removeItem('onebe-intro-v2'));const requests=[];page.on('request',r=>{if(/hero-type-.*mp4/.test(r.url()))requests.push(r.url());});
 await page.goto('./');await expect(page.locator('#intro-loader')).toBeVisible();expect(requests).toEqual([]);
 await page.getByRole('button',{name:'動画をスキップしてサイトを表示'}).click();await expect(page.locator('#hero-video')).toBeVisible();
});
