(() => {
  'use strict';

  const books = window.SubartCatalog;
  const storageKey = 'subart.prototype.v1';
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10h-6v-7H9v7H3z"/>',
    books:'<path d="M3 3h4v17H3zm6 0h4v17H9zm6 2 3.5-1 3.3 15.3-3.5.8z"/>',
    book:'<path d="M3 4c3.4-.6 6.4.3 9 2.5 2.6-2.2 5.6-3.1 9-2.5v14c-3.4-.6-6.4.2-9 2.5C9.4 18.2 6.4 17.4 3 18zM12 6.5v14"/>',
    play:'<path d="m7 4 13 8-13 8z"/>',
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
  // Public sample comments are shared with older browser libraries. Personal shelf choices stay local.
  const sampleFeedback = [
    {id:'seed-press',bookId:'press',episode:0,author:'잉크병',text:'활자를 하나씩 뒤집어 읽는 장면에서 저도 모르게 고개를 기울였어요.',created:Date.UTC(2026,10,24)},
    {id:'seed-moon-window',bookId:'moon',episode:0,author:'수풀',text:'답장을 넣기 전까지 우편함 밖의 소리만 들리는 구성이 좋았어요.',created:Date.UTC(2026,10,23)},
    {id:'seed-radio',bookId:'radio',episode:0,author:'비탈길',text:'주파수를 조금씩 맞춰 가는 대목을 소리 내어 읽었어요.',created:Date.UTC(2026,10,22)},
    {id:'seed-station',bookId:'station',episode:0,author:'물결',text:'대합실에 남은 귤 두 알은 누구 몫이었을까요? 역장보다 그 빈자리가 더 오래 기억에 남네요.',created:Date.UTC(2026,10,21)},
    {id:'seed-garden',bookId:'garden',episode:0,author:'모과',text:'물 준 시간 옆에 처음으로 색을 적는 장면, 제 식물 노트에도 따라 해 보고 싶어요.',created:Date.UTC(2026,10,20)},
    {id:'seed-indigo',bookId:'indigo',episode:0,author:'하늬',text:'천을 물 밖으로 꺼내는 순간까지 색을 기다리게 해서 좋았어요.',created:Date.UTC(2026,10,20)},
    {id:'seed-sea',bookId:'sea',episode:0,author:'연필끝',text:'나침반을 접고 돛을 보라는 말을 읽고 앞의 풍경을 다시 봤습니다.',created:Date.UTC(2026,10,19)},
    {id:'seed-score',bookId:'score',episode:0,author:'서온',text:'악보의 빈자리를 들여다보는 동안 저도 잠깐 읽기를 멈췄어요.',created:Date.UTC(2026,10,18)},
    {id:'seed-letter',bookId:'moon',episode:0,author:'단추',text:'우편함 앞에서 한참 기다리는 모습이 더 선명하게 떠올라요.',created:Date.UTC(2026,10,17)}
  ];
  const initial = {
    saved:['station','garden','indigo','radio'], following:['민하','도하'],
    progress:{
      moon:{episode:0,version:'v2',paragraph:3,percent:38,updated:Date.UTC(2026,10,23)},
      garden:{episode:0,version:'v1',paragraph:1,percent:50,updated:Date.UTC(2026,10,20)},
      sea:{episode:0,version:'v1',paragraph:1,percent:50,updated:Date.UTC(2026,10,18)}
    },
    feedback:sampleFeedback.slice(),reports:[],subscribed:false
  };
  function load() {
    try {
      const raw=JSON.parse(localStorage.getItem(storageKey));
      if (!raw || typeof raw!=='object' || Array.isArray(raw)) return initial;
      const result={...initial,...raw};
      for(const key of ['saved','following','feedback','reports']) if (!Array.isArray(result[key])) result[key]=initial[key];
      if (!result.progress || typeof result.progress!=='object' || Array.isArray(result.progress)) result.progress=initial.progress;
      const examples=new Map(sampleFeedback.map(item=>[item.id,item]));
      const personal=[];
      for (const item of result.feedback) {
        if (!item || typeof item.id!=='string') continue;
        if (examples.has(item.id)) examples.set(item.id,item);
        else personal.push(item);
      }
      result.feedback=[...personal,...examples.values()];
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
    const firstAction=book.category === '음악' ? ' 첫 트랙 듣기' : ' 첫 화 읽기';
    return '<article class="shelf-card"><a href="#read/'+book.id+'/1" class="jacket '+book.id+'" aria-label="'+escape(book.title)+firstAction+'"><img alt="" src="'+book.cover+'" loading="lazy"></a>'+
      '<button class="shelf-save'+(marked?' selected':'')+'" type="button" data-save="'+book.id+'" aria-pressed="'+marked+'" aria-label="'+escape(book.title)+' 서재에 저장">'+icon('bookmark',17)+'</button>'+
      '<div class="shelf-copy"><div><h3><a href="#read/'+book.id+'/1">'+escape(book.title)+'</a></h3><p>'+escape(book.author)+'<span>·</span>'+escape(book.genre)+'</p></div><a href="#read/'+book.id+'/1" class="open-book" aria-label="'+escape(book.title)+firstAction+'">'+icon('arrow',20)+'</a></div></article>';
  }
  function home(music) {
    const category = music ? '음악' : '웹소설';
    const available=books.filter(b=>visible(b) && (b.category || '웹소설') === category);
    const navigation = '<div class="discovery-bar"><nav class="genre-tabs" aria-label="작품 장르">' +
      '<a href="#home"' + (!music ? ' aria-current="page"' : '') + '>웹소설</a>' +
      '<a href="#home/music"' + (music ? ' aria-current="page"' : '') + '>음악</a></nav>' +
      '<a class="pass-link" href="#subscribe">프리패스 보기 ' + icon('arrow',16) + '</a></div>';
    const feature=available[0];
    if (!feature) return '<div class="catalog-home">'+navigation+'<h1>'+category+'</h1><p>현재 공개 중인 작품이 없습니다.</p></div>';
    const followed=state.following.includes(feature.author);
    const first=feature.episodes[0];
    const remaining=available.slice(1);
    const trackList=music ? '<section class="shelf" aria-labelledby="tracks-title"><div class="shelf-heading"><h2 id="tracks-title">수록곡</h2><span>'+feature.episodes.length+'곡</span></div><ol class="track-list">'+
      feature.episodes.map((ep,i)=>'<li><a href="#read/'+feature.id+'/'+(i+1)+'"><span class="track-number">'+String(i+1).padStart(2,'0')+'</span><strong>'+escape(ep.title)+'</strong><small>'+ (ep.free ? '무료 듣기' : '구독 트랙') +'</small>'+icon(ep.free?'play':'arrow',16)+'</a></li>').join('')+'</ol></section>' : '';
    const shelf=remaining.length ? '<section class="shelf" aria-labelledby="shelf-title"><div class="shelf-heading"><h2 id="shelf-title">'+(music?'다음에 들을 음반':'다음에 펼칠 작품')+'</h2><span>작품 '+remaining.length+'편</span></div><div class="shelf-grid">'+remaining.map(galleryCard).join('')+'</div></section>' : '';
    return '<div class="catalog-home">'+navigation+'<section class="feature" aria-labelledby="featured-title"><div class="feature-copy">'+
      '<div class="feature-kicker">'+(music?'이번 주 음반':'편집자의 서가')+'</div>'+
      '<p class="edition"><span>'+escape(feature.genre)+'</span><span>'+(music?'싱글':'연재 중')+'</span></p>'+
      '<h1 id="featured-title">'+escape(feature.title)+'</h1><p class="feature-author">'+escape(feature.author)+(music?'':' 지음')+'</p>'+
      '<p class="feature-blurb">'+escape(feature.blurb)+'</p><div class="feature-actions">'+
      '<a class="feature-read" href="#read/'+feature.id+'/1">'+icon(music?'play':'book',19)+(music?'첫 트랙 듣기':'첫 화 읽기')+icon('arrow',18)+'</a>'+
      '<button type="button" class="feature-follow" data-follow="'+escape(feature.author)+'" aria-pressed="'+followed+'">'+icon(followed?'check':'plus',16)+(followed?'팔로잉':music?'아티스트 팔로우':'작가 팔로우')+'</button></div></div>'+
      '<a class="feature-art '+feature.id+'" href="#read/'+feature.id+'/1" aria-label="'+escape(feature.title)+(music?' 첫 트랙 ':' 첫 화 ')+escape(first.title)+'"><img src="'+feature.cover+'" '+(feature.id==='moon'?'srcset="./assets/moon-small.webp 680w, ./assets/moon.webp 1254w" sizes="(max-width:700px) 264px, 320px" ':'')+'alt="'+(feature.id==='moon'?'보름달 아래 붉은 우편함과 불이 켜진 우체국':escape(feature.title)+' 표지')+'" fetchpriority="high"></a></section>'+
      trackList+shelf+'</div>';
  }
  const names={home:'홈',library:'내 서재',community:'커뮤니티',read:'작품 읽기',subscribe:'구독권 선택',account:'구독 관리',report:'신고',studio:'창작자 작업실',ops:'운영 콘솔'};
  function render() {
    let parts=readHash();
    if(parts[0]==='app-content') parts=['home'];
    if (parts[0]==='subscribe' && parts[1]) {
      const readerLink=window.SubartReader.readInsteadOfSubscribe(parts);
      if (readerLink) { location.replace(readerLink); return; }
    }
    const route=parts[0], known=Object.hasOwn(names,route);
    const path=parts.join('/');
    const moved=path!==currentRoute;
    const first=!currentRoute;
    window.SubartReader?.leave?.();
    currentRoute=path;
    const isHome=route==='home';
    const workspace=['studio','ops'].includes(route);
    document.body.dataset.page=route;
    const isAudio=route==='read' && books.find(b=>b.id===parts[1])?.category==='음악';
    document.title=(isAudio?'트랙 듣기':names[route] || '페이지 찾기')+' · Subart';
    spaces.open=false;
    if(dialog.open) dialog.close();
    const activeTab=({subscribe:'library',account:'library',report:'community'})[route]||route;
    document.querySelectorAll('a[data-tab]').forEach(a=>{
      if(a.dataset.tab===activeTab) a.setAttribute('aria-current','page');
      else a.removeAttribute('aria-current');
    });
    let html;
    if(isHome) html=home(parts[1]==='music');
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
    const parts=readHash();
    const scope=parts[0]==='home' ? (parts[1]==='music'?'음악':'웹소설') : '';
    document.getElementById('search-title').textContent=scope ? scope+' 검색' : '작품 검색';
    const hits=books.filter(b=>{
      const category=b.category || '웹소설';
      return visible(b) && (!scope || category===scope) && [b.title,b.author,b.genre,category].some(s=>s.toLocaleLowerCase('ko-KR').includes(term));
    });
    document.getElementById('search-results').innerHTML=hits.length?hits.map(b=>'<a class="result" href="#read/'+b.id+'/1"><img src="'+b.cover+'" alt=""><span><strong>'+escape(b.title)+'</strong><small>'+escape(b.author)+' · '+escape(b.genre)+'</small></span>'+icon('arrow',17)+'</a>').join(''):'<p class="no-result">검색 결과가 없어요. 작품명이나 창작자 이름으로 다시 찾아보세요.</p>';
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
    if(readHash()[0]!=='home') return;
    const follow=e.target.closest('button[data-follow]');
    const mark=e.target.closest('button[data-save]');
    if(!follow&&!mark) return;
    const bucket=follow?'following':'saved', item=follow?follow.dataset.follow:mark.dataset.save;
    const was=state[bucket].includes(item);
    state[bucket]=was?state[bucket].filter(v=>v!==item):[...state[bucket],item];
    const creator=readHash()[1]==='music'?'아티스트':'작가';
    const message=follow?(was?creator+' 팔로우를 해제했어요.':creator+' 팔로우를 시작했어요.'):(was?'내 서재에서 뺐어요.':'내 서재에 저장했어요.');
    if(save()) notify(message);
    const button=follow||mark;
    button.setAttribute('aria-pressed',String(!was));
    if(mark) button.classList.toggle('selected',!was);
    if(follow) button.innerHTML=icon(was?'plus':'check',16)+(was?creator+' 팔로우':'팔로잉');
  });
  window.addEventListener('hashchange',render);
  render();
})();
