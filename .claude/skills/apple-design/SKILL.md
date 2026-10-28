---
name: apple-design
description: 웹 화면을 Apple(iOS 26·macOS) 느낌의 깔끔하고 세련된 디자인으로 만들거나 고칠 때 사용. "애플처럼", "iOS 느낌", "깔끔하게/세련되게 바꿔줘" 같은 요청, 이 저장소(React + Tailwind v4 + shadcn/ui) 화면 리디자인에 적용.
---

# apple-design

Apple Human Interface Guidelines(HIG)와 iOS 26 UI Kit의 원칙을 웹(React + Tailwind v4 + shadcn/ui)에 옮기는 규칙이다.
목표는 "꾸밈을 더하는 것"이 아니라 **덜어내서 내용이 돋보이게** 하는 것이다.

## 1. 핵심 원칙

1. **내용이 주인공(Deference)**: 장식, 그라데이션, 그림자, 테두리를 최소화한다. 색은 의미가 있을 때만 쓴다.
2. **명확함(Clarity)**: 한 화면에 핵심 행동 1개. 큰 제목 → 짧은 설명 → 주요 버튼 순서.
3. **깊이(Depth)**: 층은 색 대비와 반투명 재질(blur)로 구분한다. 진한 그림자로 구분하지 않는다.
4. **일관성**: 아래 토큰 값만 쓴다. 임의의 px·색상 값을 새로 만들지 않는다.

## 2. 색상 토큰 (iOS 시스템 색)

| 용도 | 라이트 | 다크 |
|---|---|---|
| 배경 (systemBackground) | `#FFFFFF` | `#000000` |
| 묶음 배경 (systemGroupedBackground) | `#F2F2F7` | `#000000` |
| 카드/2단 배경 (secondarySystemGroupedBackground) | `#FFFFFF` | `#1C1C1E` |
| 3단 배경 | `#F2F2F7` | `#2C2C2E` |
| 본문 글자 (label) | `#000000` | `#FFFFFF` |
| 보조 글자 (secondaryLabel) | `rgba(60,60,67,0.6)` | `rgba(235,235,245,0.6)` |
| 3차 글자 (tertiaryLabel) | `rgba(60,60,67,0.3)` | `rgba(235,235,245,0.3)` |
| 구분선 (separator) | `rgba(60,60,67,0.29)` | `rgba(84,84,88,0.65)` |
| 채우기 (fill, 입력칸·회색 버튼) | `rgba(120,120,128,0.12)` | `rgba(118,118,128,0.24)` |
| 강조 (systemBlue) | `#007AFF` | `#0A84FF` |
| 성공 (systemGreen) | `#34C759` | `#30D158` |
| 경고 (systemOrange) | `#FF9500` | `#FF9F0A` |
| 오류 (systemRed) | `#FF3B30` | `#FF453A` |

- 강조색은 **하나만** 쓴다 (기본 systemBlue). 브랜드 색이 필요하면 강조색 하나를 그 색으로 바꾼다.
- 상태 색(초록·주황·빨강)은 배지·아이콘에만, 넓은 면에는 쓰지 않는다.
- 값은 HIG 공개 기준이며, Figma iOS 26 키트와 미세하게 다를 수 있다.

## 3. 글자 (Dynamic Type 기본 크기)

글꼴: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Pretendard", "Apple SD Gothic Neo", sans-serif` (한글은 Pretendard 유지).

| 스타일 | 크기/줄높이 | 굵기 | Tailwind 예 |
|---|---|---|---|
| Large Title | 34/41 | Bold | `text-[34px] leading-[41px] font-bold tracking-tight` |
| Title 1 | 28/34 | Bold | `text-[28px] leading-[34px] font-bold` |
| Title 2 | 22/28 | Bold | `text-[22px] leading-[28px] font-bold` |
| Title 3 | 20/25 | Semibold | `text-xl leading-[25px] font-semibold` |
| Headline | 17/22 | Semibold | `text-[17px] leading-[22px] font-semibold` |
| Body | 17/22 | Regular | `text-[17px] leading-[22px]` |
| Callout | 16/21 | Regular | `text-base leading-[21px]` |
| Subheadline | 15/20 | Regular | `text-[15px] leading-5` |
| Footnote | 13/18 | Regular | `text-[13px] leading-[18px]` |
| Caption 1 | 12/16 | Regular | `text-xs` |
| Caption 2 | 11/13 | Regular | `text-[11px] leading-[13px]` |

