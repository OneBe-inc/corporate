import fs from 'node:fs';
import {responseHeaders} from '../src/security-policy.mjs';
const directory='reports/security';fs.mkdirSync(directory,{recursive:true});
const transform={ref:'onebe_security_headers_v1',description:'OneBe security response headers',enabled:false,expression:'http.host eq "onebe-create.com"',action:'rewrite',action_parameters:{headers:Object.fromEntries(Object.entries(responseHeaders()).map(([k,value])=>[k.toLowerCase(),{operation:'set',value}]))}};
const probe={ref:'onebe_sensitive_paths_v1',description:'OneBe private-file probes and labeled verification path',enabled:false,expression:'(http.host eq "onebe-create.com" and (http.request.uri.path in {"/.env" "/wp-config.php" "/__onebe_security_probe__"} or starts_with(http.request.uri.path, "/.git/")))',action:'block'};
fs.writeFileSync(directory+'/cloudflare-rules-draft.json',JSON.stringify({state:'DRAFT_NOT_APPLIED',notes:['Merge by ref into existing rulesets; never replace unrelated rules.','Requires an active proxied DNS zone. Preserve every DNS record, especially email.','Enable only after staging review; a probe event demonstrates logging, not a real attack.'],responseTransform:transform,customFirewallRule:probe},null,2)+'\n');
console.log('Prepared disabled rules in '+directory+'/cloudflare-rules-draft.json; no API calls made.');
