import {test, expect} from '@playwright/test';

const target = '.section-intro h2';
async function enterViewport(page) {
  await page.locator(target).evaluate(node => node.scrollIntoView({behavior: 'instant', block: 'center'}));
}

for (const width of [390, 834, 1440]) {
  test(`h2 shuffle preserves readable text, line breaks and layout at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto('./');
    const heading = page.locator(target);
    const original = await heading.innerHTML();
    const text = await heading.textContent();
    const before = await heading.boundingBox();

    await enterViewport(page);
    await expect(heading).toHaveClass(/is-shuffling/);
    await expect(heading).toHaveAccessibleName(/本音から、\s*ブランドをつくる。/);
    expect(await heading.locator('.heading-shuffle-source').innerHTML()).toBe(original);
    const visual = heading.locator('.heading-shuffle-visual');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
    expect(await visual.textContent()).not.toBe(text);
    await expect(visual.locator('br')).toHaveCount(1);
    const during = await heading.boundingBox();
    expect(during.width).toBeCloseTo(before.width, 1);
    expect(during.height).toBeCloseTo(before.height, 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    await page.screenshot({path: `reports/shuffle-${width}-during.png`});

    await expect(heading).not.toHaveClass(/is-shuffling/);
    expect(await heading.innerHTML()).toBe(original);
    const after = await heading.boundingBox();
    expect(after.height).toBeCloseTo(before.height, 1);

    // Re-entering the viewport must not replay the effect.
    await heading.evaluate(node => {
      window.shuffleReplayed = false;
      new MutationObserver(() => {
        if (node.querySelector('.heading-shuffle-visual')) window.shuffleReplayed = true;
      }).observe(node, {childList: true, subtree: true});
    });
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    await page.waitForTimeout(80);
    await enterViewport(page);
    await page.waitForTimeout(150);
    expect(await page.evaluate(() => window.shuffleReplayed)).toBe(false);
  });
}

test('reduced motion keeps original headings and cancels an active shuffle', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('./');
  await enterViewport(page);
  const original = await page.locator(target).innerHTML();
  await expect(page.locator('.heading-shuffle-visual')).toHaveCount(0);
  await expect(page.locator(target)).toHaveAccessibleName(/本音から、\s*ブランドをつくる。/);

  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto('./');
  await enterViewport(page);
  await expect(page.locator(target)).toHaveClass(/is-shuffling/);
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(page.locator('.heading-shuffle-visual')).toHaveCount(0);
  expect(await page.locator(target).innerHTML()).toBe(original);
});

test('headings remain readable when IntersectionObserver is unavailable', async ({page}) => {
  await page.addInitScript(() => { delete window.IntersectionObserver; });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await enterViewport(page);
  await expect(page.locator(target)).toHaveAccessibleName(/本音から、\s*ブランドをつくる。/);
  await expect(page.locator('.heading-shuffle-visual')).toHaveCount(0);
  expect(errors).toEqual([]);
});
