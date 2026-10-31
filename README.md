# 의료기기 수출 도우미

사이트: https://lmo052034.github.io/med-export-helper/

수출을 처음 준비하는 의료기기 기업을 위한 웹앱입니다 (React + Tailwind + shadcn/ui, GitHub Pages 배포). 화면 구성은 **2025 KOTRA AI 활용 우수사례집**의 순서를 그대로 따릅니다. 로그인 없이 브라우저에서 바로 열립니다.

화면에 미리 들어 있는 회사·제품(한결메디칼 HG-200)은 **가상 예시**입니다. 홈 화면에서 우리 회사 정보로 바꾸면 모든 페이지가 함께 바뀝니다.

| 단계 | 페이지 | 사례집 | 하는 일 |
|---|---|---|---|
| 01 | `#/readiness` 수출 준비 진단 | 01 AI 수출비서 | 8단계 수출 여정으로 52개 기준([docs/criteria.md](docs/criteria.md)) 점검, 먼저 할 일 5가지, 단계별 AI 질문 |
| 02 | `#/programs` 지원사업 캘린더 | 02-1 무역투자24 AI 큐레이션 | 정부·KOTRA·한국의료기기협동조합 공고를 매일 모아 추천·달력·타임라인으로 보기, .ics 내보내기 |
| 03 | `#/market` 수출할 나라 고르기 | 02-3 TriBIG, 06 시장정보 조사 | 후보국 2–3곳을 같은 기준으로 비교 |
| 04 | `#/compliance` HS·관세·인증 확인 | 05 규제정보 전파 | HS 분류 근거, 수입국 관세·FTA, 인허가 일정, AI 답 확인 |
| 05 | `#/promo` 홍보자료 만들기 | 02-2 buyKOREA, 03 AI무역지원센터 | 바이코리아 등록문, LinkedIn 글, 1분 영상 대본, 과장 표현 점검 |
| 06 | `#/buyer` 바이어 찾기·상담 | 08 바이어 매칭, 07 상담일지 | 매칭용 제품 설명, 바이어 고르는 표, 상담 대본, 상담일지·후속 메일 |
| 07 | `#/deal` 견적서·인보이스 | AI 수출비서 6·7단계 | 제안 메일·견적서·인보이스 동시 생성, 조건 불일치·Incoterms 검사 |
| 08 | `#/log` AI 답 확인 기록 | 09 근거를 보여 주는 AI | AI 답과 공식자료 확인 결과 모으기, CSV |
| + | `#/cases` KOTRA 사례 | 사례 11개 | 사례별로 우리 회사가 할 일과 연결된 페이지 |

## 지원사업 공고 매일 모으기

`scripts/collect-notices.mjs`가 매일 06:00(KST)에 공고를 모아 `tools/data/notices.js`를 갱신합니다 (`.github/workflows/notices.yml`). 외부 패키지는 쓰지 않습니다.

| 출처 | 모으는 것 | 방법 |
|---|---|---|
| 기업마당 지원사업정보 API | 중소벤처기업부·산업통상부·보건복지부·KOTRA 등 수출·해외전시 공고 | 공식 Open API (인증키 필요) |
| 한국보건산업진흥원 게시판 | 한국의료기기협동조합 등 기관별 교육·행사, 의료기기 수출 공고 | 공개 목록 페이지 (robots.txt 확인 후) |
| 직접 확인 (`scripts/seed-notices.json`) | 공식 공고문을 사람이 확인해 넣은 항목 | 수동 |

한국의료기기협동조합·중기부·기업마당 사이트는 robots.txt가 자동 수집을 막고 있어 직접 긁지 않습니다. 대신 공식 API와 협동조합 홈페이지 링크로 연결합니다.

켜는 방법:

1. [기업마당](https://www.bizinfo.go.kr/) 정책정보 개방(API) 메뉴에서 지원사업정보 API 인증키를 신청합니다.
2. 저장소 Settings → Secrets and variables → Actions에 `BIZINFO_KEY`로 등록합니다.
3. Settings → Pages → Source를 **GitHub Actions**로 바꿉니다.
4. main에 병합하면 매일 수집 → 커밋 → Pages 재배포가 자동으로 이어집니다. Actions 탭에서 `Collect support notices`를 수동 실행할 수도 있습니다.

인증키가 없으면 기업마당은 건너뛰고, 확인된 공고와 KHIDI 게시판만으로 화면이 동작합니다. 수집기는 마감 120일이 지난 공고를 지웁니다. 공고 내용은 항상 원문 링크에서 다시 확인하세요.

## 실행

- 로컬: `npm install` → `npm run dev`
- 배포용 빌드: `npm run build` (main에 push하면 Actions가 자동으로 빌드·배포)
- 화면 코드: `src/pages/` (페이지), `src/components/ui/` (shadcn/ui 부품), `src/components/` (공통 부품·화면 틀), `src/lib/` (기준·사례·공고 데이터)
- 수집기 시험: `BIZINFO_KEY=… node scripts/collect-notices.mjs`

## 데이터 원칙

- 공고는 공식 원문에서 확인한 것만 넣고, 날짜가 이상한 공고는 주의 문구를 붙였습니다.
- 세율·인증 기간은 비워 두거나 "추정"으로 표시했습니다. 공식자료로 확인한 뒤 체크하세요.
- 입력값은 각자 브라우저(localStorage)에만 저장됩니다.

## UI 검증

React · Tailwind CSS · shadcn/ui(Radix) · Lucide를 기반으로 공통 컴포넌트를 관리합니다.

- `npm run build`: 배포용 빌드
- `npx playwright install chromium` 후 `npm test`: 주요 10개 화면의 데스크톱·모바일 표시, 가로 넘침, 메뉴·대화상자의 키보드 동작, 회사정보 저장, 탭 이동 검증
- PR의 UI checks가 브라우저 검증을 실행하고 화면 캡처를 Actions artifact로 보관합니다.
