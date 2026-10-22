import {createHash} from 'node:crypto';
import {parse} from 'parse5';

export function inlineScriptHashes(html){
 const hashes=new Set();
 function visit(node){
  if(node.tagName==='script'&&!node.attrs.some(a=>a.name==='src')){
   const content=(node.childNodes||[]).map(n=>n.value||'').join('');
   hashes.add("'sha256-"+createHash('sha256').update(content).digest('base64')+"'");
  }
  for(const child of node.childNodes||[])visit(child);
 }
 visit(parse(html));return [...hashes].sort();
}

export function contentSecurityPolicy(hashes=[]){
 return ["default-src 'none'",["script-src 'self' https://www.googletagmanager.com",...hashes].join(' '),"style-src 'self' 'unsafe-inline'","img-src 'self' data: https://assets.st-note.com https://*.google-analytics.com https://www.googletagmanager.com","font-src 'self'","media-src 'self'","connect-src 'self' https://formsubmit.co https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com","object-src 'none'","frame-src 'none'","base-uri 'none'","form-action 'none'"].join('; ');
}

export function protectHtml(html){
 const csp=contentSecurityPolicy(inlineScriptHashes(html));
 const safe=csp.replaceAll('&','&amp;').replaceAll('"','&quot;');
 // Put the policy before any script; frame-ancestors must be an HTTP header.
 return html.replace(/<meta charset="UTF-8">/i,match=>match+'<meta http-equiv="Content-Security-Policy" content="'+safe+'"><meta name="referrer" content="strict-origin-when-cross-origin">');
}

export function responseHeaders(){
 return {
  'Content-Security-Policy':"frame-ancestors 'none'; object-src 'none'; base-uri 'none'",
  'X-Frame-Options':'DENY',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'strict-origin-when-cross-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  // Short initial lifetime; no subdomain or preload commitment.
  'Strict-Transport-Security':'max-age=86400'
 };
}
