import {normalizeDraft,validateDraft,isSuccess,readStored,topicOptions} from './form.mjs';
const $=(s,scope=document)=>scope.querySelector(s),base=document.body.dataset.base;

// Shared latest-selection-wins fade for in-page content switches.
function fadeSwitcher(results,owner=results){
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let revision=0,animation,latest;
 async function change(apply,immediate=false){
  latest=apply;const current=++revision,opacity=getComputedStyle(results).opacity;animation?.cancel();
  if(immediate||motion.matches||!results.animate){apply();results.inert=false;owner.removeAttribute('aria-busy');return;}
  results.inert=true;owner.setAttribute('aria-busy','true');
  try{animation=results.animate([{opacity},{opacity:0}],{duration:140,easing:'ease-out',fill:'forwards'});await animation.finished;if(current!==revision)return;apply();animation.cancel();animation=results.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out',fill:'forwards'});await animation.finished;}
  catch{/* Superseded transitions are cancelled. */}
  finally{if(current===revision){animation?.cancel();results.inert=false;owner.removeAttribute('aria-busy');}}
 }
 motion.addEventListener('change',()=>{if(motion.matches&&latest)change(latest,true);});return change;
}

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
if(filters.length){
 const grid=$('#works-grid'),empty=$('#no-results'),results=document.createElement('div');grid.before(results);results.append(grid,empty);
 const fade=fadeSwitcher(results);let selected='すべて';
 function select(value,immediate=false){selected=value;filters.forEach(b=>{const active=b.dataset.filter===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const search=new URLSearchParams(location.search);if(value==='すべて')search.delete('category');else search.set('category',value);history.replaceState(null,'',location.pathname+(search.size?'?'+search:'')+location.hash);
  fade(()=>{const all=value==='すべて';$('[data-company-works]').hidden=!all;$('.deliverable-grid').hidden=all;let count=all?document.querySelectorAll('[data-company-works] .work-card').length:0;document.querySelectorAll('[data-deliverable-category]').forEach(card=>{card.hidden=all||card.dataset.deliverableCategory!==value;if(!card.hidden)count++;});$('.result-count').textContent=count+(all?'件の実績':'件の制作物');empty.hidden=count>0;},immediate);
 }
 filters.forEach(button=>button.addEventListener('click',()=>{if(selected!==button.dataset.filter)select(button.dataset.filter);}));
 const raw=new URLSearchParams(location.search).get('category');const initial=raw==='紙・サイン'?'紙':raw==='空間'?'サイン・空間':raw;if(filters.some(b=>b.dataset.filter===initial))select(initial,true);
}
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
    try{saveDraft(data);navigateWithFade(base+'contact/confirm/');}catch{summary.hidden=false;summary.textContent='このブラウザで入力内容を一時保存できません。ブラウザの設定をご確認いただくか、メールでご相談ください。';summary.focus();}
  });
}
const confirm=$('#confirmation');
if(confirm){const draft=loadDraft();if(!draft||!validateDraft(draft).valid){confirm.hidden=true;$('#missing-draft').hidden=false;}else{
  for(const[label,value]of [['会社名・屋号',draft.company||'未記入'],['お名前',draft.name],['メールアドレス',draft.email],['相談したいこと',draft.topics.join('、')],['ご相談内容',draft.message],['ご予算の目安',draft.budget]]){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;row.append(dt,dd);$('#confirmation-values').append(row);}
  let sending=false;$('#send-button').addEventListener('click',async()=>{if(sending)return;sending=true;const button=$('#send-button'),error=$('#send-error'),status=$('#sending-status');error.hidden=true;button.disabled=true;button.textContent='送信しています…';status.textContent='送信が完了するまでお待ちください。';$('#edit-link').setAttribute('aria-disabled','true');const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{if(draft.website)throw Error('送信内容を確認できませんでした。フォームから入力し直してください。');const result=await fetch(document.body.dataset.formEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({company:draft.company,name:draft.name,email:draft.email,'相談したいこと':draft.topics.join('、'),message:draft.message,'予算':draft.budget,'個人情報の取扱いへの同意':'同意済み',_subject:'【OneBe】サイトからのご相談',_template:'table',_honey:draft.website}),signal:controller.signal});const response=await result.json();if(!result.ok||!isSuccess(response))throw Error('送信を完了できませんでした。時間をおいて再試行するか、info@onebe-create.comへご連絡ください。');try{window.onebeTrackLead?.();}catch{}try{sessionStorage.setItem(receiptKey,String(Date.now()));sessionStorage.removeItem(draftKey);}catch{}navigateWithFade(base+'thanks/');
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

// Manual featured works: no timer or automatic rotation.
document.querySelectorAll('.works-carousel').forEach(carousel=>{
 const slides=[...carousel.querySelectorAll('.works-slide')],thumbs=[...carousel.querySelectorAll('[data-slide]')];let index=0,start;
 const fade=fadeSwitcher(carousel.querySelector('.works-slides'));
 const show=n=>{index=(n+slides.length)%slides.length;const next=index;thumbs.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===next)));fade(()=>{slides.forEach((s,i)=>s.hidden=i!==next);carousel.querySelector('.carousel-count').textContent=String(next+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');});};
 thumbs.forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.slide))));
 carousel.querySelectorAll('[data-carousel-step]').forEach(b=>b.addEventListener('click',()=>show(index+Number(b.dataset.carouselStep))));
 carousel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}});
 carousel.addEventListener('touchstart',event=>{const t=event.touches[0];start={x:t.clientX,y:t.clientY};},{passive:true});
 carousel.addEventListener('touchend',event=>{if(!start)return;const t=event.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)show(index+(dx<0?1:-1));start=null;},{passive:true});
 carousel.addEventListener('touchcancel',()=>{start=null;},{passive:true});
});
document.querySelectorAll('.journal').forEach(journal=>{
 const buttons=[...journal.querySelectorAll('[data-journal-filter]')],cards=[...journal.querySelectorAll('[data-journal-kind]')],empty=journal.querySelector('.journal-empty');
 const results=document.createElement('div');results.className='journal-results';
 journal.querySelector('.blog-grid').before(results);results.append(journal.querySelector('.blog-grid'),empty);
 const fade=fadeSwitcher(results,journal);let selected='すべて';
 const apply=category=>{let count=0;cards.forEach(card=>{const match=category==='すべて'||card.dataset.journalKind===category;card.hidden=!match||count>=Number(journal.dataset.limit);if(match)count++;});empty.hidden=count>0;empty.textContent=count?'':category+'は、公開後にこちらへ掲載します。';};
 buttons.forEach(button=>button.addEventListener('click',()=>{const category=button.dataset.journalFilter;if(category===selected)return;selected=category;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));fade(()=>apply(category));}));
});

