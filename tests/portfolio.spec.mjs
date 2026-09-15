import {test,expect} from '@playwright/test';
test('selected portfolio assets load and zoom captions follow each image',async({page})=>{
  await page.addInitScript(()=>sessionStorage.setItem('onebe-intro-v2','seen'));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,834,1440]){
    await page.setViewportSize({width,height:1000});
    for(const route of ['works/','works/umui/','works/soyokaze/','works/vaizo/']){
      await page.goto(route);
      await page.locator('main img').evaluateAll(images=>images.forEach(img=>img.loading='eager'));
      await expect.poll(()=>page.locator('main img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      const triggers=page.locator('[data-zoom]');
      for(let i=0;i<await triggers.count();i++){
        const trigger=triggers.nth(i),caption=await trigger.getAttribute('data-caption');
        await trigger.click();
        await expect(page.getByRole('dialog',{name:'実績画像',exact:true})).toBeVisible();
        await expect(page.locator('#zoom-caption')).toHaveText(caption);
        await expect.poll(()=>page.locator('#zoom-image').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
        await page.keyboard.press('Escape');
        await expect(trigger).toBeFocused();
      }
      for(const img of await page.locator('main img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());}
      await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
      await page.waitForTimeout(300);
      await page.screenshot({path:`reports/photos-${width}-${route.replaceAll('/','-')}.png`,fullPage:true});
    }
  }
  expect(errors).toEqual([]);
});
