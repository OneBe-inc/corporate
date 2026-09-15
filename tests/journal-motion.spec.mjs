import {test,expect} from '@playwright/test';
test('journal fades, keeps the latest rapid selection, and respects reduced motion',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('onebe-intro-v2','seen'));
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('./');
 const journal=page.locator('.journal'),results=page.locator('.journal-results');
 await page.getByRole('button',{name:'ブログ',exact:true}).click();
 await expect(journal).toHaveAttribute('aria-busy','true');
 await expect.poll(()=>results.evaluate(e=>e.getAnimations().length)).toBeGreaterThan(0);
 await expect(journal).not.toHaveAttribute('aria-busy','true');
 await expect(page.locator('.blog-card:visible')).toHaveCount(2);
 await page.evaluate(()=>{for(const category of ['プレスリリース','お知らせ','すべて'])document.querySelector(`[data-journal-filter="${category}"]`).click();});
 await expect(journal).not.toHaveAttribute('aria-busy','true');
 await expect(page.locator('.blog-card:visible')).toHaveCount(3);
 await expect(results).toHaveCSS('opacity','1');expect(await results.evaluate(e=>e.inert)).toBe(false);
 await page.getByRole('button',{name:'プレスリリース',exact:true}).click();await expect(journal).not.toHaveAttribute('aria-busy','true');await expect(page.locator('.journal-empty')).toBeVisible();
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'ブログ',exact:true}).click();await expect(page.locator('.blog-card:visible')).toHaveCount(2);expect(await results.evaluate(e=>e.getAnimations().length)).toBe(0);
});
