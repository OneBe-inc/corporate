import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {summarize,createReport} from '../scripts/security-report.mjs';
const base={token:'test-token',zone:'a'.repeat(32),since:'2026-10-21T00:00:00Z',until:'2026-10-22T00:00:00Z'};
test('a missing, denied or malformed data source cannot become a clean report',async()=>{
 assert.throws(()=>summarize(null));
 await assert.rejects(createReport({...base,fetcher:async()=>({ok:false,status:403})}));
 await assert.rejects(createReport({...base,fetcher:async()=>({ok:true,json:async()=>({errors:[{message:'permission denied'}]})})}));
 await assert.rejects(createReport({...base,fetcher:async()=>({ok:true,json:async()=>({data:{viewer:{zones:[]}}})})}));
});
test('retrieved events are labeled as sampled detections, HTML escaped, and credentials excluded',async()=>{
 const output=await fs.mkdtemp(path.join(os.tmpdir(),'onebe-security-'));
 const event={action:'block',clientCountryName:'JP',clientRequestPath:'/<script>alert(1)</script>',datetime:base.since,source:'waf'};
 const fetcher=async(url,options)=>{assert.equal(url,'https://api.cloudflare.com/client/v4/graphql');assert.ok(!JSON.parse(options.body).query.includes('clientIP'));return {ok:true,json:async()=>({data:{viewer:{zones:[{firewallEventsAdaptive:[event]}]}}})};};
 const result=await createReport({...base,output,fetcher});
 const html=await fs.readFile(result.file,'utf8');assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes(base.token));assert.deepEqual(result.actions,{block:1});assert.equal(result.returnedEvents,1);assert.equal(summarize(Array(1000).fill(event)).limitReached,true);
});