- 한 화면에 쓰는 스타일은 4개 이하. 굵기로 위계를 만들고, 색은 label/secondaryLabel 두 단계면 충분하다.
- 큰 제목은 `tracking-tight`, 본문은 기본 자간.

## 4. 간격·모양

- **8pt 그리드**: 4, 8, 12, 16, 20, 24, 32, 44 만 사용.
- 화면 좌우 여백: 모바일 16–20px, 데스크톱 콘텐츠 최대 너비 `max-w-3xl`~`max-w-5xl` 가운데 정렬.
- **터치 영역 최소 44×44px** (버튼·목록 행).
- 모서리: 카드·묶음 목록 `rounded-2xl`(16px 안팎), 입력칸 `rounded-xl`(10–12px), 주요 버튼은 캡슐 `rounded-full`(iOS 26 스타일).
- 그림자: 기본 없음. 떠 있는 요소(시트·팝오버)만 `shadow-[0_8px_30px_rgba(0,0,0,0.08)]` 정도.
- 테두리 대신 배경 대비(`#F2F2F7` 위에 흰 카드)로 묶음을 구분한다.

## 5. 컴포넌트 패턴

- **묶음 목록(Inset Grouped List)**: 회색 배경 위 흰 카드, 행 높이 44px 이상, 행 사이 구분선은 왼쪽 16px 들여서 시작, 오른쪽 끝에 `ChevronRight`(secondaryLabel 색). 목록 위 소제목은 Footnote·대문자 없이·secondaryLabel.
- **주요 버튼**: 강조색 배경 + 흰 글자, 캡슐, 높이 44–50px, 화면당 1개. 보조 버튼은 fill 배경 + 강조색 글자, 또는 글자만.
- **입력칸**: fill 배경, 테두리 없음, 포커스 시 강조색 2px 링.
- **세그먼트 컨트롤**: fill 배경 캡슐 안에 선택된 칸만 흰색 + 약한 그림자.
- **탭바/내비바**: 반투명 재질 `bg-white/70 backdrop-blur-xl` (다크 `bg-black/60`), 아래·위 구분선 0.5px separator.
- **시트/모달**: 아래에서 올라오는 시트, 위 모서리 `rounded-t-3xl`, 상단 손잡이(36×5px, 둥근 회색).
- **아이콘**: lucide-react를 SF Symbols 대신 사용, `strokeWidth={1.75}`, 글자 크기와 맞춤.

## 6. 움직임

- 짧고 부드럽게: `transition-all duration-200 ease-out`.
- 누를 때 `active:scale-[0.97] active:opacity-80`.
- 화면 전환·시트는 아래→위 슬라이드. 튀는 바운스·회전 금지.
- `prefers-reduced-motion`이면 애니메이션 끔.

## 7. 이 저장소에 적용하는 법

1. 색은 `src/index.css`의 `:root` / `.dark` shadcn 변수에 위 토큰을 매핑한다 (`--background`→systemGroupedBackground, `--card`→secondarySystemGroupedBackground, `--primary`→systemBlue, `--muted-foreground`→secondaryLabel, `--border`→separator, `--input`→fill). 개별 컴포넌트에 색을 하드코딩하지 않는다.
2. `--radius`는 `0.875rem` 안팎으로 키운다.
3. `src/components/ui/`의 shadcn 부품을 고쳐서 전체에 반영하고, 페이지 파일은 레이아웃만 다룬다.
4. 수출 초보 기업이 쓰는 도구이므로 **쉬운 말 + 큰 글자 + 한 화면 한 행동**을 지킨다.

## 8. 끝내기 전 점검

- [ ] 강조색이 하나뿐인가?
- [ ] 임의 px/색 없이 토큰만 썼나?
- [ ] 버튼·행이 44px 이상인가?
- [ ] 장식 그림자·그라데이션·두꺼운 테두리가 없나?
- [ ] 라이트/다크 둘 다 글자 대비가 충분한가?
- [ ] 모바일(390px)에서 가로 스크롤이 없나?
- [ ] 화면마다 주요 행동이 하나로 보이나?
