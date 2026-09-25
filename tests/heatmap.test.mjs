import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/assets/heatmap.js', import.meta.url), 'utf8');
function run(url, choice, options = {}) {
  const scripts = [], handlers = {}, status = {}, buttons = ['no', 'yes'].map(choice => ({dataset:{choice}, addEventListener(type, fn){this.click=fn;},focus(){}}));
  const panel = {setAttribute(){},querySelector: selector => selector === 'button' ? buttons[0] : status,querySelectorAll:()=>buttons};
  const settings = {addEventListener(type,fn){this.click=fn;},focus(){}};
  let count=0,reloads=0,masked=false;
  let saved = choice ? JSON.stringify({choice,until: Date.now() + (options.expired ? -1 : 86400000)}) : null;
  const location = new URL(url); location.reload=()=>reloads++;
  const document = {referrer:options.referrer || '',createElement:tag=>tag==='script'?{}:count++===0?panel:settings,body:{appendChild(){},setAttribute(){masked=true;}},head:{appendChild:el=>scripts.push(el)},querySelector:()=>({appendChild(){}})};
  const window={addEventListener:(name,fn)=>handlers[name]=fn};
  const localStorage={getItem:()=>{if(options.blocked)throw Error();return saved;},setItem:(key,value)=>{if(options.blocked)throw Error();saved=value;}};
  const context={window,document,location,localStorage,URL,Date};
  vm.runInNewContext(source,context);
  return {scripts,window,panel,status,buttons,settings,handlers,runAgain:()=>vm.runInNewContext(source,context),get reloads(){return reloads;},get masked(){return masked;}};
}
test('no request before consent; allow once and withdraw unloads recorder',()=>{
  const r=run('https://onebe-create.com/');
  assert.equal(r.scripts.length,0);assert.equal(r.panel.hidden,false);
  r.buttons[1].click();r.buttons[1].click();r.runAgain();
  assert.equal(r.scripts.length,1);assert.equal(r.masked,true);
  assert.equal(r.scripts[0].src,'https://www.googletagmanager.com/gtm.js?id=GTM-P8T4FL8D');
  assert.deepEqual(Array.from(r.window.dataLayer,v=>v.event),['gtm.js','onebe_clarity_allowed']);
  r.buttons[0].click();assert.equal(r.reloads,1);
});
test('denial, expired consent, and unavailable storage fail closed',()=>{
  for(const [choice,options] of [['no',{}],['yes',{expired:true}],['yes',{blocked:true}]])assert.equal(run('https://onebe-create.com/',choice,options).scripts.length,0);
  const r=run('https://onebe-create.com/',null,{blocked:true});r.buttons[1].click();assert.equal(r.scripts.length,0);assert.match(r.status.textContent,/保存できない/);
});
test('sensitive routes, query strings, fragments, previews and referrer parameters never start',()=>{
  for(const url of ['https://onebe-create.com/contact/','https://onebe-create.com/contact/confirm/','https://onebe-create.com/thanks/','https://onebe-create.com/?email=private','https://onebe-create.com/#private','http://onebe-create.com/','https://example.com/','http://localhost:4173/'])assert.equal(run(url,'yes').scripts.length,0,url);
  assert.equal(run('https://onebe-create.com/','yes',{referrer:'https://example.com/?email=private'}).scripts.length,0);
});
test('stored approval works on corporate and LP; settings can be reopened',()=>{
  for(const path of ['/','/services/monthly/']){
    const r=run('https://onebe-create.com'+path,'yes');assert.equal(r.scripts.length,1);assert.equal(r.panel.hidden,true);r.settings.click();assert.equal(r.panel.hidden,false);
  }
});
