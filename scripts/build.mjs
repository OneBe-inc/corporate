import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {site,absolute} from '../src/config.mjs';
import {layout,pageDefinitions} from '../src/templates.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
if(path.dirname(out)!==root||path.basename(out)!=='dist')throw Error('Unsafe build output');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});fs.cpSync(path.join(root,'public'),out,{recursive:true});
const version=createHash('sha256').update(['site.css','site.js','form.mjs'].map(x=>fs.readFileSync(path.join(root,'public/assets',x),'utf8')).join('')).digest('hex').slice(0,12);
const pages=pageDefinitions();
for(const p of pages){const target=path.join(out,p.path.endsWith('.html')?p.path:p.path+'index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,layout(p,p.render()).replaceAll('?v='+site.updated,'?v='+version));}
fs.writeFileSync(path.join(out,'assets/site.js'),fs.readFileSync(path.join(out,'assets/site.js'),'utf8').replace("'./form.mjs'","'./form.mjs?v="+version+"'"));
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.writeFileSync(path.join(out,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+pages.filter(p=>!p.noindex).map(p=>'<url><loc>'+absolute(p.path)+'</loc><lastmod>'+site.updated+'</lastmod></url>').join('')+'</urlset>');
fs.mkdirSync(path.join(root,'ops'),{recursive:true});
fs.writeFileSync(path.join(root,'ops/pages.json'),JSON.stringify(pages.map(({path,title,description,noindex})=>({path,title,description,url:absolute(path),index:!noindex,canonical:absolute(path),source:'Approved OneBe design / supplied profile / user-provided email',updated:site.updated})),null,2));
console.log('Built '+pages.length+' HTML pages; '+pages.filter(p=>!p.noindex).length+' indexed URLs; '+version);
