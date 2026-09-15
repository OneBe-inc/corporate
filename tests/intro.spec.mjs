import {test, expect} from '@playwright/test';

const videoPath = '**/assets/onebe-loading-v2.mp4';
const intro = page => page.getByRole('dialog', {name: 'OneBeのオープニング', exact: true});
const skip = page => page.getByRole('button', {name: '動画をスキップしてサイトを表示'});

test('compact PC intro plays at triple speed then holds the final frame for half a second', async ({page}) => {
  await page.setViewportSize({width: 1440, height: 1200});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const errors = [], videoRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().includes('onebe-loading-v2.mp4')) videoRequests.push(request.url()); });
  await page.goto('./', {waitUntil: 'domcontentloaded'});
  await expect(intro(page)).toBeVisible();
  await page.waitForFunction(() => document.querySelector('#intro-loader video')?.currentTime > 0.2);
  const state = await page.locator('#intro-loader video').evaluate(video => ({
    muted: video.muted, inline: video.playsInline, duration: video.duration, rate: video.playbackRate,
    width: video.videoWidth, height: video.videoHeight, fit: getComputedStyle(video).objectFit,
  }));
  expect(state).toEqual({muted: true, inline: true, duration: 10, rate: 3, width: 1920, height: 1080, fit: 'contain'});
  const videoBox = await page.locator('#intro-loader video').boundingBox();
  expect(videoBox.width).toBeLessThanOrEqual(800);
  expect(videoBox.x).toBeGreaterThanOrEqual(320);
  await expect(skip(page)).toBeFocused();
  await page.locator('#intro-loader video').evaluate(video => {
    const pause = video.pause.bind(video);
    window.introTiming = {observedAt: performance.now(), observedMediaTime: video.currentTime};
    video.pause = () => {
      window.introTiming.pausedAt = video.currentTime;
      window.introTiming.pauseTime = performance.now();
      pause();
    };
    const observer = new MutationObserver(() => {
      if (!video.isConnected) {
        window.introTiming.removedAt = performance.now();
        observer.disconnect();
      }
    });
    observer.observe(document.body, {childList: true});
  });
  await expect(page.locator('h2.is-shuffling')).toHaveCount(0);
  await page.waitForFunction(() => document.querySelector('#intro-loader video')?.currentTime > 5);
  await page.screenshot({path: 'reports/intro-1440.png'});
  await expect(intro(page)).toBeHidden({timeout: 11000});
  const timing = await page.evaluate(() => window.introTiming);
  expect(timing.pausedAt).toBeGreaterThanOrEqual(7.35);
  expect(timing.pausedAt).toBeLessThan(7.6);
  expect(timing.removedAt - timing.pauseTime).toBeGreaterThanOrEqual(480);
  expect(timing.removedAt - timing.pauseTime).toBeLessThan(800);
  const playbackSeconds = (timing.pauseTime - timing.observedAt) / 1000 + timing.observedMediaTime / 3;
  expect(playbackSeconds).toBeGreaterThan(2.3);
  expect(playbackSeconds).toBeLessThan(3.0);
  await test.info().attach('intro-timing', {body: JSON.stringify({...timing, playbackSeconds}), contentType: 'application/json'});
  await expect(page.locator('main h2').first()).toHaveClass(/is-shuffling/);
  await expect(page.locator('html')).not.toHaveClass(/intro-active/);
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  const requestCount = videoRequests.length;
  await page.goto('services/');
  await expect(page.locator('#intro-loader')).toHaveCount(0);
  expect(videoRequests.length).toBe(requestCount);
  expect(errors).toEqual([]);
});

for (const width of [390, 834]) {
  test(`video and skip fit ${width}px; skipping and internal navigation do not replay`, async ({page}) => {
    await page.setViewportSize({width, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await page.goto('./', {waitUntil: 'domcontentloaded'});
    await expect(intro(page)).toBeVisible();
    await page.waitForFunction(() => document.querySelector('#intro-loader video')?.currentTime > 3);
    const box = await skip(page).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(900);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    await page.screenshot({path: `reports/intro-${width}.png`});
    await skip(page).click();
    await expect(intro(page)).toBeHidden();
    await expect(page.locator('.site-header .brand')).toBeFocused();
    await page.getByRole('button', {name: 'メニューを開く'}).click();
    await page.getByRole('navigation', {name: 'モバイルナビゲーション'}).getByRole('link', {name: '支援内容', exact: true}).click();
    await page.waitForURL('**/services/');
    await expect(page.locator('#intro-loader')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#intro-loader')).toHaveCount(0);
  });
}

test('Escape returns keyboard users to the website', async ({page}) => {
  await page.goto('./', {waitUntil: 'domcontentloaded'});
  await expect(intro(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(intro(page)).toBeHidden();
  await expect(page.locator('.site-header .brand')).toBeFocused();
});

test('reduced motion skips the video request and can stop active playback', async ({page}) => {
  const requests = [];
  page.on('request', request => { if (request.url().includes('onebe-loading-v2.mp4')) requests.push(request.url()); });
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('./');
  await expect(page.locator('#intro-loader')).toHaveCount(0);
  expect(requests).toEqual([]);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.reload({waitUntil: 'domcontentloaded'});
  await expect(intro(page)).toBeVisible();
  await page.emulateMedia({reducedMotion: 'reduce'});
  await expect(intro(page)).toBeHidden();
  await expect(page.locator('html')).not.toHaveClass(/intro-active/);
});

test('failed video requests reveal the site', async ({page}) => {
  await page.route(videoPath, route => route.abort());
  await page.goto('./', {waitUntil: 'domcontentloaded'});
  await expect(page.locator('#intro-loader')).toHaveCount(0);
  await expect(page.locator('html')).not.toHaveClass(/intro-active/);
  await expect(page.locator('main h1')).toBeVisible();
});

test('rejected autoplay and unavailable session storage cannot block navigation', async ({page}) => {
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')); });
  await page.goto('./');
  await expect(page.locator('#intro-loader')).toHaveCount(0);
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new DOMException('Unavailable', 'SecurityError'); }; });
  await page.goto('services/');
  await expect(page.locator('#intro-loader')).toHaveCount(0);
  await expect(page.locator('main h1')).toBeVisible();
});

test('playback that never starts cannot hold the site indefinitely', async ({page}) => {
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => new Promise(() => {}); });
  await page.goto('./', {waitUntil: 'domcontentloaded'});
  await expect(intro(page)).toBeVisible();
  await expect(intro(page)).toBeHidden({timeout: 4000});
  await expect(page.locator('html')).not.toHaveClass(/intro-active/);
});

test.describe('without JavaScript', () => {
  test.use({javaScriptEnabled: false});
  test('static content remains accessible', async ({page}) => {
    await page.goto('./');
    await expect(page.locator('#intro-loader')).toBeHidden();
    await expect(page.locator('main h1')).toBeVisible();
    await page.getByRole('navigation', {name: '主要ナビゲーション'}).getByRole('link', {name: '支援内容', exact: true}).click();
    await expect(page).toHaveURL(/\/services\/$/);
  });
});
