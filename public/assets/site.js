import {normalizeDraft,validateDraft,isSuccess,readStored,topicOptions} from './form.mjs';
const $=(s,scope=document)=>scope.querySelector(s),base=document.body.dataset.base;
function initHeroFilm(){
  const video=$('#hero-video'),button=$('#hero-playback'),poster=$('.hero-poster');
  if(!video||!button||!poster)return;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=!motion.matches&&!navigator.connection?.saveData,userPaused=false,visible=true,ready=false,selected='';
  const source=()=>innerWidth<=767?video.dataset.mobile:innerWidth<=1199?video.dataset.tablet:video.dataset.pc;
  const still=()=>{video.hidden=true;poster.hidden=false;};
  const label=()=>{const playing=enabled&&!userPaused;button.textContent=playing?'一時停止':'再生';button.setAttribute('aria-label',playing?'FVの映像を一時停止':'FVの映像を再生');};
  function sync(){
    label();
    if(!ready||!enabled||userPaused||!visible||document.hidden){video.pause();return;}
    const next=source();
    if(next!==selected){selected=next;still();video.src=next;video.muted=true;}
    if(video.paused)video.play().catch(error=>{if(error.name==='AbortError')return;userPaused=true;still();label();});
  }
  button.addEventListener('click',()=>{if(enabled&&!userPaused)userPaused=true;else{enabled=true;userPaused=false;}sync();});
  video.addEventListener('playing',()=>{video.hidden=false;poster.hidden=true;});
  video.addEventListener('error',()=>{userPaused=true;selected='';video.pause();still();label();});
  motion.addEventListener('change',()=>{if(motion.matches){enabled=false;still();}sync();});
  document.addEventListener('visibilitychange',sync);
  let resizeTimer;
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(selected&&selected!==source()){video.pause();still();}sync();},150);});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(video.parentElement);
  button.hidden=false;
  Promise.resolve(window.onebeIntroReady).then(()=>{ready=true;sync();});
}
initHeroFilm();
let opener;
function showDialog(id,trigger){const dialog=document.getElementById(id+'-dialog');if(!dialog)return false;opener=trigger;dialog.showModal();document.body.classList.add('modal-open');return true;}
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-open]');if(trigger&&showDialog(trigger.dataset.open,trigger))event.preventDefault();const zoom=event.target.closest('[data-zoom]');if(zoom){$('#zoom-image').src=zoom.dataset.zoom;$('#zoom-image').alt=zoom.querySelector('img').alt;$('#zoom-caption').textContent=zoom.dataset.caption||'';showDialog('image',zoom);}const close=event.target.closest('.close-dialog');if(close)close.closest('dialog').close();});
document.querySelectorAll('dialog.dialog').forEach(dialog=>{dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');if(opener?.isConnected)opener.focus();});});
const filters=[...document.querySelectorAll('[data-filter]')];
filters.forEach(button=>button.addEventListener('click',()=>{const value=button.dataset.filter;filters.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});let count=0;document.querySelectorAll('[data-categories]').forEach(card=>{card.hidden=value!=='すべて'&&!card.dataset.categories.split('|').includes(value);if(!card.hidden)count++;});$('.result-count').textContent=count+'件の実績';$('#no-results').hidden=count>0;const search=new URLSearchParams(location.search);if(value==='すべて')search.delete('category');else search.set('category',value);history.replaceState(null,'',location.pathname+(search.size?'?'+search:'')+location.hash);}));
const selectedCategory=new URLSearchParams(location.search).get('category');if(selectedCategory)filters.find(b=>b.dataset.filter===selectedCategory)?.click();
const draftKey='onebe-contact-v1',receiptKey='onebe-receipt-v1';
function loadDraft(){try{const raw=sessionStorage.getItem(draftKey),draft=readStored(raw);if(raw&&!draft)sessionStorage.removeItem(draftKey);return draft;}catch{return null;}}
function saveDraft(data){sessionStorage.setItem(draftKey,JSON.stringify({savedAt:Date.now(),data:normalizeDraft(data)}));}
const form=$('#contact-form');
if(form){
  const getData=()=>{const fd=new FormData(form);return {company:fd.get('company'),name:fd.get('name'),email:fd.get('email'),message:fd.get('message'),topics:fd.getAll('topics'),budget:fd.get('budget'),consent:fd.has('consent'),website:fd.get('website')};};
  const saved=loadDraft();if(saved){for(const id of ['company','name','email','message','budget'])$('#'+id).value=saved[id];for(const input of form.querySelectorAll('[name=topics]'))input.checked=saved.topics.includes(input.value);$('#consent').checked=saved.consent;}
  const topic=new URLSearchParams(location.search).get('topic');if(topicOptions.includes(topic)){for(const input of form.querySelectorAll('[name=topics]'))if(input.value===topic)input.checked=true;$('#topic-notice').textContent='ご相談のテーマ：'+topic;$('#topic-notice').hidden=false;}
  const count=()=>$('#message-count').textContent=$('#message').value.length.toLocaleString()+' / 5,000';count();
  function clearError(id){const error=$('#'+id+'-error');if(error)error.textContent='';$('#'+id)?.removeAttribute('aria-invalid');}
  form.addEventListener('input',event=>{count();const id=event.target.name==='topics'?'topics':event.target.id;if(validateDraft(getData()).errors[id]===undefined)clearError(id);});
  form.addEventListener('submit',event=>{event.preventDefault();const {data,errors,valid}=validateDraft(getData());const summary=$('#form-errors');summary.replaceChildren();summary.hidden=true;for(const id of ['company','name','email','topics','message','consent'])clearError(id);
    if(!valid){summary.hidden=false;const p=document.createElement('p');p.textContent='入力内容をご確認ください。';summary.append(p);const ul=document.createElement('ul');for(const[id,text]of Object.entries(errors)){$('#'+id+'-error').textContent=text;const target=id==='topics'?'topic-0':id;$('#'+target).setAttribute('aria-invalid','true');const li=document.createElement('li'),a=document.createElement('a');a.href='#'+target;a.textContent=text;li.append(a);ul.append(li);}summary.append(ul);summary.focus();return;}
    try{saveDraft(data);location.assign(base+'contact/confirm/');}catch{summary.hidden=false;summary.textContent='このブラウザで入力内容を一時保存できません。ブラウザの設定をご確認いただくか、メールでご相談ください。';summary.focus();}
  });
}
const confirm=$('#confirmation');
if(confirm){const draft=loadDraft();if(!draft||!validateDraft(draft).valid){confirm.hidden=true;$('#missing-draft').hidden=false;}else{
  for(const[label,value]of [['会社名・屋号',draft.company||'未記入'],['お名前',draft.name],['メールアドレス',draft.email],['相談したいこと',draft.topics.join('、')],['ご相談内容',draft.message],['ご予算の目安',draft.budget]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);$('#confirmation-values').append(row);}
  let sending=false;$('#send-button').addEventListener('click',async()=>{if(sending)return;sending=true;const button=$('#send-button'),error=$('#send-error'),status=$('#sending-status');error.hidden=true;button.disabled=true;button.textContent='送信しています…';status.textContent='送信が完了するまでお待ちください。';$('#edit-link').setAttribute('aria-disabled','true');const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{if(draft.website)throw Error('送信内容を確認できませんでした。フォームから入力し直してください。');const result=await fetch(document.body.dataset.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({company:draft.company,name:draft.name,email:draft.email,'相談したいこと':draft.topics.join('、'),message:draft.message,'予算':draft.budget,'個人情報の取扱いへの同意':'同意済み',_subject:'【OneBe】サイトからのご相談',_template:'table',_honey:draft.website}),signal:controller.signal});const response=await result.json();if(!result.ok||!isSuccess(response))throw Error('送信を完了できませんでした。時間をおいて再試行するか、info@onebe-create.comへご連絡ください。');try{sessionStorage.setItem(receiptKey,String(Date.now()));sessionStorage.removeItem(draftKey);}catch{}location.assign(base+'thanks/');
    }catch(err){error.hidden=false;error.textContent=err.name==='AbortError'?'送信結果を確認できませんでした。重複送信を避けるため、少し時間をおいてご確認ください。入力内容は保持しています。':err.message||'通信に失敗しました。入力内容は保持しています。再試行してください。';error.focus();button.disabled=false;button.textContent='もう一度送信する';status.textContent='';sending=false;$('#edit-link').removeAttribute('aria-disabled');}finally{clearTimeout(timeout);}
  });$('#edit-link').addEventListener('click',event=>{if(sending)event.preventDefault();});
}}
if($('#receipt')){try{const received=Number(sessionStorage.getItem(receiptKey));if(received&&Date.now()-received<86400000){$('#receipt').hidden=false;$('#thanks-direct').hidden=true;}}catch{}}

