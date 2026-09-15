import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {parseFeed,syncNote} from '../scripts/sync-note.mjs';
const item=(id,date='Mon, 14 Sep 2026 16:00:00 GMT')=>`<item><title>記事 &amp; ${id}</title><link>https://note.com/isseimasuya/n/n${id}</link><pubDate>${date}</pubDate><media:thumbnail>https://assets.st-note.com/${id}.png</media:thumbnail></item>`;
const feed=items=>`<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><link>https://note.com/isseimasuya</link>${items}</channel></rss>`;
test('RSS decodes text, uses Japan dates, removes duplicates and caps latest three',()=>{
 const posts=parseFeed(feed(item('1','Fri, 11 Sep 2026 00:00:00 GMT')+item('2')+item('3')+item('4')+item('4')));
 assert.equal(posts.length,3);assert.equal(posts[0].date,'2026-09-15');assert.equal(posts[0].title,'記事 & 2');assert(!posts.some(p=>p.href.endsWith('n1')));
});
test('empty, malformed, wrong-author and unsafe URLs are rejected',()=>{
 for(const xml of [feed(''),'<rss>',feed(item('1')).replace('https://assets.st-note.com/1.png','javascript:alert(1)'),feed(item('1')).replaceAll('isseimasuya','other'),feed(item('1')).replace('Mon, 14 Sep 2026 16:00:00 GMT','invalid')])assert.throws(()=>parseFeed(xml));
});
test('changed feed persists, unchanged feed does not rewrite, outage keeps latest good snapshot',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'onebe-note-'));const file=path.join(dir,'posts.json');
 try{
  await fs.writeFile(file,JSON.stringify(parseFeed(feed(item('1')))));
  const fetcher=async()=>({ok:true,text:async()=>feed(item('2'))});
  assert.equal((await syncNote({file,fetcher})).changed,true);
  const saved=await fs.readFile(file,'utf8');const stat=await fs.stat(file);
  assert.equal((await syncNote({file,fetcher})).changed,false);
  assert.equal((await fs.stat(file)).mtimeMs,stat.mtimeMs);
  for(const failed of [async()=>{throw Error('timeout')},async()=>({ok:false,status:503}),async()=>({ok:true,text:async()=>feed('')})]){
   assert.equal((await syncNote({file,fetcher:failed})).status,'fallback');assert.equal(await fs.readFile(file,'utf8'),saved);
  }
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