let pageLeaving=false,pageExitAnimation;
function navigateWithFade(href){
 if(pageLeaving)return;const motion=matchMedia('(prefers-reduced-motion: reduce)');
 if(motion.matches||!document.body.animate){location.assign(href);return;}
 pageLeaving=true;
 pageExitAnimation=document.body.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-out',fill:'forwards'});
 const go=()=>{try{sessionStorage.setItem('onebe-page-enter',String(Date.now()));}catch{}location.assign(href);};
 pageExitAnimation.finished.then(go,go);
 setTimeout(()=>{pageExitAnimation?.cancel();pageLeaving=false;},2000);
}
document.addEventListener('click',event=>{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const anchor=event.target.closest('a[href]');if(!anchor||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
 const target=new URL(anchor.href,location.href);
 if(target.origin!==location.origin||!target.pathname.startsWith(base)||(target.pathname===location.pathname&&target.search===location.search))return;
 event.preventDefault();navigateWithFade(target.href);
});
window.addEventListener('pageshow',event=>{
 pageExitAnimation?.cancel();pageLeaving=false;
 const back=event.persisted||performance.getEntriesByType('navigation')[0]?.type==='back_forward';
 if(back&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('page-enter');setTimeout(()=>document.documentElement.classList.remove('page-enter'),300);}
});

// Tablet navigation is an ordinary side navigation, not a modal dialog.
(()=>{
 const toggle=document.querySelector('.menu-toggle'),source=document.querySelector('#menu-dialog .menu-links');if(!toggle||!source)return;
 const tablet=matchMedia('(min-width:768px) and (max-width:1199px)');
 const panel=document.createElement('aside');panel.id='tablet-navigation';panel.className='tablet-navigation';panel.hidden=true;
 panel.setAttribute('aria-label','サイトメニュー');
 panel.innerHTML='<div class="tablet-menu-top"><span>MENU</span><button type="button" class="icon-button" aria-label="メニューを閉じる">×</button></div>';
 const nav=source.cloneNode(true);nav.className='tablet-menu-links';nav.setAttribute('aria-label','タブレットナビゲーション');
 for(const a of nav.querySelectorAll('a'))if(new URL(a.href).pathname===location.pathname)a.setAttribute('aria-current','page');
 panel.append(nav);const foot=document.createElement('div');foot.className='tablet-menu-foot';foot.innerHTML='<a href="mailto:info@onebe-create.com">info@onebe-create.com</a><a href="'+base+'privacy/">プライバシーポリシー</a>';panel.append(foot);document.body.append(panel);
 let open=false,timer;
 function setOpen(value,restore=false){clearTimeout(timer);open=value;toggle.setAttribute('aria-expanded',String(value));if(value){panel.hidden=false;panel.inert=false;requestAnimationFrame(()=>{if(open){document.body.classList.add('tablet-menu-open');panel.querySelector('button').focus({preventScroll:true});}});}else{document.body.classList.remove('tablet-menu-open');panel.inert=true;timer=setTimeout(()=>panel.hidden=true,280);if(restore)toggle.focus({preventScroll:true});}}
 function sync(){if(open)setOpen(false);if(tablet.matches){toggle.removeAttribute('data-open');toggle.removeAttribute('aria-haspopup');toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');const dialog=document.querySelector('#menu-dialog');if(dialog.open)dialog.close();}else{toggle.dataset.open='menu';toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-controls','menu-dialog');toggle.removeAttribute('aria-expanded');}}
 toggle.addEventListener('click',()=>{if(tablet.matches)setOpen(!open);});
 panel.querySelector('button').addEventListener('click',()=>setOpen(false,true));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&open){event.preventDefault();setOpen(false,true);}});
 tablet.addEventListener('change',sync);window.addEventListener('pageshow',()=>{if(open)setOpen(false);});sync();
})();

