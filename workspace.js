/* Local creator and moderation workflows. The shared shell owns navigation and persistence. */
(() => {
  'use strict';

  const menus = {
    studio: [
      ['rights', '권리 등록', 'SCR-C01'], ['versions', '작품과 버전', 'SCR-C02'],
      ['insights', '작품 반응', 'SCR-C03'], ['payout', '지급 명세', 'SCR-C04'],
      ['export', '성과 내보내기', 'SCR-C05']
    ],
    ops: [
      ['review', '작품 심사와 재심', 'SCR-A01'], ['refunds', '환불 처리', 'SCR-A02'],
      ['payout', '지급 보류와 대사', 'SCR-A03'], ['reports', '신고와 소명', 'SCR-A04']
    ]
  };
  const app = () => window.Subart;
  const esc = (value) => app().escape(String(value ?? ''));
  const money = (amount) => Number(amount).toLocaleString('ko-KR') + '원';
  const timeText = (ts) => new Date(ts).toLocaleString('ko-KR', {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  const versionDate = (ts) => new Date(ts).toLocaleDateString('ko-KR', {month:'numeric',day:'numeric'});
  const weeks = [
    {start:'2026-11-18', moon:{daily:[10,15,12,22,15,25,29], returning:34, follows:12},
      station:{daily:[6,9,14,8,10,13,16], returning:19, follows:7}},
    {start:'2026-11-11', moon:{daily:[13,11,18,26,32,14,9], returning:29, follows:8},
      station:{daily:[4,8,12,14,17,11,8], returning:16, follows:5}},
    {start:'2026-11-04', moon:{daily:[7,13,12,18,21,14,11], returning:21, follows:6},
      station:{daily:[3,6,7,10,13,8,5], returning:12, follows:3}}
  ];
  const view = {chart:'moon', week:weeks[0].start, review:'', refund:'R-19', report:'R-024'};
  const refundSamples = [
    {id:'R-19', payment:'P-1101', date:'11월 24일', amount:3900, allocation:1500, due:'12월 8일', status:'환불 접수'},
    {id:'R-20', payment:'P-1102', date:'11월 24일', amount:1000, allocation:500, due:'12월 9일', status:'PG 확인 중'},
    {id:'R-22', payment:'P-1117', date:'11월 23일', amount:2900, allocation:980, due:'12월 7일', status:'환불 접수'},
    {id:'R-17', payment:'P-1088', date:'11월 20일', amount:1900, allocation:640, due:'12월 4일', status:'환불 완료'}
  ];
  const extraAppeals = [
    {id:'M-032', title:'온실의 노트 · 삽화 이용 허락', desc:'삽화가가 서명한 전자책 게재 허락서를 보완했습니다.',detail:'온실-삽화-사용허락서.pdf',status:'재심 요청'},
    {id:'M-027', title:'수평선 수집가 · 지도 출처', desc:'직접 제작한 항로 지도의 스케치와 작업 기록을 확인했습니다.',detail:'항로지도-제작과정.pdf',status:'재심 승인'}
  ];
  const sampleReports = [
    {id:'R-024', reason:'표지 권리 침해 주장', target:'달의 우체국 · 표지', detail:'표지 사용 권리의 근거를 확인해 주세요.', status:'확인 중'},
    {id:'R-021', reason:'개인 계좌이체 유도', target:'작품 소개 · 결제 안내', detail:'외부 계좌로 송금을 요청하는 안내가 있습니다.', status:'소명 대기'},
    {id:'R-028', reason:'무관한 홍보 글', target:'겨울 간이역 · 1화 피드백', detail:'회차와 관계없는 판매 링크가 반복해서 올라왔습니다.', status:'확인 중'},
    {id:'R-018', reason:'작품 안내 누락', target:'수평선 수집가 · 작품 소개', detail:'작가가 소개문에 이용 안내를 보완해 확인을 마쳤습니다.', status:'검토 종료'}
  ];
  function initialState() {
    return {
      rights:null, minimum:2900, maximum:4900, price:2900, endRequested:false,
      versions:[
        {n:3, date:'11. 24.', status:'검토 대기', memo:'첫 장면을 줄이고 편지 묘사를 보완했습니다.', file:'달의우체국-1화-v3.txt'},
        {n:2, date:'11. 17.', status:'공개 중', memo:'첫 편지가 도착하는 장면을 개정했습니다.', file:'달의우체국-1화-v2.txt'}
      ],
      refunds:{}, sampleReports:[],
      appeal:'재심 요청', reconciled:false, log:[]
    };
  }
  function data() {
    const state = app().state;
    if (!state.workspace || !Array.isArray(state.workspace.versions)) state.workspace = initialState();
    return state.workspace;
  }
  function refundStatus(item) {
    return data().refunds[item.id] ?? item.status;
  }
  function publishedVersion() {
    const release = data().versions.find(v => v.status === '공개 중');
    return release ? 'v'+release.n : 'v2';
  }
  function artistPrice() {
    return data().price;
  }
  function record(id, message) {
    data().log.unshift({id, message, time:Date.now()});
  }
  function finish(message, focusSelector) {
    app().save();
    app().render();
    app().notify(message);
    if (focusSelector) document.querySelector(focusSelector)?.focus({preventScroll:true});
  }
  function logs(id) {
    const list = data().log.filter(entry => entry.id === id);
    return list.length ? '<details class="ws-details"><summary>처리 이력 '+list.length+'건</summary><ol class="ws-log">'+
      list.map(entry => '<li><time>'+esc(timeText(entry.time))+'</time>'+esc(entry.message)+'</li>').join('')+'</ol></details>' : '';
  }
  function textField(name,label,placeholder='',required=true,initial='') {
    return '<label class="ws-field">'+label+'<input name="'+name+'" maxlength="140" value="'+esc(initial)+'" placeholder="'+esc(placeholder)+'" '+(required?'required':'')+'></label>';
  }
  function noteField(label='처리 근거', initial='') {
    return '<label class="ws-field">'+label+'<textarea name="note" maxlength="400" rows="3" required placeholder="검토한 내용과 판단 근거를 적어 주세요.">'+esc(initial)+'</textarea></label>';
  }
  function status(text) {return '<span class="ws-status">'+esc(text)+'</span>';}
  function pair(label,val) {return '<div><dt>'+esc(label)+'</dt><dd>'+esc(val)+'</dd></div>';}
  function heading(parts) {
    return '<div class="ws-section-head"><h2>'+parts[0]+'</h2>'+(parts[1]?'<span>'+parts[1]+'</span>':'')+'</div>';
  }
  function formButton(label, value) {return '<button class="ws-button" type="submit" value="'+(value||'')+'">'+label+'</button>';}
  function rightsPage() {
    const right=data().rights;
    return heading(['달의 우체국','이담 · 웹소설'])+
      '<form class="ws-form" data-wform="rights"><label class="ws-field">권리 유형<select name="type"><option>단독 창작</option><option>공동 창작</option><option>이용 허락</option></select></label>'+
      textField('scope','권리자와 허락 범위','예: 이담 · 본문과 표지의 비독점 공개')+
      '<label class="ws-field">권리 증빙 <small>기기에는 첨부한 파일명만 저장합니다.</small><input type="file" name="evidence" accept=".pdf,.png,.jpg,.jpeg,.txt"></label>'+
      '<label class="ws-check"><input name="example" type="checkbox"> 예시 증빙 사용</label>'+
      '<label class="ws-check"><input name="consent" type="checkbox" required> 비독점 공개 범위와 철회 절차를 확인했습니다.</label>'+
      '<div class="ws-form-end">'+formButton('권리 검토 요청')+'</div></form>'+
      (right?heading(['최근 권리 요청',status(right.status)])+'<dl class="ws-list">'+pair('권리자와 범위',right.scope)+pair('첨부 파일',right.file)+'</dl>'+logs('rights'):'');
  }
  function versionsPage() {
    const ws=data();
    return heading(['달의 우체국','1화 · 밤에 도착한 편지'])+
      '<ul class="ws-records">'+ws.versions.map(v => '<li><div><b>개정 v'+v.n+'</b><p>'+esc(v.memo)+'</p></div><div class="ws-aside">'+status(v.status)+'<small>'+esc(v.date)+'</small></div></li>').join('')+'</ul>'+
      '<form class="ws-form" data-wform="version">'+heading(['새 버전 등록'])+noteField('개정 메모')+
      '<label class="ws-field">개정 원고 <small>이 예시에서는 파일명과 메모를 기록합니다.</small><input name="file" type="file" accept=".txt,.md,.pdf,.epub"></label>'+
      '<label class="ws-check"><input name="example" type="checkbox"> 예시 원고 사용</label>'+
      '<div class="ws-form-end">'+formButton('심사 요청')+'</div></form>'+
      '<details class="ws-details"><summary>아티스트 구독 가격</summary><form class="ws-form" data-wform="price"><div class="ws-prices">'+
      [['minimum','최저가',ws.minimum??2900],['price','월 판매가',ws.price],['maximum','최고가',ws.maximum??4900]].map(([name,label,value])=>
        '<label class="ws-field">'+label+' (원)<input name="'+name+'" type="number" min="1" step="1" value="'+esc(value)+'" required></label>').join('')+
      '</div><small>다음 모의 구매부터 새 판매가를 적용합니다.</small>'+formButton('가격 저장')+'</form></details>';
  }
  function selectedWeek() {
    return weeks.find(w => w.start === view.week) || weeks[0];
  }
  function weekDate(week, offset) {
    const date=new Date(week.start+'T00:00:00Z');
    date.setUTCDate(date.getUTCDate()+offset);
    return date;
  }
  function weekLabel(week) {
    const start=weekDate(week,0), end=weekDate(week,6);
    const lastMonth=start.getUTCMonth()===end.getUTCMonth()?'':(end.getUTCMonth()+1)+'월 ';
    return (start.getUTCMonth()+1)+'월 '+start.getUTCDate()+'일 ~ '+lastMonth+end.getUTCDate()+'일';
  }
  function weekPicker() {
    return '<label class="ws-field ws-select">집계 기간<select data-wselect="week">'+weeks.map(w=>
      '<option value="'+w.start+'" '+(w===selectedWeek()?'selected':'')+'>'+weekLabel(w)+'</option>').join('')+'</select></label>';
  }
  function weeklyTotal(row) {
    return row.daily.reduce((sum, count)=>sum+count, 0);
  }
  function insightsPage() {
    const week=selectedWeek();
    const books=app().books.filter(book=>Object.hasOwn(week,book.id));
    const book=books.find(b=>b.id===view.chart) || books[0];
    const chart=week[book.id], maximum=Math.max(1,...chart.daily);
    return '<label class="ws-field ws-select">작품 선택<select data-wselect="chart">'+books.map(b=>'<option value="'+esc(b.id)+'" '+(b===book?'selected':'')+'>'+esc(b.title)+'</option>').join('')+'</select></label>'+weekPicker()+
      heading([esc(book.title),'예시 집계'])+
      '<dl class="ws-stats">'+pair('유효 감상',weeklyTotal(chart)+'건')+pair('재방문 독자',chart.returning+'명')+pair('새 팔로우',chart.follows+'명')+'</dl>'+
      '<figure class="ws-figure"><figcaption>일별 유효 감상</figcaption><ol class="ws-bars">'+chart.daily.map((v,i)=>'<li><b>'+v+'<span class="ws-sr">건</span></b><i style="height:'+Math.round(v/maximum*116)+'px"></i><time datetime="'+weekDate(week,i).toISOString().slice(0,10)+'">'+weekDate(week,i).getUTCDate()+'일</time></li>').join('')+'</ol></figure>'+
      '<p class="ws-hint">승인된 감상 이벤트를 작품 단위로 집계합니다.</p>';
  }
  function payoutPage() {
    const payment=refundSamples.find(item=>item.id==='R-19');
    const refunded=refundStatus(payment)==='환불 완료';
    return heading(['11월 이용분','지급 예시'])+'<div class="ws-amount"><span>내 배분 예정액</span><strong>'+money(refunded?0:payment.allocation)+'</strong></div>'+
      '<dl class="ws-list">'+pair('대기 종료일',payment.due)+pair('지급 상태',refunded?'환불 반영 · 지급 대상 없음':'보류 · 환불 확인 중')+'</dl>'+
      '<details class="ws-details"><summary>배분 근거 보기</summary><dl class="ws-list">'+pair('배분 귀속',payment.payment+' · 달의 우체국')+pair('기존 배분액',money(payment.allocation))+pair('환불 조정',refunded?'−'+money(payment.allocation):'결과 확인 중')+'</dl><p>환불 대기가 끝난 뒤 남은 배분액과 지급 보류 사유를 다시 확인합니다.</p></details>';
  }
  function exportPage() {
    const ws=data(), book=app().books.find(b=>b.id==='moon'), week=selectedWeek();
    return heading([esc(book.title),'1~'+book.episodes.length+'화'])+weekPicker()+'<dl class="ws-list">'+pair('내보낼 항목','작품명, 첫 회 공개 버전, 주간 집계')+pair('유효 감상',weeklyTotal(week.moon)+'건')+pair('포함 범위','작품 단위 요약')+'</dl>'+
      '<button type="button" data-wact="csv" class="ws-button">성과 CSV 받기</button>'+
      '<details class="ws-details"><summary>공개 종료 검토</summary><p>구독자 안내와 남은 정산을 확인한 뒤 검토를 요청합니다. 검토 중에는 공개가 유지됩니다.</p>'+
      (ws.endRequested?status('검토 요청됨'):'<form class="ws-form" data-wform="end"><label class="ws-check"><input type="checkbox" required> 구독자 안내와 남은 정산을 확인했습니다.</label>'+formButton('공개 종료 검토 요청')+'</form>')+'</details>';
  }
  function reviewCases() {
    const ws=data();
    const cases=ws.versions.filter(v=>v.n>=3).map(v=>({id:'v'+v.n,title:'달의 우체국 · v'+v.n,desc:v.memo,detail:v.file,status:v.status,kind:'version',v}));
    if (ws.rights) cases.unshift({id:'rights',title:'달의 우체국 · 권리 증빙',desc:ws.rights.scope,detail:ws.rights.file,status:ws.rights.status,kind:'rights'});
    cases.push({id:'appeal',title:'M-029 · 재심 요청',desc:'작가가 보완 자료를 제출했습니다.',detail:'표지 사용 허락 보완본.pdf',status:ws.appeal,kind:'appeal'});
    for (const appeal of extraAppeals) {
      cases.push({...appeal, title:appeal.id+' · '+appeal.title, status:ws.appealDecisions?.[appeal.id] ?? appeal.status, kind:'appeal'});
    }
    return cases;
  }
  function choose(list, key) {
    const selected=list.find(item=>item.id===view[key])||list[0];
    view[key]=selected.id;
    return selected;
  }
  function picker(list,active,label,key) {
    return '<label class="ws-field ws-select">'+esc(label)+'<select data-wselect="'+key+'">'+list.map(i=>'<option value="'+esc(i.id)+'" '+(i.id===active.id?'selected':'')+'>'+esc(i.title)+' · '+esc(i.status)+'</option>').join('')+'</select></label>';
  }
  function reviewPage() {
    const list=reviewCases(), item=choose(list,'review');
    const pending=['검토 대기','재심 요청'].includes(item.status);
    return picker(list,item,'심사 대상','review')+heading([esc(item.title),status(item.status)])+
      '<dl class="ws-list">'+pair('제출 자료',item.detail)+pair('검토 메모',item.desc)+'</dl>'+
      (pending?'<form class="ws-form" data-wform="review">'+noteField()+'<div class="ws-actions">'+formButton('승인','approve')+'<button class="ws-secondary" type="submit" value="return">수정 요청</button></div></form>':'')+logs(item.id);
  }
  function refundCases() {
    const sub=app().state.subscription;
    const rows=refundSamples.map(item=>({...item, title:item.payment+' · '+item.id, status:refundStatus(item)}));
    if (sub?.refundStatus) rows.unshift({id:'reader',title:'내 서재에서 신청한 환불',amount:sub.price,status:sub.refundStatus});
    return rows;
  }
  function refundsPage() {
    const list=refundCases(),item=choose(list,'refund');
    const pending=['환불 접수','접수 중'].includes(item.status);
    return picker(list,item,'결제별 요청','refund')+heading([esc(item.title),status(item.status)])+'<dl class="ws-list">'+(item.date?pair('접수일',item.date):'')+pair('환불 신청액',money(item.amount))+pair('지급 보류',item.status==='환불 완료'?'환불 결과 반영':'결과 확인까지 보류')+'</dl>'+
      (pending?'<form class="ws-form" data-wform="refund">'+noteField()+formButton('환불 검토 승인')+'</form>':
      (item.status==='환불 완료'?'':'<button type="button" class="ws-button" data-wact="pg">모의 PG 결과 반영</button>'))+logs('refund-'+item.id);
  }
  function reconcilePage() {
    const ws=data();
    const rows=refundSamples.map(item=>{
      const refunded=refundStatus(item)==='환불 완료';
      let label=refunded?'환불 반영':'환불 보류';
      if (item.id==='R-20' && !refunded) label=ws.reconciled?'대사 일치':'결과 대사 중';
      return '<li><div><b>'+item.payment+' · '+money(item.allocation)+'</b><p>대기 종료일 '+item.due+'</p></div><div class="ws-aside">'+status(label)+'<br><a class="ws-secondary" href="#ops/refunds" data-wact="hold" data-refund="'+item.id+'">환불 사건 열기</a></div></li>';
    });
    return heading(['12월 10일 지급 검토','결제별 대사'])+'<ul class="ws-records">'+rows.join('')+'</ul>'+
      '<p class="ws-hint">P-1102의 기존 이체 요청과 모의 지급 결과를 대조합니다.</p><div class="ws-actions">'+
      (ws.reconciled?status('결과 확인 완료'):'<button class="ws-button" type="button" data-wact="reconcile">대사 자료 조회</button>')+'</div>'+logs('reconcile');
  }
  function reportCases() {
    const reader=(app().state.reports||[]).map(r=>{const book=app().books.find(b=>b.id===r.bookId);
      return {id:r.id,title:r.id,reason:r.reason,target:(book?.title||'작품')+' · '+(Number(r.episode||0)+1)+'화'+(r.feedbackId?' · 피드백 '+r.feedbackId:''),detail:r.detail||'추가 설명 없음',status:r.status,source:r};});
    const saved=data().sampleReports;
    for (const sample of sampleReports) {
      if (!saved.some(r=>r.id===sample.id)) saved.push({...sample});
    }
    const demo=saved.map(r=>({...r,title:r.id,source:r}));
    return reader.concat(demo);
  }
  function reportsPage() {
    const list=reportCases(),item=choose(list,'report');
    return picker(list,item,'신고 사건','report')+heading([esc(item.reason),status(item.status)])+
      '<dl class="ws-list">'+pair('사건 번호',item.id)+pair('신고 대상',item.target)+pair('신고 내용',item.detail)+'</dl>'+
      (item.status==='검토 종료'?'':'<form class="ws-form" data-wform="report"><label class="ws-field">처리 결과<select name="status"><option>확인 중</option><option>소명 대기</option><option>검토 종료</option></select></label>'+noteField()+formButton('처리 기록 저장')+'</form>')+logs('report-'+item.id);
  }
  const pages={studio:{rights:rightsPage,versions:versionsPage,insights:insightsPage,payout:payoutPage,export:exportPage},ops:{review:reviewPage,refunds:refundsPage,payout:reconcilePage,reports:reportsPage}};
  function render(parts) {
    const role=parts[0]==='ops'?'ops':'studio';
    const menu=menus[role], route=menu.find(x=>x[0]===parts[1])||menu[0];
    const title=role==='ops'?'운영 콘솔':'창작자 작업실';
    return '<section class="ws" aria-label="'+title+'"><aside class="ws-sidebar"><h2>'+title+'</h2><div class="ws-roles"><a href="#studio/rights" '+(role==='studio'?'aria-current="true"':'')+'>창작자</a><a href="#ops/review" '+(role==='ops'?'aria-current="true"':'')+'>운영자</a></div><nav aria-label="'+title+' 메뉴">'+
      menu.map(([key,name])=>'<a '+(route[0]===key?'aria-current="page"':'')+' href="#'+role+'/'+key+'">'+name+'</a>').join('')+'</nav>'+
      '<label class="ws-route-picker"><span class="ws-sr">'+title+' 화면 선택</span><select data-wroute>'+menu.map(([key,name])=>'<option value="'+role+'/'+key+'" '+(route[0]===key?'selected':'')+'>'+name+'</option>').join('')+'</select></label></aside>'+
      '<article class="ws-body" id="'+route[2]+'"><header class="ws-title"><div><small>'+title+'</small><h1>'+route[1]+'</h1></div><span>로컬 데모</span></header>'+pages[role][route[0]]()+'</article></section>';
  }
  function requireText(value,field) {
    if (value.trim()) return true;
    field.setCustomValidity('공백 외의 내용을 입력해 주세요.');field.reportValidity();
    field.addEventListener('input',()=>field.setCustomValidity(''),{once:true}); return false;
  }
  function submit(form, value) {
    const ws=data(), input=new FormData(form), kind=form.dataset.wform;
    const str=key=>String(input.get(key)||'').trim();
    if (form.elements.note && !requireText(str('note'),form.elements.note)) return;
    switch(kind) {
      case 'rights': {
        if (!requireText(str('scope'),form.elements.scope)) return;
        const file=form.elements.evidence.files[0]?.name||(input.has('example')?'표지 권리 증빙 예시.pdf':'');
        if (!file) {app().notify('권리 증빙을 첨부하거나 예시 증빙을 선택해 주세요.');form.elements.evidence.focus();return;}
        ws.rights={type:str('type'),scope:str('scope'),file,status:'검토 대기'};
        record('rights','새 증빙 제출 · '+str('scope'));finish('권리 검토를 요청했습니다.');break;
      }
      case 'version': {
        const file=form.elements.file.files[0]?.name||(input.has('example')?'달의 우체국 개정 예시.txt':'');
        if (!file) {app().notify('원고를 선택하거나 예시 원고를 사용해 주세요.');form.elements.file.focus();return;}
        const n=Math.max(...ws.versions.map(v=>v.n))+1;
        ws.versions.unshift({n,date:versionDate(Date.now()),status:'검토 대기',memo:str('note'),file});
        view.review='v'+n;record('v'+n,'새 버전 제출');finish('v'+n+'을 심사 대기 목록에 추가했습니다.');break;
      }
      case 'price': {
        const minimum=Number(str('minimum')), maximum=Number(str('maximum')), price=Number(str('price'));
        if (![minimum,price,maximum].every(v=>Number.isSafeInteger(v) && v>0) || price<minimum || price>maximum) {
          app().notify('판매가는 최저가 이상, 최고가 이하의 양의 정수로 입력해 주세요.');
          form.elements.price?.focus();return;
        }
        Object.assign(ws,{minimum,price,maximum});finish('구독 가격을 저장했습니다.');break;
      }
      case 'end':ws.endRequested=true;record('end','공개 종료 검토 요청');finish('공개 종료 검토를 요청했습니다.');break;
      case 'review': {
        const item=choose(reviewCases(),'review');
        if (!['검토 대기','재심 요청'].includes(item.status)) return;
        const approve=value==='approve';
        if (item.kind==='version') {
          if (approve) {
            for (const v of ws.versions) {
              if (v.status==='공개 중') v.status='이전 공개본';
              if (v.status==='검토 대기' && v.n<item.v.n) v.status='검토 종료';
            }
          }
          item.v.status=approve?'공개 중':'수정 요청';
        } else if(item.kind==='rights') ws.rights.status=approve?'확인 완료':'수정 요청';
        else {
          const result=approve?'재심 승인':'수정 요청';
          if(item.id==='appeal') ws.appeal=result;
          else (ws.appealDecisions ??= {})[item.id]=result;
        }
        record(item.id,(approve?'승인':'수정 요청')+' · '+str('note'));finish('검토 결과를 기록했습니다.');break;
      }
      case 'refund': {
        const item=choose(refundCases(),'refund');
        if (!['환불 접수','접수 중'].includes(item.status)) return;
        if (item.id==='reader')app().state.subscription.refundStatus='검토 승인';
        else ws.refunds[item.id]='PG 확인 중';
        record('refund-'+item.id,'환불 검토 승인 · '+str('note'));finish('승인을 기록하고 모의 PG 결과를 기다립니다.');break;
      }
      case 'report':{
        const item=choose(reportCases(),'report');item.source.status=str('status');
        record('report-'+item.id,str('status')+' · '+str('note'));finish('신고 사건의 처리 근거를 저장했습니다.');break;
      }
    }
  }
  function actions(button) {
    const type=button.dataset.wact;
    const ws=data();
    if(type==='pg') {
      const item=choose(refundCases(),'refund');
      if(!['PG 확인 중','검토 승인'].includes(item.status)) return;
      if(item.id==='reader'){app().state.subscription.refundStatus='환불 완료';app().state.subscription.renewing=false;app().state.subscribed=false;}
      else ws.refunds[item.id]='환불 완료';
      record('refund-'+item.id,'모의 PG 환불 완료 확인');finish('모의 환불 완료를 반영했습니다.');
    } else if(type==='reconcile') {
      if(ws.reconciled) return;
      ws.reconciled=true;record('reconcile','P-1102 · 기존 이체 요청과 결과 대조 완료');finish('기존 요청의 대사 결과가 일치합니다.');
    } else if(type==='hold'){
      view.refund=button.dataset.refund;
    } else if(type==='csv') {
      const week=selectedWeek(), row=week.moon, book=app().books.find(b=>b.id==='moon');
      const rows=[['작품명','첫 회 공개 버전','집계 기간','유효 감상','재방문 독자','새 팔로우'],[book.title,publishedVersion(),weekLabel(week),weeklyTotal(row),row.returning,row.follows]];
      const file=new Blob(['\uFEFF'+rows.map(r=>r.join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
      const url=URL.createObjectURL(file), link=document.createElement('a');
      link.href=url;link.download=book.title.replaceAll(' ','-')+'-'+week.start+'-주간-성과.csv';document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);app().notify('주간 성과 CSV를 준비했습니다.');
    }
  }
  function bind() {
    const root=document.querySelector('#app-content .ws');
    if (!root) return;
    root.addEventListener('change',event=>{
      const route=event.target.closest('[data-wroute]');
      if (route) {app().go(route.value);return;}
      const select=event.target.closest('[data-wselect]');
      if (!select) return;
      const key=select.dataset.wselect;
      view[key]=select.value;app().render();
      document.querySelector('[data-wselect="'+key+'"]')?.focus({preventScroll:true});
    });
    root.addEventListener('submit',event=>{
      const form=event.target.closest('[data-wform]');
      if(!form) return;
      event.preventDefault();submit(form,event.submitter?.value);
    });
    root.addEventListener('click',event=>{
      const button=event.target.closest('[data-wact]');
      if(button) actions(button);
    });
  }
  window.SubartWorkspace={render, bind, publishedVersion, artistPrice};
})();
