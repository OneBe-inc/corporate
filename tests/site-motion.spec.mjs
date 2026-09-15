import {test,expect} from '@playwright/test';
test('deliverable categories, deep links and cross-document fades',async({page})=>{
 await page.addInitScript(()=>{sessionStorage.setItem('onebe-intro-v2','seen');new MutationObserver(()=>{if(document.documentElement?.classList.contains('page-enter'))sessionStorage.setItem('transition-observed','yes');}).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});});
 await page.emulateMedia({reducedMotion:'no-preference'});
 for(const width of [390,834,1440]){
 await page.setViewportSize({width,height:1000});await page.goto('works/');
 for(const [category,count] of [['紙',3],['Web',1],['サイン・空間',1],['ブランド',2]]){
 await page.getByRole('button',{name:category,exact:true}).click();await expect(page.locator('[data-deliverable-category]:visible')).toHaveCount(count);await expect(page.locator('[data-company-works]')).toBeHidden();await expect(page.locator('#works-grid').locator('..')).not.toHaveAttribute('aria-busy','true');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 await page.getByRole('button',{name:'紙',exact:true}).click();await expect(page.locator('[data-deliverable-category]:visible')).toHaveCount(3);await page.locator('[data-deliverable-category]:visible').first().getByRole('link',{name:'成果を見る'}).click();await expect(page).toHaveURL(/vaizo\/#support-3$/);await expect(page.locator('#support-3')).toContainText('V/CORE');await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem('transition-observed'))).toBe('yes');
 await page.goBack();await expect(page.getByRole('button',{name:'紙',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-deliverable-category]:visible')).toHaveCount(3);
 await page.getByRole('button',{name:'すべて',exact:true}).click();await expect(page.locator('[data-company-works]')).toBeVisible();await expect(page.locator('[data-company-works] .work-card:visible')).toHaveCount(4);
 }
 await page.goto('works/?category='+encodeURIComponent('紙・サイン'));await expect(page.getByRole('button',{name:'紙',exact:true})).toHaveAttribute('aria-pressed','true');
});