// Phone navigation follows the approved typographic side-panel design.
(()=>{
 const toggle=document.querySelector('.menu-toggle');if(!toggle)return;
 const phone=matchMedia('(max-width:767px)'),panel=document.createElement('aside');
 panel.id='phone-navigation';panel.className='phone-navigation';panel.hidden=true;panel.setAttribute('aria-label','サイトメニュー');
 const links=[['','ホーム','HOME','home'],['works/','実績','SELECTED WORKS','works'],['services/','支援内容','SERVICES','services'],['about/','OneBeについて','ABOUT US','about']];
 panel.innerHTML='<div class="phone-menu-top"><img src="'+base+'assets/logo.png" alt="OneBe" width="105" height="26"><button type="button" aria-label="メニューを閉じる"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 4 12 12M16 4 4 16"/></svg></button></div><p class="phone-menu-label">EXPLORE ONEBE</p><nav aria-label="スマホナビゲーション">'+links.map(([path,title,en,kind],i)=>'<a href="'+base+path+'" class="phone-item '+kind+'" style="--order:'+i+'" '+(location.pathname===base+path?'aria-current="page"':'')+'><span class="phone-num" aria-hidden="true">'+(i?'0'+i:'•')+'</span><span><span class="phone-title">'+title+'</span><span class="phone-en">'+en+'</span></span></a>').join('')+'</nav><div class="phone-menu-bottom"><a class="phone-contact" href="'+base+'contact/"><span><small>LET’S TALK</small><strong>ブランドについて<br>相談する</strong></span><span class="phone-arrow" aria-hidden="true">↗</span></a><a class="phone-email" href="mailto:info@onebe-create.com">info@onebe-create.com</a><div class="phone-foot"><a href="'+base+'privacy/">プライバシーポリシー</a><span>© 2026 OneBe</span></div></div>';
 document.body.append(panel);let open=false,timer;
 const background=[...document.querySelectorAll('body>main,body>.site-header,body>.site-footer')];
 function setOpen(value,restore=false){clearTimeout(timer);open=value;toggle.setAttribute('aria-expanded',String(value));background.forEach(el=>el.inert=value);if(value){panel.hidden=false;panel.inert=false;panel.getBoundingClientRect();document.body.classList.add('phone-menu-open');panel.querySelector('button').focus({preventScroll:true});}else{document.body.classList.remove('phone-menu-open');panel.inert=true;timer=setTimeout(()=>panel.hidden=true,300);if(restore&&phone.matches)toggle.focus({preventScroll:true});}}
 function sync(){if(open)setOpen(false);if(phone.matches){toggle.removeAttribute('data-open');toggle.removeAttribute('aria-haspopup');toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');const old=document.querySelector('#menu-dialog');if(old.open)old.close();}}
 toggle.addEventListener('click',()=>{if(phone.matches)setOpen(!open);});panel.querySelector('button').addEventListener('click',()=>setOpen(false,true));
 document.addEventListener('keydown',event=>{if(!open)return;if(event.key==='Escape'){event.preventDefault();setOpen(false,true);}if(event.key==='Tab'){const items=[...panel.querySelectorAll('button,a[href]')],first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
 phone.addEventListener('change',sync);window.addEventListener('pageshow',()=>{if(open)setOpen(false);});sync();
})();
