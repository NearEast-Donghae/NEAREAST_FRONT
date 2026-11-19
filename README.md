# NEAREAST Front

동해권 철도 여행 플래너 **NEAREAST**의 프론트엔드입니다.

- React 18 + TypeScript
- Vite 5
- Plain CSS (컴포넌트와 같은 폴더에 같은 이름의 `.css`)
- 카카오맵 JavaScript SDK

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 파일 만들기 → 값 채우기
cp .env.example .env        # Windows: copy .env.example .env

# 3. 개발 서버 실행 (app.html 이 자동으로 열림)
npm run dev
```

> Node 22 LTS를 권장합니다. Windows에서는 `start-dev.bat`으로 실행할 수 있습니다
> (`%LOCALAPPDATA%\node22`에 포터블 Node 22가 있다고 가정합니다).

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | `dist/`에 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |

## 환경변수

| 이름 | 설명 |
|------|------|
| `VITE_KAKAO_MAP_KEY` | 카카오 디벨로퍼스 JavaScript 키 |
| `VITE_API_BASE_URL` | 백엔드 REST API 주소 |

`.env`는 `.gitignore`에 포함되어 있습니다. **키를 커밋하지 마세요.**

## 폴더 구조

```
NEAREAST_FRONT/
├── src/
│   ├── api/            # REST API 호출 계층
│   ├── assets/         # 아이콘, 지도 경계 데이터
│   ├── components/
│   │   ├── layout/     # 공통 헤더
│   │   ├── main/       # 메인 페이지 뷰
│   │   └── planning/   # 여행 계획 스텝
│   ├── pages/          # 페이지 단위 컴포넌트
│   ├── types/          # 공통 타입
│   ├── index.css       # 전역 스타일
│   └── main.tsx        # 진입점
├── app.html            # Vite 진입 HTML
├── .env.example        # 환경변수 템플릿
├── CODE_CONVENTIONS.md # 코드 컨벤션
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 라우팅

라우터 라이브러리 없이 해시로 페이지를 전환합니다.

| 경로 | 페이지 |
|------|--------|
| `#/` | 메인 (철도 지도 / AI 검색 / AI 플래너) |
| `#/planning` | 여행 계획하기 |

코드 컨벤션은 [CODE_CONVENTIONS.md](CODE_CONVENTIONS.md)를 참고하세요.
