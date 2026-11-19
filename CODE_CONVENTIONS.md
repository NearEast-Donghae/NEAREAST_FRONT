# NEAREAST — 코드 컨벤션

## 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 클래스 / 컴포넌트 | PascalCase | `MapView`, `StationInfoPopup` |
| 변수 / 함수 / 메서드 | camelCase | `selectedStation`, `handleNavigate` |
| 상수 | UPPER_SNAKE_CASE | `NAV_TABS`, `DATE_OPTIONS` |
| CSS 클래스 | BEM — `컴포넌트명-요소명--상태` | `MapView-NavItem--active` |

## 네이밍 철학

- 짧음 < 가독성.  `s` 대신 `selectedStation`, `i` 대신 `index`.
- 역할이 명확하면 `get`/`set` 접두사 없이도 무방 (`onNavigate`, `onClose`).

## 함수 설계

- **단일 책임 원칙**: 함수 하나당 역할 하나.
- 사이드이펙트가 있는 함수는 `handle` 접두사 (`handleStationClick`).
- 이벤트 핸들러 prop은 `on` 접두사 (`onClose`, `onNavigate`).

## 비교 연산자

- `==` **금지** — 항상 `===` / `!==` 사용.

## 주석

- **무엇**을 하는지 설명 → ❌ (코드가 말해야 함)
- **왜** 이렇게 했는지 설명 → ✅
- CSS 파일에서 섹션 구분자는 허용:  `/* 헤더 */`

## 파일 구조 (`src/`)

```
src/
├── api/
│   └── client.ts       # REST 공통 클라이언트 (리소스별 파일은 여기에 추가)
├── assets/
│   └── icons/          # SVG 아이콘
├── components/
│   ├── layout/         # 헤더 등 공통 레이아웃
│   ├── main/           # 메인 페이지 뷰 컴포넌트
│   └── planning/       # 계획하기 스텝 컴포넌트
├── pages/
│   ├── MainPage.tsx    # 메인 페이지 (뷰 상태 관리)
│   └── PlanningPage.tsx # 계획하기 페이지 (스텝 상태 관리)
├── types/
│   └── neareast.ts     # 공통 타입 정의
├── index.css           # 전역 스타일
└── main.tsx            # 진입점 + 해시 라우팅
```

## API 호출 (REST)

- 컴포넌트에서 `fetch` 직접 호출 금지 → `src/api/` 의 함수 사용
- 리소스 단위 파일 (`stations.ts`, `trains.ts` …), URL은 복수형 명사, 동작은 HTTP 메서드로
- 자세한 규칙은 [src/api/README.md](src/api/README.md)

## 스택

- **React + TypeScript** (TSX)
- **Plain CSS** — Tailwind, CSS-in-JS 미사용
- CSS 파일명은 컴포넌트 파일명과 동일, 같은 디렉터리에 위치

## 컴포넌트 패턴

```tsx
// Props 인터페이스 먼저 정의
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

// 컴포넌트
const ComponentName: React.FC<ComponentProps> = ({ value, onChange }) => {
  return <div className="ComponentName">{value}</div>;
};

// 타입도 함께 export (필요 시)
export type { ComponentProps };
export default ComponentName;
```

## 디자인 토큰 (CSS 변수 없이 직접 사용)

| 용도 | 값 |
|------|-----|
| 주 텍스트 | `#1f1f1f`, `#333` |
| 보조 텍스트 | `#575757`, `#4a6070` |
| 비활성 | `#707070`, `#aaa` |
| 테두리 | `#d6d6d6`, `#e0eaf0` |
| 배경 (카드) | `#f5f5f5`, `#eef2f5` |
| 선택 (다크) | `#333` background + `#ffffff` text |
| 카드 radius | `10px` / `12px` |
| 필 radius | `13px` / `100px` |
| 페이지 side padding | `95px` |
| 콘텐츠 최대 너비 | `1440px` |
| 폰트 | `'Noto Sans KR', sans-serif` |