function initHeadingShuffle() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const running = new Map();
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('ja', {granularity: 'grapheme'}) : null;
  const glyphs = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    japanese: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロ',
  };

  function finish(heading) {
    const state = running.get(heading);
    if (!state) return;
    cancelAnimationFrame(state.frame);
    heading.replaceChildren(...state.originalNodes);
    heading.classList.remove('is-shuffling');
    running.delete(heading);
  }

  function play(heading) {
    const originalNodes = [...heading.childNodes];
    const source = document.createElement('span');
    source.className = 'heading-shuffle-source';
    source.append(...originalNodes);
    const visual = source.cloneNode(true);
    visual.className = 'heading-shuffle-visual';
    visual.setAttribute('aria-hidden', 'true');
    visual.setAttribute('inert', '');
    visual.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));

    // The original text stays in the accessibility tree and reserves its layout.
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const runs = [];
    let node, count = 0;
    while ((node = walker.nextNode())) {
      const characters = segmenter
        ? [...segmenter.segment(node.data)].map(item => item.segment) : Array.from(node.data);
      const tokens = characters.map(character => {
        const pool = /^[A-Z]$/.test(character) ? glyphs.upper
          : /^[a-z]$/.test(character) ? glyphs.lower
          : /^[0-9]$/.test(character) ? glyphs.number
          : /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(character) ? glyphs.japanese : '';
        return {character, pool, index: pool ? count++ : -1};
      });
      runs.push({node, tokens});
    }
    if (!count) { heading.append(...originalNodes); return; }

    const state = {originalNodes, frame: 0};
    running.set(heading, state);
    heading.append(source, visual);
    heading.classList.add('is-shuffling');
    const started = performance.now();
    const duration = 780;
    let previous = -Infinity;

    function update(now) {
      const elapsed = now - started;
      if (elapsed >= duration || reducedMotion.matches || document.hidden) {
        finish(heading);
        return;
      }
      if (now - previous >= 55) {
        const resolved = Math.floor(count * Math.max(0, (elapsed - 150) / (duration - 150)));
        for (const {node, tokens} of runs) {
          node.data = tokens.map(({character, pool, index}) =>
            !pool || index < resolved ? character : pool[Math.floor(Math.random() * pool.length)]
          ).join('');
        }
        previous = now;
      }
      state.frame = requestAnimationFrame(update);
    }
    update(started);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.35) continue;
      observer.unobserve(entry.target);
      if (!reducedMotion.matches) play(entry.target);
    }
  }, {threshold: 0.35, rootMargin: '0px 0px -8% 0px'});
  document.querySelectorAll('h2').forEach(heading => observer.observe(heading));

  const finishAll = () => [...running.keys()].forEach(finish);
  window.addEventListener('resize', finishAll, {passive: true});
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishAll(); });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) { observer.disconnect(); finishAll(); }
  });
}
Promise.resolve(window.onebeIntroReady).then(initHeadingShuffle);
