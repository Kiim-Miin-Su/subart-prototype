# Subart 프로토타입

[GitHub Pages에서 열기](https://kiim-miin-su.github.io/subart-prototype/) · [로컬 HTML](index.html)

브라우저에서 열면 데스크톱과 모바일이 같은 작품과 상태를 사용한다. 권장 확인 크기는 데스크톱 1440×900, iPhone 15 Pro 세로 393×852 CSS 픽셀이다.

## 화면

| 진입점 | 동작 |
| --- | --- |
| [홈](index.html#home) | 추천작 첫 화, 작가 팔로우, 작품 검색과 저장 |
| [내 서재](index.html#library) | 읽던 문단 복원, 회차·저장 작품·구독 관리 |
| [커뮤니티](index.html#community) | 작가의 공개 개정 소식, 피드백 작성과 신고 |
| [창작자 작업실](index.html#studio/rights) | 권리 제출, 버전 등록, 작품 반응, 지급 명세, 성과 내보내기 |
| [운영 콘솔](index.html#ops/review) | 공개 심사, 모의 환불, 지급 대사, 신고 처리 |

『달의 우체국』 1화는 처음에 38%까지 읽은 상태다. 내 서재에서 이어읽기를 누르고 본문을 조금 더 읽은 뒤 돌아오면 새 위치를 확인할 수 있다. 운영 콘솔에서 다음 버전을 승인하면 새 버전은 회차 처음부터 열린다.

상태는 현재 브라우저의 localStorage 키 `subart.prototype.v1`에 저장한다. 초기 예시로 돌아가려면 개발자 도구의 사이트 저장소에서 이 키만 지우고 새로 고친다. 브라우저에서 실제 결제나 송금이 발생하지 않는다. 권리 증빙으로 선택한 파일은 이름만 기록하며 외부로 전송하지 않는다.

## GitHub Pages

별도 빌드가 없다. 이 폴더의 내용을 Pages 게시 루트에 복사하면 사이트 첫 주소에서 열린다. 저장소의 `docs/`를 게시 루트로 선택하고 현재 디렉터리 구조를 유지하면 진입 경로는 `/<저장소명>/builder/prototype/`다. 해시로 각 화면에 이동하므로 회차나 작업실 주소를 직접 열 수 있다.

## 소스와 시안

`index.html`은 탐색과 대화상자의 구조를, `styles.css`는 공통 레이아웃과 홈을 정의한다. `app.js`는 화면 이동, 검색, 로컬 저장을 맡는다. `catalog.js`에는 예시 작품과 원문이 있다. 독자 화면은 `reader.js`와 `reader.css`, 창작자·운영자 화면은 `workspace.js`와 `workspace.css`에서 편집한다.

[Stitch 디자인 시스템](.stitch/DESIGN.md) · [데스크톱 PDF](design/desktop_v1.3.pdf) · [데스크톱 SVG](design/desktop.svg) · [iPhone 15 Pro PDF](design/iphone15pro_v1.3.pdf) · [iPhone 15 Pro SVG](design/iphone15pro.svg)

PDF와 SVG에는 각 화면의 첫 뷰포트를 담았다. PDF는 화면별 책갈피와 내부 이동을 지원한다. SVG 글자는 윤곽선으로 보존하고, 문구와 동작은 HTML·JS 원본에서 편집한다.

## 설계 화면과 주소

| 화면 ID | 기능 | 주소 |
| --- | --- | --- |
| SCR-U01 | F-04 홈 | [표지 서가](index.html#home) |
| SCR-U06 | F-06 내 서재 | [이어읽기](index.html#library) |
| SCR-U07 | F-04 커뮤니티 | [작가와 독자](index.html#community) |
| SCR-U02 | F-04·06·08 감상 | [1화 본문](index.html#read/moon/1) |
| SCR-U03 | F-05 구독 | [구독권 선택](index.html#subscribe) |
| SCR-U04 | F-05 환불·해지 | [구독 관리](index.html#account) |
| SCR-U05 | F-05·08 신고 | [작품 신고](index.html#report/moon/1) |
| SCR-C01 | F-01 권리 | [권리 등록](index.html#studio/rights) |
| SCR-C02 | F-02·05 개정 | [작품과 버전](index.html#studio/versions) |
| SCR-C03 | F-06 감상 집계 | [작품 반응](index.html#studio/insights) |
| SCR-C04 | F-07 지급 | [지급 명세](index.html#studio/payout) |
| SCR-C05 | F-09 공개 종료 | [성과 내보내기](index.html#studio/export) |
| SCR-A01 | F-03 검토 | [작품 심사와 재심](index.html#ops/review) |
| SCR-A02 | F-05 환불 | [환불 처리](index.html#ops/refunds) |
| SCR-A03 | F-07 정산 | [지급 보류와 대사](index.html#ops/payout) |
| SCR-A04 | F-05·08 신고 | [신고와 소명](index.html#ops/reports) |
