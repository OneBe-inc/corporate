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
  assert.equal(r.scripts[0].src,'https://www.clarity.ms/tag/yo0ok90i83');
  assert.equal(r.window.dataLayer,undefined);
  assert.equal(r.window.clarity.q[0][0],'consentv2');
  assert.equal(r.window.clarity.q[0][1].ad_Storage,'denied');
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

test('all built layouts include one versioned heatmap loader and privacy disclosure',()=>{
  const files=[];
  function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+item.name;if(item.isDirectory())walk(path);else if(path.endsWith('.html'))files.push(path);}}
  walk('dist');assert.ok(files.length>=27);
  for(const file of files){const html=fs.readFileSync(file,'utf8');assert.equal((html.match(/src="\/assets\/heatmap\.js\?v=[a-f0-9]+"/g)||[]).length,1,file);}
  assert.match(fs.readFileSync('dist/privacy/index.html','utf8'),/Microsoft Clarity/);
});

test('public imagery can render under strict masking without unmasking text or input',()=>{
  const html=fs.readFileSync('dist/index.html','utf8');
  const images=html.match(/<img\b[^>]*>/g)||[];assert.ok(images.length>5);
  for(const img of images)assert.match(img,/data-clarity-unmask="true"/);
  const video=html.match(/<video\b[^>]*id="hero-video"[^>]*>/)?.[0];
  assert.ok(video);assert.match(video,/data-clarity-unmask="true"/);assert.match(video,/poster="\/assets\/hero-type-pc.webp"/);
  assert.match(html,/<main id="main-content" data-clarity-unmask="true">/);
  assert.ok(!/<(?:body|form|input|textarea|select)\b[^>]*data-clarity-unmask/.test(html));
  const contact=fs.readFileSync('dist/contact/index.html','utf8');
  assert.ok(!/<(?:main|form|input|textarea|select)\b[^>]*data-clarity-unmask/.test(contact));
  const r=run('https://onebe-create.com/','yes');
  assert.equal(r.window.clarity.q[1][0],'set');
  assert.equal(r.window.clarity.q[1][1],'site_revision');
  assert.equal(r.window.clarity.q[1][2],'readable_20261024');
});
