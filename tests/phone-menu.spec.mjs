import {test,expect} from '@playwright/test';
test('phone menu fits, scrolls, restores focus and navigates across breakpoints',async({page})=>{
 await page.addInitScript(()=>sessionStorage.setItem('onebe-intro-v2','seen'));
 for(const [width,height] of [[320,568],[390,844],[430,932]]){
 await page.setViewportSize({width,height});await page.goto('./');await page.getByRole('button',{name:'メニューを開く'}).click();const panel=page.locator('#phone-navigation');await expect(panel).toBeVisible();await expect(panel.getByRole('button',{name:'メニューを閉じる'})).toBeFocused();await expect(page.locator('dialog[open]')).toHaveCount(0);await page.waitForTimeout(450);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await page.screenshot({path:`reports/phone-menu-${width}.png`});
 await panel.getByRole('link',{name:'プライバシーポリシー',exact:true}).scrollIntoViewIfNeeded();await expect(panel.getByRole('link',{name:'プライバシーポリシー',exact:true})).toBeInViewport();await page.keyboard.press('Escape');await expect(panel).toBeHidden();await expect(page.getByRole('button',{name:'メニューを開く'})).toBeFocused();
 await page.getByRole('button',{name:'メニューを開く'}).click();await panel.getByRole('link',{name:/実績 SELECTED WORKS/}).click();await expect(page).toHaveURL(/works\/$/);
 }
 await page.getByRole('button',{name:'メニューを開く'}).click();await page.setViewportSize({width:834,height:1112});await expect(page.locator('#phone-navigation')).toBeHidden();expect(await page.locator('main').evaluate(e=>e.inert)).toBe(false);await page.getByRole('button',{name:'メニューを開く'}).click();await expect(page.locator('#tablet-navigation')).toBeVisible();await page.setViewportSize({width:390,height:844});await expect(page.locator('#tablet-navigation')).toBeHidden();await page.getByRole('button',{name:'メニューを開く'}).click();await expect(page.locator('#phone-navigation')).toBeVisible();
});
