import {test,expect} from '@playwright/test';
test('tablet sidebar opens without modal, navigates, closes and survives breakpoints',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('onebe-intro-v2','seen'));
 for(const width of [768,834,1024,1199]){
 await page.setViewportSize({width,height:1112});await page.goto('./');await page.getByRole('button',{name:'メニューを開く'}).click();const panel=page.locator('#tablet-navigation');await expect(panel).toBeVisible();await expect(page.locator('body')).not.toHaveClass(/modal-open/);await expect(page.locator('dialog[open]')).toHaveCount(0);await expect(panel.getByRole('button',{name:'メニューを閉じる'})).toBeFocused();await page.waitForTimeout(350);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`reports/tablet-menu-${width}.png`});
 await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(page.getByRole('button',{name:'メニューを開く'})).toBeFocused();
 await page.getByRole('button',{name:'メニューを開く'}).click();await panel.getByRole('link',{name:'実績',exact:true}).click();await expect(page).toHaveURL(/works\/$/);
 }
 await page.getByRole('button',{name:'メニューを開く'}).click();await page.setViewportSize({width:390,height:844});await expect(page.locator('#tablet-navigation')).toBeHidden();await page.getByRole('button',{name:'メニューを開く'}).click();await expect(page.locator('#menu-dialog')).toBeVisible();await page.setViewportSize({width:834,height:1112});await expect(page.locator('#menu-dialog')).not.toBeVisible();await expect(page.locator('body')).not.toHaveClass(/modal-open/);
});
