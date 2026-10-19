import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/assets/analytics.js', import.meta.url), 'utf8');
function run(url, referrer = '') {
  const scripts = [];
  const listeners = {};
  const context = {URL, Date, location: new URL(url), window: {}, document: {
    referrer, addEventListener: (name,fn) => {listeners[name]=fn;}, createElement: () => ({}), head: {appendChild: el => scripts.push(el)}
  }};
  vm.runInNewContext(source, context);
  return {scripts, click: href => listeners.click?.({target:{closest:()=>({href})}}), get calls(){return context.window.dataLayer?.map(x => Array.from(x)) || [];}};
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
test('local previews and other hosts never load analytics', () => {
  for (const url of ['http://localhost:4173/', 'https://onebe-inc.github.io/corporate/', 'http://onebe-create.com/']) {
    assert.equal(run(url).scripts.length, 0);
    assert.equal(run(url).calls.length, 0);
  }
});
test('contact navigation counts interest, never a lead, and ignores free-form URL values',()=>{
  const result=run('https://onebe-create.com/services/business-card/');
  result.click('https://onebe-create.com/contact/?topic='+encodeURIComponent('名刺制作')+'&email=private@example.com');
  result.click('https://onebe-create.com/contact/?topic=private@example.com');
  result.click('https://elsewhere.example/contact/?topic=private@example.com');
  const events=result.calls.filter(x=>x[0]==='event');
  assert.equal(events.length,2);
  assert.equal(events[0][1],'contact_click');
  assert.equal(events[0][2].service_type,'business_card');
  assert.equal(events[1][2].service_type,'other');
  assert.ok(!JSON.stringify(events).includes('private'));
  assert.ok(!events.some(x=>x[1]==='generate_lead'));
});
