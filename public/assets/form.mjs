export const inquiryTypes=['制作依頼・お見積もり','制作中・納品後のご相談','営業・サービスのご提案','取材・協業のご相談','その他のお問い合わせ'];
export const multipleTopic='複数の制作・サービスをまとめて相談';
export const topicOptions=['ロゴ制作','名刺制作','チラシ・ポスター制作','ブランドの方向性','ロゴ・印刷物などの制作','Webサイト制作','創業パッケージ','定額Webサービス','OneBeレター',multipleTopic,'まだ決まっていない','その他'];
export const needsServiceTopic=type=>inquiryTypes.slice(0,2).includes(type);
export function normalizeDraft(data){return {company:String(data.company||'').trim(),name:String(data.name||'').trim(),email:String(data.email||'').trim(),inquiryType:inquiryTypes.includes(data.inquiryType)?data.inquiryType:'',topics:needsServiceTopic(data.inquiryType)&&Array.isArray(data.topics)?[...new Set(data.topics.filter(x=>topicOptions.includes(x)))]:[],message:String(data.message||'').trim(),budget:data.budget==='相談内容に記載する'?'相談内容に記載する':'未定・相談したい',consent:data.consent===true,website:String(data.website||'')};}
export function validateDraft(input){const data=normalizeDraft(input),errors={};if(!data.name||data.name.length>100)errors.name='お名前を100文字以内で入力してください。';if(data.company.length>100)errors.company='会社名・屋号を100文字以内で入力してください。';if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.email.length>254)errors.email='メールアドレスを正しく入力してください。';if(!data.inquiryType)errors.inquiryType='お問い合わせの種類を選択してください。';if(needsServiceTopic(data.inquiryType)&&!data.topics.length)errors.topics='制作・サービスを選択してください。';if(!data.message||data.message.length>5000)errors.message='ご相談内容を5,000文字以内で入力してください。';if(!data.consent)errors.consent='プライバシーポリシーへの同意が必要です。';return {data,errors,valid:Object.keys(errors).length===0};}
export function isSuccess(response){return !!response&&(response.success===true||response.success==='true');}
export function readStored(raw,now=Date.now()){try{const entry=JSON.parse(raw);if(!entry||typeof entry.savedAt!=='number'||entry.savedAt>now||now-entry.savedAt>86400000)return null;return normalizeDraft({...entry.data,inquiryType:entry.data.inquiryType??inquiryTypes[0]});}catch{return null;}}

const serviceCodes={'ロゴ制作':'logo','名刺制作':'business_card','チラシ・ポスター制作':'flyer','ブランドの方向性':'brand_direction','ロゴ・印刷物などの制作':'graphic','Webサイト制作':'web','創業パッケージ':'startup','定額Webサービス':'monthly','OneBeレター':'letter',[multipleTopic]:'multiple','まだ決まっていない':'undecided','その他':'other'};
const inquiryCodes=['production','existing_project','sales_proposal','media_partnership','other'];
export function acceptedLeadEvent(ok,response,topics,inquiryType=inquiryTypes[0]){
 if(!ok||!isSuccess(response))return null;
 const codes=[...new Set((Array.isArray(topics)?topics:[]).map(topic=>Object.hasOwn(serviceCodes,topic)?serviceCodes[topic]:null).filter(Boolean))].sort();
 const serviceType=needsServiceTopic(inquiryType)?(codes.length===1?codes[0]:codes.length?'multiple':'other'):'not_applicable';
 return {form_id:'corporate_contact',inquiry_type:inquiryCodes[inquiryTypes.indexOf(inquiryType)]||'unspecified',service_type:serviceType,service_types:needsServiceTopic(inquiryType)?codes.join(',')||'other':'not_applicable',transport_type:'beacon'};
}
export function contactPayload(input){const data=normalizeDraft(input);return {company:data.company,name:data.name,email:data.email,'お問い合わせ区分':data.inquiryType,'相談したいこと':data.topics.join('、')||'該当なし',message:data.message,'予算':data.budget,'個人情報の取扱いへの同意':'同意済み',_subject:'【OneBe】'+data.inquiryType+(data.topics.length?'｜'+data.topics.join('・'):''),_template:'table',_honey:data.website};}
