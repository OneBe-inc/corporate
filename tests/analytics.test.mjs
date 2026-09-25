import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/assets/analytics.js', import.meta.url), 'utf8');
function run(url, referrer = '') {
  const scripts = [];
  const context = {URL, Date, location: new URL(url), window: {}, document: {
    referrer, createElement: () => ({}), head: {appendChild: el => scripts.push(el)}
  }};
  vm.runInNewContext(source, context);
  return {scripts, window: context.window, get calls(){return context.window.dataLayer?.map(x => Array.from(x)) || [];} };
}
test('production emits one config and strips query/hash from page and referrer', () => {
  const result = run('https://onebe-create.com/contact/?email=private@example.com#secret', 'https://example.com/path?name=private');
  assert.equal(result.scripts.length, 1);
  assert.equal(result.calls.filter(x => x[0] === 'config').length, 1);
  const [, id, config] = result.calls[1];
  assert.equal(id, 'G-21K44SV7K0');
  assert.equal(config.page_location, 'https://onebe-create.com/contact/');
  assert.equal(config.page_referrer, 'https://example.com/path');
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  assert.ok(!JSON.stringify(result).includes('private'));
});
test('successful submission hook records one lead with fixed non-personal fields', () => {
  const result = run('https://onebe-create.com/contact/confirm/?email=private#secret');
  result.window.onebeTrackLead(); result.window.onebeTrackLead();
  const events = result.calls.filter(x => x[0] === 'event');
  assert.equal(events.length, 1);
  assert.equal(events[0][1], 'generate_lead');
  assert.equal(events[0][2].form_id, 'contact');
  assert.ok(!JSON.stringify(events).includes('private'));
  const direct = run('https://onebe-create.com/thanks/');
  direct.window.onebeTrackLead();
  assert.equal(direct.calls.filter(x => x[0] === 'event').length, 0);
});
test('local previews and other hosts never load analytics', () => {
  for (const url of ['http://localhost:4173/', 'https://onebe-inc.github.io/corporate/', 'http://onebe-create.com/']) {
    assert.equal(run(url).scripts.length, 0);
    assert.equal(run(url).calls.length, 0);
  }
});
