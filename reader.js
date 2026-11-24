/* Reader-facing screens share the catalog and browser-local demo state with the rest of Subart. */
(() => {
  'use strict';
  const app = () => window.Subart;
  const escape = value => app().escape(String(value ?? ''));
  const encoded = value => encodeURIComponent(String(value));
  const bookById = id => app().books.find(book => book.id === id);
  const firstBook = () => bookById('moon') || app().books[0];
  const root = () => document.getElementById('app-content');
  const won = n => Number(n).toLocaleString('ko-KR') + '원';
  const date = n => Number.isFinite(n) ? new Intl.DateTimeFormat('ko-KR', {month:'long', day:'numeric'}).format(new Date(n)) : '확인 전';
  const uid = () => window.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  let leaveReading = null;
  const plans = {
    topic: {label: '웹소설 주제별', price: 3900, note: '웹소설 분야의 구독 회차'},
    artist: {label: '이담 작가', price: 2900, note: '이담이 공개한 작품의 구독 회차'},
    all: {label: '올패스', price: 4900, note: '모든 분야의 구독 대상 회차'}
  };

  const priceFor = id => id === 'artist' ? (window.SubartWorkspace?.artistPrice?.() ?? plans.artist.price) : plans[id].price;

  function version(book, index) {
    const change = book.id === 'moon' && index === 0 && window.SubartWorkspace?.publishedVersion?.();
    return change || book.episodes[index].version || 'v1';
  }
  function planIncludes(plan, book, artist = firstBook().author) {
    if (plan === 'topic') return (book.category ?? '웹소설') === '웹소설';
    if (plan === 'artist') return book.author === artist;
    return plan === 'all' && !book.allPassExcluded;
  }
  function access(book, index) {
    const ep = book?.episodes[index];
    if (!ep || book.published === false || ep.published === false ||
        (book.id === 'moon' && window.SubartWorkspace?.isWithdrawn?.())) return 'closed';
    if (ep.free) return 'free';
    const {subscribed, subscription} = app().state;
    if (!subscribed || (subscription?.endsAt && Date.now() >= subscription.endsAt)) return 'locked';
    return planIncludes(subscription?.plan ?? 'topic', book, subscription?.artist) ? 'open' : 'locked';
  }
  function routeBook(parts, offset = 1) {
    const book = bookById(parts[offset]);
    const chapter = Number(parts[offset + 1] ?? '1');
    return book && Number.isInteger(chapter) && chapter > 0 && chapter <= book.episodes.length ? {book, index: chapter - 1} : null;
  }
  const linkToRead = (book, index, resume = false) => '#read/' + encoded(book.id) + '/' + (index + 1) + (resume ? '/continue' : '');
  const linkToFeed = (book, index) => '#community/all/' + encoded(book.id) + '/' + (index + 1);
  const linkToReport = (book, index, feedbackId = '') => '#report/' + encoded(book.id) + '/' + (index + 1) + (feedbackId ? '/' + encoded(feedbackId) : '');
  const cover = (book, cls = '') => '<img class="rd-cover ' + cls + '" src="' + escape(book.id === 'moon' ? './assets/moon-small.webp' : book.cover) + '" alt="' + escape(book.title) + ' 표지">';
  const arrow = '<span class="rd-arrow" aria-hidden="true">→</span>';
  const link = (url, text, cls = '') => '<a class="rd-link ' + cls + '" href="' + escape(url) + '">' + escape(text) + '</a>';
  const action = (url, text) => '<a class="rd-button" href="' + escape(url) + '">' + escape(text) + arrow + '</a>';
  const header = (title, aside = '') => '<header class="rd-heading"><h1>' + escape(title) + '</h1>' + aside + '</header>';
  function empty(message, url = '#home', label = '홈으로 가기') {
    return '<div class="rd-empty"><p>' + escape(message) + '</p>' + link(url, label + ' →') + '</div>';
  }
  function page(content, extra = '') {
    return '<div class="rd-page ' + extra + '"><div class="rd-wrap">' + content + '</div></div>';
  }
  function progressFor(book, index) {
    const {state} = app();
    const latest = state.progress[book.id];
    const p = index === undefined || latest?.episode === index ? latest : state.chapterProgress?.[book.id]?.[index];
    if (!p || !Number.isInteger(p.episode) || !book.episodes[p.episode]) return null;
    const last = Math.max(1, book.episodes[p.episode].paragraphs.length - 1);
    const position = Math.max(0, Math.min(last, Number(p.paragraph) || 0));
    const percent = p.version === version(book, p.episode) ? Math.round(100 * position / last) : 0;
    return {...p, percent};
  }
  function progressLine(percent) {
    return '<div class="rd-progress-line"><progress max="100" value="' + percent + '" aria-label="읽은 위치">' + percent + '%</progress><span>' + percent + '% 읽음</span></div>';
  }
  function episodes(book, current) {
    return '<section class="rd-episodes"><div class="rd-section-title"><h2>' + escape(book.title) + ' 회차</h2><span>첫 화부터</span></div><ol class="rd-episode-list">' +
      book.episodes.map((ep, i) => {
        const isCurrent = current?.episode === i;
        const status = access(book, i);
        const meta = status === 'closed' ? '공개 종료' : ep.free ? '무료 미리보기' : '구독 회차';
        return '<li><a class="rd-episode' + (isCurrent ? ' is-current' : '') + '" href="' + linkToRead(book, i, !!progressFor(book,i)) + '"><span class="rd-number">' + String(i + 1).padStart(2, '0') + '</span><span class="rd-episode-name"><strong>' + escape(ep.title) + '</strong><small>' + escape(version(book, i)) + ' · ' + meta + '</small></span><span class="rd-episode-end">' + (isCurrent ? '읽는 중' : status === 'locked' ? '구독' : '→') + '</span></a></li>';
      }).join('') + '</ol></section>';
  }
  function library() {
    const {books, state} = app();
    const recent = books.filter(b => progressFor(b)).sort((a, b) => Number(state.progress[b.id].updated || 0) - Number(state.progress[a.id].updated || 0));
    const book = recent[0];
    const p = book && progressFor(book);
    const saved = books.filter(b => state.saved.includes(b.id));
    const lastRead = book ? '<div class="rd-current"><div class="rd-current-cover">' + cover(book) + '</div><div class="rd-current-info"><span class="rd-byline">' + escape(book.author) + ' · ' + escape(book.genre) + '</span><h3>' + escape(book.title) + '</h3><p>' + (p.episode + 1) + '화 ' + escape(book.episodes[p.episode].title) + '</p>' + progressLine(p.percent) + '</div></div>' +
      action(linkToRead(book, p.episode, true), '마지막 위치에서 이어읽기') : empty('아직 읽은 작품이 없습니다.', '#home', '서가에서 작품 찾기');
    const otherBooks = recent.slice(1);
    const history = otherBooks.length ? more('이전에 읽은 작품 ' + otherBooks.length + '편', '<ul class="rd-history-list">' + otherBooks.map(b => {
      const mark = progressFor(b);
      return '<li><a class="rd-link" href="' + linkToRead(b, mark.episode, true) + '">' + escape(b.title) + ' · ' + (mark.episode + 1) + '화</a><span>' + mark.percent + '% 읽음</span></li>';
    }).join('') + '</ul>') : '';
    const savedGrid = saved.length ? '<ul class="rd-saved-grid">' + saved.map(b => '<li><a href="' + linkToRead(b, progressFor(b)?.episode || 0, !!progressFor(b)) + '">' + cover(b) + '<span><strong>' + escape(b.title) + '</strong><small>' + escape(b.author) + ' · ' + escape(b.genre) + '</small></span></a><button class="rd-remove" type="button" data-reader-action="unsave" data-book="' + escape(b.id) + '" aria-label="' + escape(b.title) + ' 저장 해제">저장 해제</button></li>').join('') + '</ul>' : empty('저장한 작품이 없습니다.', '#home', '작품 둘러보기');
    return page(header('내 서재', link('#account', '구독 관리 →')) + '<div class="rd-library-layout"><section class="rd-recent"><h2>최근 읽은 작품</h2>' + lastRead + history + '</section>' + (book ? episodes(book, p) : '') +
      '</div><section class="rd-saved"><div class="rd-section-title"><h2>저장한 작품</h2><span>' + saved.length + '편</span></div>' + savedGrid + '</section>', 'rd-library');
  }
  function more(label, content) {
    return '<details class="rd-more"><summary>' + escape(label) + '</summary>' + content + '</details>';
  }
  function followButton(book) {
    const selected = app().state.following.includes(book.author);
    return '<button class="rd-toggle" type="button" data-reader-action="follow" data-book="' + escape(book.id) + '" aria-pressed="' + selected + '">' + (selected ? '팔로잉' : '작가 팔로우') + '</button>';
  }
  function read(parts) {
    const target = routeBook(parts);
    if (!target) return page(header('작품을 찾을 수 없습니다') + empty('요청한 작품이나 회차를 확인해 주세요.'));
    const {book, index} = target;
    const ep = book.episodes[index];
    const permission = access(book, index);
    const path = encoded(book.id) + '/' + (index + 1);
    const saved = app().state.saved.includes(book.id);
    const p = progressFor(book, index);
    const changed = parts[3] === 'continue' && p?.episode === index && p.version !== version(book, index);
    const context = '<a class="rd-back" href="#library">← 내 서재</a>';
    const title = '<header class="rd-reading-head"><p class="rd-byline">' + escape(book.title) + ' <span>/</span> ' + (index + 1) + '화</p><h1>' + escape(ep.title) + '</h1><p>' + escape(book.author) + ' · 개정 ' + escape(version(book, index)) + ' · ' + (ep.free ? '무료 미리보기' : '구독 회차') + '</p></header>';
    if (permission === 'closed') return page(context + title + empty('공개가 종료된 작품입니다.', '#home', '다른 작품 찾기'), 'rd-reading');
    if (permission === 'locked') {
      const active = activeSubscription();
      const message = active ? '현재 이용권의 구독 범위에 이 작품이 포함되지 않습니다.' : '이 작품을 포함하는 이용권을 선택하면 ' + (index + 1) + '화를 펼칠 수 있습니다.';
      return page(context + title + '<div class="rd-gate"><h2>구독으로 열리는 회차</h2><p>' + message + '</p>' +
        (active ? action('#account', '내 이용권 확인') : action('#subscribe/' + path, '구독권 보기')) + '</div>', 'rd-reading');
    }
    return page(context + '<div class="rd-read-layout"><article class="rd-article">' + title +
      (changed ? '<p class="rd-notice" role="status">새 개정판이 공개되어 이 회차의 처음부터 엽니다.</p>' : '') +
      '<div class="rd-prose">' + ep.paragraphs.map((text, i) => '<p data-paragraph="' + i + '">' + escape(text) + '</p>').join('') + '</div>' +
      '<div class="rd-read-next">' + (book.episodes[index + 1] ? action(linkToRead(book, index + 1), '다음 회차 읽기') : link('#library', '내 서재로 돌아가기 →')) + '</div></article>' +
      '<aside class="rd-reader-aside" aria-label="작품 정보"><div class="rd-read-controls"><span class="rd-byline">현재 회차</span><h2>' + escape(book.title) + '</h2><p>' + (index + 1) + '화 · ' + escape(ep.title) + '</p><div id="rd-live-position">' + progressLine(parts[3] === 'continue' && p?.episode === index ? p.percent : 0) + '</div>' +
      '<div class="rd-actions">' + followButton(book) + '<button class="rd-toggle" type="button" data-reader-action="save" data-book="' + escape(book.id) + '" aria-pressed="' + saved + '">' + (saved ? '저장됨' : '서재에 저장') + '</button></div><hr>' +
      link(linkToFeed(book, index), '이 회차의 커뮤니티 →') + '<br>' + link(linkToReport(book, index), '작품 신고') + '</div></aside></div>', 'rd-reading');
  }
  function authorNote(note) {
    const book = bookById(note.bookId);
    const index = note.episode;
    const releaseDate = note.dateLabel || date(new Date(note.date + 'T12:00:00').getTime());
    const time = note.dateLabel ? '<span>' + escape(releaseDate) + '</span>' : '<time datetime="' + escape(note.date) + '">' + escape(releaseDate) + '</time>';
    const envelope = '<span class="rd-avatar" aria-hidden="true"><svg viewBox="0 0 44 44" width="34" height="34" fill="none"><g transform="rotate(-13 22 22)"><rect x="6" y="11" width="32" height="23" rx="1" fill="#e8ca9b"/><path d="m7 12 15 12 15-12m-30 20 11-10m19 10L26 22" stroke="#795c41" stroke-width="1.5"/></g></svg></span>';
    return '<article class="rd-author-note"><header>' + envelope + '<div><strong>' + escape(book.author) + '</strong><small>' + escape(book.title) + ' 작가</small></div>' +
      '<div class="rd-post-meta"><span class="rd-post-date">' + time + '</span>' + link(linkToReport(book, index), '작품 신고') + '</div></header>' +
      '<h2>' + escape(note.title) + '</h2><p>' + escape(note.text).replace(/\n/g, '<br>') + '</p>' +
      '<a class="rd-attachment" href="' + linkToRead(book, index) + '">' + cover(book) + '<div><span>' + (index + 1) + '화 · 개정 ' + escape(note.version) +
      '</span><strong>' + escape(book.title) + '</strong><p>' + escape(book.episodes[index].title) + '</p><b>회차 읽기 →</b></div></a></article>';
  }
  function feedbackList(comments) {
    return '<ul class="rd-feedback-list">' + comments.map(f => {
      const book = bookById(f.bookId);
      return '<li><a href="' + linkToRead(book, f.episode) + '">' + escape(book.title) + ' · ' + (f.episode + 1) + '화</a><p>' + escape(f.text) + '</p><div><span>' +
        escape(f.author) + ' · 독자</span>' + link(linkToReport(book, f.episode, f.id), '신고') + '</div></li>';
    }).join('') + '</ul>';
  }
  function community(parts) {
    const all = parts[1] !== 'following';
    const explicit = parts[2] ? routeBook(parts, 2) : null;
    if (parts[2] && !explicit) return page(header('커뮤니티') + empty('연결된 회차를 찾을 수 없습니다.'));
    const {books, state} = app();
    const suffix = explicit ? '/' + encoded(explicit.book.id) + '/' + (explicit.index + 1) : '';
    const tabs = '<nav class="rd-filters" aria-label="커뮤니티 글 범위"><a href="#community/all' + suffix + '"' + (all ? ' aria-current="page"' : '') + '>전체 글</a><a href="#community/following' + suffix + '"' + (!all ? ' aria-current="page"' : '') + '>팔로잉</a></nav>';
    function matches(book, index) {
      return book && book.episodes[index] && (all || state.following.includes(book.author)) &&
        (!explicit || (explicit.book.id === book.id && explicit.index === index)) && access(book, index) !== 'closed';
    }
    const notes = window.SubartNotices.filter(n => matches(bookById(n.bookId), n.episode))
      .sort((a, b) => b.date.localeCompare(a.date));
    // A newly approved manuscript replaces the announcement for its previous edition.
    const previous = notes.findIndex(n => n.bookId === 'moon' && n.episode === 0 && n.version === 'v2');
    if (previous >= 0) {
      const current = version(bookById('moon'), 0);
      const release = state.workspace?.versions?.find(v => 'v' + v.n === current && v.status === '공개 중');
      if (current !== 'v2' && release) {
        const [note] = notes.splice(previous, 1);
        const approval = state.workspace.log?.find(entry => entry.id === current && entry.message.startsWith('승인 · '));
        notes.unshift({...note, title:'새 개정판을 공개했어요.', version:current, text:release.memo,
          dateLabel:approval ? date(approval.time) : release.date});
      }
    }
    const comments = state.feedback.filter(f => matches(bookById(f.bookId), f.episode));
    const options = books.flatMap(book => book.episodes.flatMap((ep, i) => matches(book, i) ?
      ['<option value="' + escape(encoded(book.id) + '/' + (i + 1)) + '">' + escape(book.title) + ' · ' + (i + 1) + '화 ' + escape(ep.title) + '</option>'] : [])).join('');
    if (!all && !options) return page(header('커뮤니티') + tabs + empty('팔로우한 작가의 공개 글이 없습니다.', '#community/all' + suffix, '전체 글 보기'), 'rd-community');
    const notices = notes.length ? authorNote(notes[0]) + (notes.length > 1 ? more('지난 작가 소식 ' + (notes.length - 1) + '건', notes.slice(1).map(authorNote).join('')) : '') :
      '<h2>' + escape(explicit?.book.title || '작가 소식') + '</h2><p class="rd-empty">등록된 작가 소식이 없습니다.</p>';
    const form = options ? '<details class="rd-compose"><summary>피드백 남기기</summary><form data-reader-form="feedback"><label>작품과 회차<select name="target" required>' + options + '</select></label><label>피드백<textarea name="message" rows="3" required maxlength="500" placeholder="이 회차를 읽고 어떤 점이 기억에 남았나요?"></textarea></label><button class="rd-button" type="submit">등록하기</button></form></details>' : '';
    const feedback = comments.length ? feedbackList(comments.slice(0, 3)) +
      (comments.length > 3 ? more('피드백 ' + (comments.length - 3) + '개 더 보기', feedbackList(comments.slice(3))) : '') :
      '<p class="rd-empty">아직 이곳에 남긴 피드백이 없습니다.</p>';
    return page(header('커뮤니티') + tabs + '<div class="rd-feed-layout"><section aria-label="작가 소식">' + notices + '</section>' +
      '<section class="rd-feedback"><div class="rd-section-title"><h2>독자 피드백</h2><span>' + comments.length + '개</span></div>' + form + feedback + '</section></div>', 'rd-community');
  }
  function activeSubscription() {
    const {subscribed, subscription} = app().state;
    return !!subscribed && (!subscription?.endsAt || subscription.endsAt > Date.now());
  }

  function readInsteadOfSubscribe(parts) {
    const target = routeBook(parts);
    return target && access(target.book, target.index) !== 'locked' ? linkToRead(target.book, target.index) : null;
  }

  function planRow(id, plan, target, selectedId) {
    const excluded = target && !planIncludes(id, target.book);
    const status = target ? '<span class="rd-plan-scope">' + (excluded ? '이 회차 제외' : '이 회차 포함') + '</span>' : '';
    return '<label class="rd-plan"><input type="radio" name="plan" value="' + id + '"' +
      (id === selectedId ? ' checked' : '') + (excluded ? ' disabled' : '') + '>' +
      '<span class="rd-choice-mark" aria-hidden="true">' + app().icon('bookmark', 16) + '</span>' +
      '<span class="rd-plan-copy"><strong>' + escape(plan.label) + '</strong><small>' + escape(plan.note) + '</small></span>' +
      '<span class="rd-plan-terms"><b>월 ' + won(priceFor(id)) + '</b>' + status + '</span></label>';
  }

  function subscribe(parts) {
    const target = routeBook(parts);
    if (parts[1] && !target) return page(header('회차를 찾을 수 없습니다') + empty('작품과 회차 주소를 확인해 주세요.'));
    const back = target ? linkToRead(target.book, target.index) : '#library';
    if (activeSubscription()) {
      return page(header('구독권 선택') + '<p class="rd-notice">이용 중인 구독권이 있습니다.</p>' +
        action('#account', '내 이용권 확인') + link(back, target ? '회차로 돌아가기' : '내 서재'), 'rd-service');
    }
    const available = Object.keys(plans).find(id => !target || planIncludes(id, target.book));
    const exclusions = app().books.filter(book => book.allPassExcluded &&
      book.episodes.some((ep, i) => !ep.free && access(book, i) !== 'closed'));
    const excludedText = exclusions.length ? '올패스 제외 작품 · ' + exclusions.map(b => b.title).join(', ') : '올패스 제외 작품 없음';
    const context = target ? '<aside class="rd-origin" aria-label="선택한 작품">' + cover(target.book) +
      '<div><p class="rd-byline">' + escape(target.book.author) + ' · ' + escape(target.book.genre) +
      '</p><h2>' + escape(target.book.title) + '</h2><p>' + (target.index + 1) + '화 · ' +
      escape(target.book.episodes[target.index].title) + '</p></div></aside>' : '';
    const reportLink = target ? link(linkToReport(target.book, target.index), '개인 송금 유도 신고') :
      more('개인 송금 유도 신고', '<ul class="rd-report-works">' + app().books.flatMap(book => {
        const i = book.episodes.findIndex((ep, index) => access(book, index) !== 'closed');
        return i < 0 ? [] : ['<li>' + link(linkToReport(book, i), book.title + ' 신고') + '</li>'];
      }).join('') + '</ul>');
    const form = '<form id="rd-subscribe" class="rd-purchase" data-reader-form="subscribe">' +
      '<fieldset><legend>이용권 비교</legend><p class="rd-plan-caption">월 예시 요금</p><div class="rd-plan-grid">' +
      Object.entries(plans).map(([id, plan]) => planRow(id, plan, target, available)).join('') +
      '</div></fieldset><p class="rd-exclusions">' + escape(excludedText) + '</p>' +
      '<div class="rd-pay-summary"><div class="rd-review-line"><h2>이용 조건</h2>' +
      (available ? '<output class="rd-selected-price">' + escape(plans[available].label) + ' · 월 ' + won(priceFor(available)) + '</output>' : '') +
      '</div><p>한 달 동안 이용하며, 내 서재에서 갱신 해지와 환불을 신청할 수 있습니다.</p>' +
      '<div class="rd-transfer"><span>개인 계좌로 송금하지 마세요.</span>' + reportLink + '</div>' +
      (available ? '<label class="rd-consent"><input name="agree" type="checkbox" required> 실제 청구가 없는 모의 구독임을 확인했습니다.</label>' +
        '<button class="rd-button" type="submit" disabled>모의 구독 시작</button>' : '<p>이 회차를 포함하는 이용권이 없습니다.</p>') + '</div></form>';
    return page(header('구독권 선택', link('#account', '구독 관리 →')) +
      '<div class="rd-subscribe-layout' + (target ? '' : ' is-general') + '">' + context + form + '</div>' +
      link(back, target ? '← 회차로 돌아가기' : '← 내 서재', 'rd-subscribe-back'), 'rd-subscribe');
  }

  function account() {
    const sub = app().state.subscription;
    const active = activeSubscription();
    const details = sub ? '<section class="rd-account-card"><span class="rd-byline">내 이용권</span><h2>' +
      escape(plans[sub.plan]?.label || '웹소설 주제별') + '</h2><dl class="rd-facts"><div><dt>상태</dt><dd>' +
      (active ? (sub.renewing ? '구독 중' : '갱신 해지됨') : '이용 종료') +
      '</dd></div><div><dt>모의 결제액</dt><dd>' + won(sub.price) + '</dd></div><div><dt>이용기간</dt><dd>' + escape(date(sub.startedAt)) + ' – ' + escape(date(sub.endsAt)) +
      '</dd></div><div><dt>환불 신청</dt><dd>' + escape(sub.refundStatus || '신청 내역 없음') + '</dd></div></dl>' +
      (active ? '<div class="rd-accounts-actions">' + (sub.renewing ? '<button class="rd-toggle" type="button" data-reader-action="cancel">다음 갱신 해지</button>' : '') +
        (!sub.refundStatus ? '<button class="rd-toggle" type="button" data-reader-action="refund">모의 환불 신청</button>' : '') + '</div>' : action('#subscribe', '구독권 다시 선택')) + '</section>' :
      '<section class="rd-account-card"><span class="rd-byline">내 이용권</span><h2>이용 중인 구독권이 없습니다.</h2><p>무료 미리보기와 팔로우는 구독 없이 이용할 수 있습니다.</p>' + action('#subscribe', '구독권 보기') + '</section>';
    return page(header('구독 관리', link('#library', '내 서재 →')) + details, 'rd-service');
  }

  function report(parts) {
    const target = parts[1] ? routeBook(parts) : {book:firstBook(), index:0};
    if (!target) return page(header('신고 접수') + empty('신고할 회차를 찾을 수 없습니다.'));
    const {book,index} = target;
    const id = parts[3] || '';
    const feedback = id && app().state.feedback.find(f => f.id === id && f.bookId === book.id && f.episode === index);
    if (id && !feedback) return page(header('피드백 신고') + empty('해당 피드백을 찾을 수 없습니다.', linkToFeed(book, index), '커뮤니티로 돌아가기'));
    const type = id ? '피드백' : '작품';
    const recent = app().state.reports.filter(r => r.bookId === book.id && r.episode === index && (r.feedbackId || '') === id);
    const cases = recent.length ? '<section class="rd-case-list"><h2>내 신고 내역</h2><ul>' + recent.map(r =>
      '<li><strong>' + escape(r.reason) + '</strong><span>' + escape(r.status) + '</span><small>사건 ' + escape(r.id) + '</small></li>').join('') + '</ul></section>' : '';
    return page(header(type + ' 신고', link(linkToFeed(book, index), '커뮤니티 →')) + '<div class="rd-service-grid"><section class="rd-report-context"><span class="rd-byline">신고 대상</span><h2>' + escape(book.title) + '</h2><p>' +
      (index + 1) + '화 · ' + escape(book.episodes[index].title) + '</p>' + (feedback ? '<blockquote>' + escape(feedback.text) + '<cite>' + escape(feedback.author) + ' · 독자</cite></blockquote>' : '') + cases + '</section>' +
      '<form class="rd-report-form" data-reader-form="report"><label>신고 사유<select name="reason" required><option value="">사유 선택</option>' +
      (id ? ['부적절한 피드백','개인정보 노출','광고·도배','기타'] : ['권리 침해','개인 계좌로 송금 유도','부적절한 내용','기타']).map(x => '<option>' + x + '</option>').join('') +
      '</select></label><label>추가 설명 <small>(선택)</small><textarea rows="4" name="detail" maxlength="500" placeholder="확인이 필요한 내용을 적어 주세요."></textarea></label><p>이 브라우저의 모의 운영 콘솔에 접수됩니다.</p><button class="rd-button" type="submit">신고 접수</button></form></div>', 'rd-service');
  }

  function render(parts) {
    const screens = {library, read, community, account, subscribe, report};
    return (screens[parts[0]] || library)(parts);
  }

  function trackReading(parts) {
    const target = routeBook(parts);
    const paragraphs = [...root().querySelectorAll('[data-paragraph]')];
    if (!target || !paragraphs.length) return;
    const {book,index} = target;
    const v = version(book, index);
    const state = app().state;
    const previous = progressFor(book, index);
    const resume = parts[3] === 'continue' && previous?.episode === index && previous?.version === v;
    let position = resume ? Math.min(paragraphs.length - 1, Math.max(0, Number(previous.paragraph) || 0)) : 0;
    let timer, frame;
    const persist = () => {
      clearTimeout(timer);
      const history = state.chapterProgress ||= {};
      const chapters = history[book.id] ||= {};
      const last = state.progress[book.id];
      if (last && !chapters[last.episode]) chapters[last.episode] = last;
      const reading = {episode:index, paragraph:position, version:v, updated:Date.now()};
      chapters[index] = reading;
      state.progress[book.id] = reading;
      app().save();
    };
    function positionChanged() {
      const top = window.innerHeight * .29;
      let next = 0;
      for (let i = 1; i < paragraphs.length && paragraphs[i].getBoundingClientRect().top <= top + 1; i++) next = i;
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
        next = paragraphs.length - 1;
      }
      if (next === position) return;
      position = next;
      const display = document.getElementById('rd-live-position');
      if (display) display.innerHTML = progressLine(Math.round(100 * next / Math.max(1, paragraphs.length - 1)));
      clearTimeout(timer);
      timer = setTimeout(persist, 180);
    }
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(positionChanged);
    }
    const onPageHide = () => persist();
    // Render may reset the viewport; restore once after layout, then listen for deliberate scrolling.
    frame = requestAnimationFrame(() => {
      if (resume && position > 0) {
        window.scrollTo({top:Math.max(0, window.scrollY + paragraphs[position].getBoundingClientRect().top - window.innerHeight * .29), behavior:'instant'});
      }
      persist();
      window.addEventListener('scroll', onScroll, {passive:true});
      window.addEventListener('pagehide', onPageHide);
    });
    leaveReading = () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onPageHide);
      cancelAnimationFrame(frame);
      persist();
    };
  }

  function submit(event, parts) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const {state} = app();
    if (form.dataset.readerForm === 'feedback') {
      const target = routeBook(['', ...String(data.get('target')).split('/')]);
      const text = String(data.get('message')).trim();
      if (!text) {
        form.elements.message.setCustomValidity('피드백을 입력해 주세요.');
        form.elements.message.reportValidity();
        return;
      }
      if (!target || access(target.book,target.index) === 'closed') return;
      state.feedback.unshift({id:uid(),bookId:target.book.id,episode:target.index,text:text.slice(0,500),author:'나',created:Date.now()});
      app().save(); app().render(); app().notify('피드백을 등록했습니다.');
    } else if (form.dataset.readerForm === 'report') {
      const target = parts[1] ? routeBook(parts) : {book:firstBook(),index:0};
      if (!target || !data.get('reason')) return;
      state.reports.unshift({id:'R-'+ uid().slice(0,8),bookId:target.book.id,episode:target.index,
        feedbackId:parts[3] || '',reason:String(data.get('reason')),detail:String(data.get('detail') || '').trim().slice(0,500),status:'접수 완료'});
      app().save(); app().render(); app().notify('신고를 접수했습니다.');
    } else if (form.dataset.readerForm === 'subscribe') {
      if (activeSubscription() || !data.get('agree')) return;
      const plan = String(data.get('plan'));
      const target = routeBook(parts);
      if (!Object.hasOwn(plans, plan) || (parts[1] && !target)) return;
      if (target && (access(target.book, target.index) !== 'locked' || !planIncludes(plan, target.book))) return;
      const now = new Date();
      const end = new Date(now);
      end.setDate(1); end.setMonth(end.getMonth() + 1);
      const lastDay = new Date(end.getFullYear(),end.getMonth()+1,0).getDate();
      end.setDate(Math.min(now.getDate(),lastDay));
      state.subscribed=true;
      state.subscription={plan,artist:firstBook().author,price:priceFor(plan),startedAt:now.getTime(),endsAt:end.getTime(),renewing:true,refundStatus:''};
      app().save(); app().notify('모의 구독이 시작되었습니다.');
      app().go(target ? linkToRead(target.book,target.index).slice(1) : 'account');
    }
  }

  function toggle(button) {
    const {state} = app();
    const act=button.dataset.readerAction;
    const book=bookById(button.dataset.book);
    if (['save','follow','unsave'].includes(act) && book) {
      const store = act==='follow' ? state.following : state.saved;
      const key = act==='follow' ? book.author : book.id;
      const ix=store.indexOf(key);
      if (ix>=0) store.splice(ix,1); else if (act!=='unsave') store.push(key);
      app().save();
      if (act === 'unsave') app().render();
      else {
        const selected=store.includes(key);
        button.setAttribute('aria-pressed',String(selected));
        button.textContent=act==='follow' ? (selected ? '팔로잉':'작가 팔로우') : (selected?'저장됨':'서재에 저장');
      }
      app().notify(act==='follow' ? (store.includes(key)?'작가를 팔로우합니다.':'팔로우를 해제했습니다.') : (store.includes(key)?'내 서재에 저장했습니다.':'서재에서 저장을 해제했습니다.'));
    } else if (act === 'cancel' && activeSubscription() && state.subscription.renewing) {
      state.subscription.renewing=false;
      app().save(); app().render(); app().notify('다음 갱신을 해지했습니다.');
    } else if (act === 'refund' && activeSubscription() && !state.subscription.refundStatus) {
      state.subscription.refundStatus='접수 중';
      app().save(); app().render(); app().notify('모의 환불을 신청했습니다.');
    }
  }
  function bind(parts) {
    for (const button of root().querySelectorAll('[data-reader-action]')) button.addEventListener('click', () => toggle(button));
    for (const form of root().querySelectorAll('[data-reader-form]')) {
      form.addEventListener('submit', event => submit(event,parts));
      if (form.dataset.readerForm==='subscribe') form.addEventListener('change', event => {
        if (event.target.name === 'plan') {
          const plan = event.target.value;
          form.querySelector('.rd-selected-price').textContent = plans[plan].label + ' · 월 ' + won(priceFor(plan));
          form.elements.agree.checked = false;
        }
        form.querySelector('[type="submit"]').disabled = !form.elements.agree.checked;
      });
      if (form.dataset.readerForm==='feedback') form.elements.message.addEventListener('input', e => e.target.setCustomValidity(''));
    }
    if (parts[0]==='read') trackReading(parts);
  }
  function leave() {
    if (leaveReading) { leaveReading(); leaveReading=null; }
  }
  window.SubartReader={render,bind,leave,readInsteadOfSubscribe};
})();
