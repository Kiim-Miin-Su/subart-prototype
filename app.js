(() => {
  'use strict';

  const books = window.SubartCatalog;
  const storageKey = 'subart.prototype.v1';
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>',
    books:'<path d="M3 3h4v17H3zm6 0h4v17H9zm6 2 3.5-1 3.3 15.3-3.5.8z"/>',
    book:'<path d="M3 4c3.4-.6 6.4.3 9 2.5 2.6-2.2 5.6-3.1 9-2.5v14c-3.4-.6-6.4.2-9 2.5C9.4 18.2 6.4 17.4 3 18zM12 6.5v14"/>',
    bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.8"/><path d="m16 16 5 5"/>',
    community:'<path d="M3 4h18v13H10l-6 4v-4H3zm4 5h10m-10 4h6"/>',
    arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>','arrow-left':'<path d="M21 12H4m6-6-6 6 6 6"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>','chevron-down':'<path d="m6 9 6 6 6-6"/>',
    plus:'<path d="M12 4v16M4 12h16"/>', check:'<path d="m4 12 5 5L20 6"/>',
    close:'<path d="m5 5 14 14M19 5 5 19"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    settings:'<path d="M3 6h5m5 0h8M3 18h9m5 0h4"/><circle cx="10.5" cy="6" r="2.5"/><circle cx="14.5" cy="18" r="2.5"/>',
    pen:'<path d="m4 20 1-5L16 4l4 4L9 19zM14 6l4 4"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.7-7 8-7s8 2.5 8 7"/>',
    flag:'<path d="M5 21V4m0 1c5-4 8 2 14-1v10c-6 3-9-3-14 1"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    download:'<path d="M12 2v13m-5-5 5 5 5-5M3 18v3h18v-3"/>',
    heart:'<path d="M12 20 3.9 12a5.2 5.2 0 0 1 7.4-7.3l.7.9.8-.9a5.2 5.2 0 0 1 7.4 7.3z"/>',
    more:'<circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',filter:'<path d="M3 5h18M6 12h12M9 19h6"/>',
    mail:'<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m2 5 10 8 10-8"/>'
  };
  function icon(name, size=20) {
    const shape = icons[name === 'edit' ? 'pen' : name] || '';
    return '<svg aria-hidden="true" width="'+Number(size)+'" height="'+Number(size)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">'+shape+'</svg>';
  }
  const escapes={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => escapes[c]);
  const initial = {
    saved:['station','garden'], following:[],
    progress:{moon:{episode:0,version:'v2',paragraph:3,percent:38,updated:Date.UTC(2026,10,23)}},
    feedback:[{id:'seed-letter',bookId:'moon',episode:0,author:'단추',text:'우편함 앞에서 한참 기다리는 모습이 더 선명하게 떠올라요.',created:Date.UTC(2026,10,17)}],
    reports:[],subscribed:false
  };
  function load() {
    try {
      const raw=JSON.parse(localStorage.getItem(storageKey));
      if (!raw || typeof raw!=='object' || Array.isArray(raw)) return initial;
      const result={...initial,...raw};
      for(const key of ['saved','following','feedback','reports']) if (!Array.isArray(result[key])) result[key]=initial[key];
      if (!result.progress || typeof result.progress!=='object' || Array.isArray(result.progress)) result.progress=initial.progress;
      return result;
    } catch {return initial;}
  }
  const state=load();
  const main=document.getElementById('app-content');
  const spaces=document.getElementById('spaces');
  const dialog=document.getElementById('search-dialog');
  let currentRoute='';
  let timer;
  function notify(text) {
    const live=document.getElementById('status-message');
    live.textContent=text;
    live.classList.add('shown');
    clearTimeout(timer);
    timer=setTimeout(()=>live.classList.remove('shown'),3200);
  }
  function save() {
    try {localStorage.setItem(storageKey,JSON.stringify(state));return true;}
    catch {notify('이 브라우저에서 저장 공간을 사용할 수 없어 현재 창에서만 유지합니다.');return false;}
  }
  function readHash() {
    return (location.hash.slice(1) || 'home').split('/').map(s=>{try{return decodeURIComponent(s);}catch{return s;}});
  }
  function go(hash) {
    const next='#'+String(hash).replace(/^#/,'');
    if (next===location.hash) render();
    else location.hash=next;
  }
  function visible(book) {
    return book.published!==false && !(book.id==='moon' && window.SubartWorkspace?.isWithdrawn?.());
  }
  function galleryCard(book) {
    const marked=state.saved.includes(book.id);
    return '<article class="shelf-card"><a href="#read/'+book.id+'/1" class="jacket '+book.id+'" aria-label="'+escape(book.title)+' 첫 화 읽기"><picture><source media="(min-width:701px)" srcset="./assets/'+book.id+'-wide.svg"><img alt="" src="'+book.cover+'" loading="lazy"></picture></a>'+
      '<button class="shelf-save'+(marked?' selected':'')+'" type="button" data-save="'+book.id+'" aria-pressed="'+marked+'" aria-label="'+escape(book.title)+' 서재에 저장">'+icon('bookmark',17)+'</button>'+
      '<div class="shelf-copy"><div><h3><a href="#read/'+book.id+'/1">'+escape(book.title)+'</a></h3><p>'+escape(book.author)+'<span>·</span>'+escape(book.genre)+'</p></div><a href="#read/'+book.id+'/1" class="open-book" aria-label="'+escape(book.title)+' 펼치기">'+icon('arrow',20)+'</a></div></article>';
  }
  function home() {
    const available=books.filter(visible);
    const feature=available[0];
    if (!feature) return '<div class="catalog-home"><h1>편집자의 서가</h1><p>현재 공개 중인 작품이 없습니다.</p></div>';
    const followed=state.following.includes(feature.author);
    const first=feature.episodes[0];
    return '<div class="catalog-home"><section class="feature" aria-labelledby="featured-title"><div class="feature-copy">'+
      '<div class="feature-kicker"><i aria-hidden="true"></i>편집자의 서가</div>'+
      '<p class="edition"><span>'+escape(feature.genre)+'</span><span>연재 중</span></p>'+
      '<h1 id="featured-title">'+escape(feature.title)+'</h1><p class="feature-author">'+escape(feature.author)+' 지음</p>'+
      '<p class="feature-blurb">'+escape(feature.blurb)+'</p><div class="feature-actions">'+
      '<a class="feature-read" href="#read/'+feature.id+'/1">'+icon('book',19)+'첫 화 읽기'+icon('arrow',18)+'</a>'+
      '<button type="button" class="feature-follow" data-follow="'+escape(feature.author)+'" aria-pressed="'+followed+'">'+icon(followed?'check':'plus',16)+(followed?'팔로잉':'작가 팔로우')+'</button></div></div>'+
      '<a class="feature-art '+feature.id+'" href="#read/'+feature.id+'/1" aria-label="'+escape(feature.title)+' 첫 화 '+escape(first.title)+'"><img src="'+feature.cover+'" '+(feature.id==='moon'?'srcset="./assets/moon-small.webp 680w, ./assets/moon.webp 1254w" sizes="(max-width:700px) calc(100vw - 40px), (min-width:1456px) 690px, 48vw" ':'')+'alt="'+(feature.id==='moon'?'보름달 아래 붉은 우편함과 불이 켜진 우체국':escape(feature.title)+' 표지')+'" fetchpriority="high"></a></section>'+
      '<section class="shelf" aria-labelledby="shelf-title"><div class="shelf-heading"><h2 id="shelf-title">다음에 펼칠 작품</h2><span>작품 '+(available.length-1)+'편</span></div><div class="shelf-grid">'+available.slice(1).map(galleryCard).join('')+'</div></section></div>';
  }
  const names={home:'홈',library:'내 서재',community:'커뮤니티',read:'작품 읽기',subscribe:'구독권 선택',account:'구독 관리',report:'신고',studio:'창작자 작업실',ops:'운영 콘솔'};
  function render() {
    let parts=readHash();
    if(parts[0]==='app-content') parts=['home'];
    const route=parts[0], known=Object.hasOwn(names,route);
    const path=parts.join('/');
    const moved=path!==currentRoute;
    const first=!currentRoute;
    window.SubartReader?.leave?.();
    currentRoute=path;
    const isHome=route==='home';
    const workspace=['studio','ops'].includes(route);
    document.body.dataset.theme=isHome?'dark':'light';
    document.body.dataset.page=route;
    document.querySelector('meta[name="theme-color"]').content=isHome?'#101b16':'#faf9f4';
    document.title=(names[route] || '페이지 찾기')+' · Subart';
    spaces.open=false;
    if(dialog.open) dialog.close();
    const activeTab=({subscribe:'library',account:'library',report:'community'})[route]||route;
    document.querySelectorAll('a[data-tab]').forEach(a=>{
      if(a.dataset.tab===activeTab) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    let html;
    if(isHome) html=home();
    else if(workspace) html=window.SubartWorkspace.render(parts);
    else if(known) html=window.SubartReader.render(parts);
    else html='<section class="missing"><h1>화면을 찾을 수 없어요</h1><a href="#home">홈으로 가기 →</a></section>';
    main.innerHTML=html;
    if(moved) {
      window.scrollTo(0,0);
      if(!first) main.focus({preventScroll:true});
    }
    if(workspace) window.SubartWorkspace.bind(parts);
    else if(known&&!isHome) window.SubartReader.bind(parts);
  }
  window.Subart={books,state,save,go,icon,escape,notify,render,readHash};
  document.querySelectorAll('[data-icon]').forEach(n=>{n.innerHTML=icon(n.dataset.icon,n.classList.contains('caret')?14:19);});
  function showResults(query) {
    const term=query.trim().toLocaleLowerCase('ko-KR');
    const hits=books.filter(b=>visible(b) && [b.title,b.author,b.genre].some(s=>s.toLocaleLowerCase('ko-KR').includes(term)));
    document.getElementById('search-results').innerHTML=hits.length?hits.map(b=>'<a class="result" href="#read/'+b.id+'/1"><img src="'+b.cover+'" alt=""><span><strong>'+escape(b.title)+'</strong><small>'+escape(b.author)+' · '+escape(b.genre)+'</small></span>'+icon('arrow',17)+'</a>').join(''):'<p class="no-result">검색 결과가 없어요. 다른 작품명이나 작가 이름을 입력해 주세요.</p>';
  }
  const searchField=document.getElementById('search-input');
  document.getElementById('search-open').addEventListener('click',()=>{spaces.open=false;searchField.value='';showResults('');dialog.showModal();searchField.focus();});
  searchField.addEventListener('input',()=>showResults(searchField.value));
  dialog.querySelector('[data-close-search]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog || e.target.closest('.result')) dialog.close();});
  document.addEventListener('click',e=>{if(spaces.open && !spaces.contains(e.target)) spaces.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&spaces.open){spaces.open=false;spaces.querySelector('summary').focus();}});
  document.querySelector('.skip').addEventListener('click',e=>{e.preventDefault();main.focus();});
  main.addEventListener('click',e=>{
    if(currentRoute!=='home') return;
    const follow=e.target.closest('button[data-follow]');
    const mark=e.target.closest('button[data-save]');
    if(!follow&&!mark) return;
    const bucket=follow?'following':'saved', item=follow?follow.dataset.follow:mark.dataset.save;
    const was=state[bucket].includes(item);
    state[bucket]=was?state[bucket].filter(v=>v!==item):[...state[bucket],item];
    const message=follow?(was?'작가 팔로우를 해제했어요.':'작가를 팔로우했어요.'):(was?'내 서재에서 뺐어요.':'내 서재에 저장했어요.');
    if(save()) notify(message);
    const button=follow||mark;
    button.setAttribute('aria-pressed',String(!was));
    if(mark) button.classList.toggle('selected',!was);
    if(follow) button.innerHTML=icon(was?'plus':'check',16)+(was?'작가 팔로우':'팔로잉');
  });
  window.addEventListener('hashchange',render);
  render();
})();
