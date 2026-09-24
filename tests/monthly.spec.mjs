import {test,expect} from '@playwright/test';
for(const width of [320,390,834,1440])test(`monthly LP at ${width}px`,async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width,height:900});await page.goto('/services/monthly/');
 await expect(page.locator('.showcase')).toHaveClass(/orbit-ready/);
 await expect(page.locator('main h1')).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 expect(await page.locator('img').evaluateAll(images=>images.filter(i=>!i.loading||i.loading!=='lazy').every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
 await expect(page.locator('[rel=canonical]')).toHaveAttribute('href','https://onebe-create.com/services/monthly/');
 expect(await page.locator('[data-contact]').evaluateAll(links=>links.length===9&&links.every(a=>a.href==='https://lin.ee/rF35Qat'))).toBe(true);
 const before=await page.locator('.sample-item').first().getAttribute('style');
 await page.locator('.carousel-viewport').evaluate(e=>e.scrollLeft+=260);
 await expect(page.locator('.sample-item').first()).not.toHaveAttribute('style',before);
 await page.locator('.faq summary').first().click();
 await expect(page.locator('.faq details').first()).toHaveAttribute('open','');
 expect(await page.locator('.faq-answer').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('faq-reveal');
 if(width<=800){await page.getByRole('button',{name:'メニューを開く',exact:true}).click();
 await expect(page.locator('#main-nav')).toHaveClass(/is-open/);
 expect(await page.locator('#main-nav').evaluate(e=>e.tagName)).toBe('NAV');
 await page.keyboard.press('Escape');await expect(page.locator('#main-nav')).not.toHaveClass(/is-open/);}
 expect(errors).toEqual([]);
});
test('production analytics initializes once and previews do not track',async({page})=>{
 await page.goto('/services/monthly/');expect(await page.evaluate(()=>typeof window.gtag)).toBe('undefined');
 const fs=await import('node:fs');const html=fs.readFileSync('dist/services/monthly/index.html','utf8');
 await page.route('https://onebe-create.com/**',route=>{
 const pathname=new URL(route.request().url()).pathname;
 const file='dist'+pathname+(pathname.endsWith('/')?'index.html':'');
 return route.fulfill({body:fs.readFileSync(file),contentType:pathname.endsWith('.js')?'application/javascript':pathname.endsWith('.css')?'text/css':pathname.endsWith('/')?'text/html':'application/octet-stream'});
 });
 await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({body:'',contentType:'application/javascript'}));
 await page.goto('https://onebe-create.com/services/monthly/');
 await expect.poll(()=>page.evaluate(()=>window.dataLayer?.filter(a=>a[0]==='event'&&a[1]==='page_view').length)).toBe(1);
 const events=await page.evaluate(()=>Array.from(window.dataLayer,a=>Array.from(a)));
 expect(events.find(a=>a[0]==='config')[1]).toBe('G-21K44SV7K0');
 expect(events.find(a=>a[1]==='page_view')[2].page_location).toBe('https://onebe-create.com/services/monthly/');
 expect(html.match(/src="assets\/analytics.js/g)).toHaveLength(1);
});

test('supplied restaurant screen opens in sample preview',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/services/monthly/');
 const phone=page.locator('[data-sample="sola"]');await expect(phone).toHaveAttribute('data-title','ワンビー食堂');
 await expect(phone.locator('.screenshot-screen img')).toHaveAttribute('src','assets/onebe-restaurant.png');
 await phone.click();await expect(page.locator('#dialog-title')).toHaveText('ワンビー食堂');
 await expect(page.locator('.dialog-preview img')).toBeVisible();await page.keyboard.press('Escape');
 await expect(page.locator('.sample-dialog')).not.toBeVisible();
});
