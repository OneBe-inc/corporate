import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parse} from 'parse5';
import {inlineScriptHashes,contentSecurityPolicy,responseHeaders} from '../src/security-policy.mjs';

test('all built HTML enforces CSP before scripts and authorizes exact inline content',()=>{
 const files=[];function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=dir+'/'+d.name;if(d.isDirectory())walk(p);else if(p.endsWith('.html'))files.push(p);}}walk('dist');
 assert.ok(files.length>=27);
 for(const file of files){const html=fs.readFileSync(file,'utf8');let policy;const order=[];function visit(n){if(n.tagName==='meta'&&n.attrs.some(a=>a.name==='http-equiv'&&a.value==='Content-Security-Policy')){policy=n.attrs.find(a=>a.name==='content').value;order.push('csp');}if(n.tagName==='script')order.push('script');for(const c of n.childNodes||[])visit(c);}visit(parse(html));assert.ok(policy,file);assert.equal(order[0],'csp',file);assert.equal(policy,contentSecurityPolicy(inlineScriptHashes(html)),file);assert.ok(!policy.split(';').find(s=>s.trim().startsWith('script-src')).includes('unsafe-inline'));assert.match(policy,/form-action 'none'/);assert.ok(!policy.includes('frame-ancestors'));}
});
test('changed inline content requires a different script hash',()=>{assert.notDeepEqual(inlineScriptHashes('<script>safe()</script>'),inlineScriptHashes('<script>unsafe()</script>'));});
test('edge-only protections deny framing and avoid premature HSTS preload',()=>{const h=responseHeaders();assert.equal(h['X-Frame-Options'],'DENY');assert.match(h['Content-Security-Policy'],/frame-ancestors 'none'/);assert.equal(h['X-Content-Type-Options'],'nosniff');assert.ok(!/includeSubDomains|preload/.test(h['Strict-Transport-Security']));});
