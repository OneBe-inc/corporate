import fs from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {XMLParser,XMLValidator} from 'fast-xml-parser';

export const feedURL='https://note.com/isseimasuya/rss';
const snapshot=new URL('../src/note-posts.json',import.meta.url);
export function parseFeed(xml){
  if(xml.length>2_000_000||/<!DOCTYPE|<!ENTITY/i.test(xml)||XMLValidator.validate(xml)!==true)throw Error('Invalid RSS');
  const channel=new XMLParser({ignoreAttributes:false,parseTagValue:false}).parse(xml)?.rss?.channel;
  if(channel?.link!=='https://note.com/isseimasuya')throw Error('Unexpected feed author');
  const items=Array.isArray(channel.item)?channel.item:[channel.item];
  if(!items[0])throw Error('Empty RSS; keeping previous articles');
  const posts=items.map(item=>{
    const href=String(item.link||'');
    if(!/^https:\/\/note\.com\/isseimasuya\/n\/n[a-z0-9]+$/.test(href))throw Error('Unexpected article URL');
    const title=String(item.title||'').trim();
    const date=new Date(item.pubDate);
    const thumb=item['media:thumbnail'];
    const image=typeof thumb==='string'?thumb:thumb?.['@_url'];
    const imageURL=new URL(image);
    if(!title||title.length>300||!Number.isFinite(date.getTime())||imageURL.protocol!=='https:'||imageURL.hostname!=='assets.st-note.com'||imageURL.username||imageURL.password)throw Error('Invalid article metadata');
    return {title,date:new Date(date.getTime()+9*3600000).toISOString().slice(0,10),category:'代表のnote',href,image,timestamp:date.getTime()};
  }).sort((a,b)=>b.timestamp-a.timestamp||a.href.localeCompare(b.href));
  return [...new Map(posts.map(p=>[p.href,p])).values()].slice(0,3).map(({timestamp,...post})=>post);
}

export async function syncNote({fetcher=fetch,file=snapshot,output=process.env.GITHUB_OUTPUT}={}){
  let changed=false;
  let status='unchanged';
  try{
    const response=await fetcher(feedURL,{signal:AbortSignal.timeout(20000),headers:{Accept:'application/rss+xml, application/xml, text/xml'}});
    if(!response.ok)throw Error(`RSS HTTP ${response.status}`);
    const posts=parseFeed(await response.text());
    const previous=JSON.parse(await fs.readFile(file,'utf8'));
    changed=JSON.stringify(previous)!==JSON.stringify(posts);
    if(changed){
      // Same-directory atomic replacement keeps the last complete snapshot on failure.
      const target=(file instanceof URL?fileURLToPath(file):file)+'.tmp';
      await fs.writeFile(target,JSON.stringify(posts,null,2)+'\n');
      await fs.rename(target,file);
      status='updated';
    }
    console.log(`note RSS: ${status} (${posts.length} articles)`);
  }catch(error){
    changed=false;status='fallback';
    // A missing/invalid backup must fail the build instead of publishing an empty list.
    const previous=JSON.parse(await fs.readFile(file,'utf8'));
    if(!Array.isArray(previous)||!previous.length)throw Error('No usable note backup');
    console.warn(`note RSS unavailable; retained previous articles: ${error.message}`);
  }
  // Compare with the published snapshot too, so a failed deployment is retried.
  let publish=changed;
  if(process.env.GITHUB_EVENT_NAME==='schedule'){
    try{
      const live=await fetcher('https://onebe-inc.github.io/corporate/assets/note-posts.json',{signal:AbortSignal.timeout(15000),cache:'no-store'});
      if(!live.ok)throw Error('Published snapshot unavailable');
      publish=JSON.stringify(await live.json())!==JSON.stringify(JSON.parse(await fs.readFile(file,'utf8')));
    }catch{publish=true;}
  }
  if(output)await fs.appendFile(output,`changed=${changed}\npublish=${publish}\nstatus=${status}\n`);
  if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,`### note RSS\nStatus: ${status}. Previous articles are retained if RSS is unavailable.\n`);
  return {changed,status};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await syncNote();
