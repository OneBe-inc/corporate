import {test,expect} from '@playwright/test';
for(const width of [390,834,1440])test(`approved home and services at ${width}`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.addInitScript(()=>sessionStorage.setItem('onebe-intro-v2','seen'));await page.emulateMedia({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('./');

 await expect(page.locator('.works-slide:visible')).toHaveCount(1);
 await page.getByRole('button',{name:'次の実績',exact:true}).click();await expect(page.locator('.carousel-count')).toHaveText('02 / 04');
 await page.getByRole('button',{name:'前の実績',exact:true}).click();await expect(page.locator('.carousel-count')).toHaveText('01 / 04');
 await page.locator('[data-slide="3"]').click();await expect(page.locator('.works-slide:visible')).toContainText('ontsugi');
 await page.locator('[data-slide="0"]').click();
 await page.getByRole('button',{name:'プレスリリース',exact:true}).click();await expect(page.locator('.journal-empty')).toBeVisible();await expect(page.locator('.blog-card:visible')).toHaveCount(0);
 await page.getByRole('button',{name:'ブログ',exact:true}).click();await expect(page.locator('.blog-card:visible')).toHaveCount(2);
 await page.getByRole('button',{name:'すべて',exact:true}).click();await expect(page.locator('.blog-card:visible')).toHaveCount(3);
 for(const route of ['./','services/','journal/']){await page.goto(route);await page.locator('main img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));await expect.poll(()=>page.locator('main img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);for(const img of await page.locator('main img:visible').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());}await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`reports/approved-${width}-${route.replaceAll('/','-')}.png`,fullPage:true});}
 expect(errors).toEqual([]);
});
