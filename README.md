# StorePilot Frontend

StorePilot의 Next.js 프론트엔드입니다. 로그인/회원가입 화면, 상품 엑셀 업로드, 결과 다운로드, 이미지 ZIP 다운로드, 관리자 업로드 도구를 제공합니다.

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## 주요 기능

- 비밀번호 재확인을 포함한 회원가입
- 로그인 / 로그아웃
- 백엔드 HttpOnly 쿠키를 통한 로그인 상태 복원
- 상품 엑셀 업로드
- 작업 상태 조회
- 결과 엑셀 다운로드
- 이미지 ZIP 다운로드
- 관리자 전용 도구
  - 네이버 카테고리 리스트 업로드
  - 내 카테고리 매핑 업로드
  - 기존 상품 엑셀 업로드 / 인덱스 재생성

`/api/v1/auth/me` 응답의 `role`이 `ADMIN`인 경우에만 관리자 도구가 화면에 표시됩니다.

## 필요 조건

- Node.js 20 이상
- `http://localhost:8080`에서 실행 중인 StorePilot 백엔드
- 백엔드 뒤에서 실행 중인 StorePilot AI 서버

## 환경변수

`.env.example`을 `.env.local`로 복사합니다.

```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

`NEXT_PUBLIC_API_BASE`는 백엔드 서버의 기본 주소입니다. 마지막에 `/`를 붙이지 않습니다.

이 값이 없으면 프론트엔드는 아래 주소를 기본값으로 사용합니다.

```text
http://<현재-hostname>:8080
```

## 로컬 실행

```powershell
cd C:\Project\StorePilot\fe
npm install
npm run dev
```

브라우저에서 접속:

```text
http://localhost:3000
```

## 빌드

```powershell
npm run build
```

## 린트

```powershell
npm run lint
```

## 백엔드 인증 설정

프론트엔드는 쿠키 기반 인증을 사용합니다. 인증이 필요한 API 요청은 다음 옵션을 포함합니다.

```ts
credentials: "include"
```

로컬 개발에서는 백엔드 CORS와 쿠키 설정이 아래처럼 되어 있어야 합니다.

```env
STOREPILOT_AUTH_ALLOWED_ORIGINS=http://localhost:3000
STOREPILOT_AUTH_COOKIE_SAME_SITE=Lax
STOREPILOT_AUTH_COOKIE_SECURE=false
```

Vercel 프론트엔드와 HTTPS 백엔드로 배포하는 경우:

```env
STOREPILOT_AUTH_ALLOWED_ORIGINS=https://your-frontend.vercel.app
STOREPILOT_AUTH_COOKIE_SAME_SITE=None
STOREPILOT_AUTH_COOKIE_SECURE=true
```

## Vercel 배포

Vercel 프로젝트 환경변수에 아래 값을 설정합니다.

```env
NEXT_PUBLIC_API_BASE=https://your-backend-domain.com
```

Vercel 환경변수를 변경한 뒤에는 프론트엔드를 다시 배포해야 합니다.

## 주요 API 경로

프론트엔드는 아래 백엔드 API를 호출합니다.

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/product-excel-jobs`
- `GET /api/v1/product-excel-jobs/{jobId}/status`
- `GET /api/v1/product-excel-jobs/{jobId}/download`
- `POST /api/v1/product-excel-jobs/images/download-zip`
- `POST /api/v1/admin/naver-categories/upload`
- `POST /api/v1/admin/my-category-mappings/upload`
- `POST /api/v1/admin/training-products/rebuild`
