import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const query=`query SecurityEvents($zoneTag: string, $filter: FirewallEventsAdaptiveFilter_InputObject) {
 viewer { zones(filter: {zoneTag: $zoneTag}) {
  firewallEventsAdaptive(filter: $filter, limit: 1000, orderBy: [datetime_DESC]) {
   action clientCountryName clientRequestPath datetime source
  }
 } }
}`;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function summarize(events){
 if(!Array.isArray(events))throw Error('Invalid security event response; do not treat as zero events');
 const actions={};for(const e of events){actions[e.action]=(actions[e.action]||0)+1;}
 return {returnedEvents:events.length,limitReached:events.length>=1000,actions,classification:'Security detections and actions; not evidence of a successful intrusion',coverage:'Cloudflare-proxied traffic only. Adaptive data may be sampled. Up to 1000 returned events; counts are not complete request totals.'};
}

export async function createReport({token,zone,since,until,output,fetcher=fetch}){
 if(!token||!/^[a-f0-9]{32}$/i.test(zone||''))throw Error('Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID locally; never commit or paste tokens into reports');
 const start=new Date(since),end=new Date(until);
 if(!Number.isFinite(+start)||!Number.isFinite(+end)||start>=end||end-start>86400000)throw Error('Choose a valid window of at most 24 hours');
 const response=await fetcher('https://api.cloudflare.com/client/v4/graphql',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({query,variables:{zoneTag:zone,filter:{datetime_geq:start.toISOString(),datetime_leq:end.toISOString()}}}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error('Cloudflare API failed: HTTP '+response.status);
 const body=await response.json();if(body.errors?.length)throw Error('Cloudflare returned a query or permission error; report not generated');
 const zones=body.data?.viewer?.zones;if(!Array.isArray(zones)||zones.length!==1)throw Error('Zone unavailable; report not generated');
 const events=zones[0].firewallEventsAdaptive,summary=summarize(events);
 const report={generatedAt:new Date().toISOString(),since:start.toISOString(),until:end.toISOString(),zone,...summary,events};
 const folder=path.resolve(output);await fs.mkdir(folder,{recursive:true});
 const name='security-'+end.toISOString().replace(/[:.]/g,'-');
 await fs.writeFile(path.join(folder,name+'.json'),JSON.stringify(report,null,2));
 const html=`<!doctype html><html lang="ja"><meta charset="utf-8"><title>OneBe セキュリティイベント</title><style>body{font:16px/1.8 system-ui;max-width:1000px;margin:40px auto;padding:0 20px}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid #ddd;padding:9px;text-align:left;overflow-wrap:anywhere}</style><h1>セキュリティイベント確認</h1><p>${escape(report.since)} ～ ${escape(report.until)} UTC</p><p>取得イベント：${events.length}件。これは攻撃成功件数ではありません。抽出・サンプリングされた検知記録のため、0件でも攻撃なしとは判断しません。${summary.limitReached?'取得上限に到達しました。時間を短くして再取得してください。':''}</p><p>生のIP・クエリ文字列・User-Agent・フォーム本文はこのレポートへ取得しません。Cloudflareを経由しない通信、導入前の履歴、サービス側の保持期限外は対象外です。</p><h2>処理の内訳</h2><ul>${Object.entries(summary.actions).map(([a,n])=>'<li>'+escape(a)+'：'+n+'件</li>').join('')}</ul><table><thead><tr><th>日時 UTC</th><th>処理</th><th>検知元</th><th>国</th><th>パス</th></tr></thead><tbody>${events.map(e=>'<tr>'+[e.datetime,e.action,e.source,e.clientCountryName,e.clientRequestPath].map(v=>'<td>'+escape(v)+'</td>').join('')+'</tr>').join('')}</tbody></table></html>`;
 await fs.writeFile(path.join(folder,name+'.html'),html);return {file:path.join(folder,name+'.html'),...summary};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const until=new Date().toISOString(),since=new Date(Date.now()-86400000).toISOString();
 const result=await createReport({token:process.env.CLOUDFLARE_API_TOKEN,zone:process.env.CLOUDFLARE_ZONE_ID,since:process.env.SECURITY_SINCE||since,until:process.env.SECURITY_UNTIL||until,output:process.env.SECURITY_REPORT_DIR||'reports/security-events'});console.log(JSON.stringify(result));
}
