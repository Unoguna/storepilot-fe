# StorePilot Frontend

온라인 판매자의 상품 등록 작업을 돕는 StorePilot의 Next.js 프런트엔드입니다.
유플렛 엑셀을 이용한 카테고리·키워드 찾기, 이미지 다운로드, 워터마크 설정과 카테고리 학습 요청을 제공합니다.

사용자는 자신의 마이카테고리 매핑을 등록해 결과를 받을 수 있고, 관리자는 학습 요청·검색 데이터·문의·사용량을 관리합니다.
실제 엑셀 해석과 이미지 가공은 BE, 임베딩 검색과 카테고리 판단은 AI 서버에서 수행합니다.

## 1. 시스템 구성

```text
브라우저
├─ Next.js 페이지·React 화면
├─ 인증 상태·진행률·입력 관리
├─ 파일/폴더 저장
└─ fetch + 인증 쿠키 → Spring Boot BE → AI Server
                         ├─ 사용자·매핑·사용량·문의
                         ├─ 비동기 엑셀 작업·키워드 생성
                         └─ 이미지 가공·워터마크
```

API 요청은 브라우저에서 BE로 직접 전송합니다. 현재 Next.js API Route, Server Action, API 프록시를 통한 중계 구조가 아닙니다.
따라서 API 주소는 브라우저에서 접근할 수 있어야 하며, BE의 CORS·쿠키 설정이 필요합니다.

## 2. 기술 스택

[package.json](package.json)과 [package-lock.json](package-lock.json) 기준입니다.

| 기술 | 버전/설정 | 용도 |
| --- | --- | --- |
| Next.js | 16.3.0 (선언 범위 `^16.3.0`) | App Router·페이지 구성 |
| React / React DOM | 19.2.4 | 클라이언트 UI |
| TypeScript | 5 계열, strict 모드 | API 및 UI 타입 |
| Tailwind CSS | 4 계열 | 스타일·반응형 레이아웃 |
| Lucide React | `^1.27.0` | 아이콘 |
| ESLint / eslint-config-next | 9 계열 / `^16.3.0` | 정적 검사 |

서버 상태 라이브러리나 별도의 전역 상태 라이브러리 없이 React Context와 Hooks를 사용합니다.
의존성 재현을 위해 `package.json`과 `package-lock.json`을 함께 관리합니다.

## 3. 페이지 구성

### 사용자 페이지

| 경로 | 기능 |
| --- | --- |
| `/` | 비로그인 시 로그인·회원가입, 로그인 후 홈 대시보드·사용법 |
| `/auth/verify-email` | 이메일 인증 |
| `/auth/reset-password` | 비밀번호 재설정 |
| `/my-category-mappings/upload` | 사용자별 마이카테 매핑 업로드 |
| `/my-category-mappings` | 등록된 마이카테 매핑 조회 |
| `/product-excel-jobs/upload` | 카테고리·키워드 작업 등록, 진행률·사용량 확인, 결과 저장 |
| `/product-excel-jobs/results` | 내 결과 엑셀 보관함 |
| `/admin/product-excel-results` | 관리자 전용 선택 과정 포함 결과 엑셀 보관함 |
| `/product-images/download` | 이미지 폴더 저장, 목표 용량·워터마크 선택, 실패 목록 저장 |
| `/watermarks` | 워터마크 등록·미리보기·설정·삭제 |
| `/category-learning` | 기존 상품 파일 제출 및 내 학습 요청 상태 조회 |
| `/usage` | 오늘·이번 달·전체 사용량 |
| `/qna` | 자주 묻는 질문과 내 문의 목록 |
| `/qna/new` | 문의 등록 |
| `/qna/faqs/[faqId]` | 자주 묻는 질문 상세 |
| `/qna/questions/[questionId]` | 문의 내용·답변 상세 |

### 관리자 페이지

`AuthUser.role === "ADMIN"`일 때 관리자 메뉴와 해당 화면을 표시합니다.

| 경로 | 기능 |
| --- | --- |
| `/naver-categories/upload` | 네이버 카테고리 파일 업로드 |
| `/training-products/upload` | 기존 상품 파일·마이카테 파일로 상품 인덱스 재생성 요청 |
| `/training-products/add` | 추가 상품 파일·마이카테 파일 업로드 |
| `/training-products/category-stats` | 학습 상품 카테고리 통계 |
| `/admin/training-product-requests` | 제출 파일·요청자 매핑 다운로드, 상태 변경, 파일 삭제 |
| `/admin/product-mapping-preview` | 상품·매핑 엑셀 비교, 네이버 카테고리 및 실패 사유 확인 (저장·학습 없음) |
| `/admin/user-usages` | 사용자별 사용량 조회 |

관리자는 QnA 화면에서 자주 묻는 질문 등록·수정·노출 설정과 사용자 문의 답변을 처리합니다.
마이카테고리 업로드는 관리자 전용 기능이 아니라 일반 사용자도 사용하는 기능입니다.

## 4. 주요 사용자 흐름

### 인증과 페이지 이동

구현: [auth-session-provider.tsx](components/features/auth/auth-session-provider.tsx), [authenticated-home.tsx](components/features/auth/authenticated-home.tsx)

- 루트 레이아웃의 `AuthSessionProvider`가 `GET /api/v1/auth/me`로 세션을 복원합니다.
- 인증 상태를 Context에 유지하여 일반적인 클라이언트 페이지 이동마다 세션을 처음부터 복원하지 않습니다. 새로고침 시에는 다시 확인합니다.
- 최초 확인 중에는 스켈레톤 화면을 표시합니다. 비로그인 사용자가 보호 페이지에 접근하면 홈으로 이동합니다.
- 회원가입·이메일 인증 및 재전송·비밀번호 재설정·로그아웃·회원 탈퇴 UI를 제공합니다.
- 토큰은 브라우저 JavaScript에서 읽거나 localStorage에 저장하지 않고, BE가 발급한 HttpOnly 쿠키로 인증합니다.
- 인증 API 호출에서 401 또는 403을 받으면 refresh를 시도하고 원래 요청을 한 번 재시도합니다.
- 관리자 화면의 표시 제한은 UI 제어입니다. 실제 접근 권한과 데이터 소유권은 BE에서도 검증해야 합니다.

카테고리·키워드 찾기와 카테고리 학습 페이지는 등록된 마이카테 매핑을 조회합니다.
매핑이 없으면 안내 후 `/my-category-mappings/upload`로 이동합니다.

### 카테고리 및 키워드 찾기

구현: [product-excel-card.tsx](components/features/product/product-excel-card.tsx)

```text
엑셀 선택 → 저장 위치 선택 → BE 작업 등록
  → 상태 조회 → 대기/처리 진행률 표시
  → 완료 시 결과 다운로드 → 파일 저장
```

- 1행의 `상품명` 열 이름을 유지하도록 작성 방법을 안내합니다.
- 한 번에 최대 1,500개 상품 처리 제한을 표시합니다. 실제 상품 수 검사와 제한 적용은 BE 책임입니다.
- 오늘 사용량은 BE 응답의 `processedProductCount + reservedProductCount`로 표시합니다. 처리 중 예약량도 포함합니다.
- 일일 한도는 `dailyProductLimit` 응답을 사용하며 현재 서비스 기준은 2,000개입니다.
- 작업 생성 직후 상태를 조회하고, 미완료 시 1초 대기 후 다음 조회를 수행합니다. WebSocket/SSE 방식이 아닙니다.
- 완료/실패까지 진행률·처리 개수·단계별 시간을 표시하고, 완료하면 결과 Blob을 저장합니다.
- 사용량은 페이지 진입, 작업 등록 후, 작업 흐름 종료 시 갱신합니다.
- `선택 과정 확인용 열 포함`은 관리자에게만 보이고 일반 사용자 요청에는 `false`를 전달합니다.

### 상품 이미지 다운로드와 워터마크

구현: [product-image-download-card.tsx](components/features/product/product-image-download-card.tsx), [file-download.ts](lib/file-download.ts)

1. 엑셀과 저장 폴더를 선택합니다.
2. BE의 prepare API로 `목록이미지1` 열에 해당하는 이미지 목록과 사전 실패 목록을 받습니다.
3. 최대 **3개 작업을 병렬 실행**하여 BE에 단건 이미지 다운로드를 요청하고 폴더에 저장합니다.
4. 성공·실패/건너뜀 수를 표시하고 실패 행 아래에서 실패 목록 엑셀을 저장할 수 있습니다.

목표 용량은 원본의 30~100% 범위이며 기본값은 70%입니다. 이는 화질 퍼센트가 아닌 목표 파일 크기 비율입니다.
JPEG 변환·용량 조절·워터마크 합성은 BE가 수행하며, 프런트는 옵션을 전달하고 응답 바이트를 저장합니다. 목표 크기의 정확한 달성을 프런트가 보장하지 않습니다.

워터마크 설정 화면은 PNG/JPEG(최대 2MB 안내), 위치 5종, 불투명도 10~100%, 이미지 너비 대비 크기 5~50%를 제공합니다.
설정 변경은 미리보기에 반영되며 저장된 워터마크는 계정에 연결됩니다. 실제 이미지 다운로드 페이지에서 적용 여부를 선택합니다.

### 카테고리 학습 요청

구현: [training-product-request-card.tsx](components/features/training-product/training-product-request-card.tsx)

- 사용자는 기존 상품의 `.xlsx` 파일을 여러 개 선택할 수 있습니다. 각 파일 최대 20MB를 안내합니다.
- 화면에서는 `상품명`, `마이카테` 헤더를 유지하도록 설명합니다.
- 파일별로 단건 접수 API를 **순차 호출**하고, 일부 실패해도 나머지 파일을 계속 접수합니다.
- 내 요청에 접수 완료·검토 중·학습 완료·반려 상태와 하루 정도 걸릴 수 있다는 안내를 표시합니다.
- 관리자 화면은 제출 파일과 요청자 마이카테 매핑을 내려받고 상태를 변경할 수 있습니다.
- 관리자 파일 삭제는 원본 파일 삭제 및 완료 처리 흐름이며 요청 이력을 화면에서 제거하는 동작은 아닙니다.

사용자의 접수 자체가 임베딩을 즉시 실행하는 것은 아닙니다. 관리자가 검토하고 별도 데이터 반영 도구를 사용합니다.
서비스에서 말하는 학습은 상품–카테고리 사례의 검색 인덱스 반영이며, 프런트에서 모델을 학습하지 않습니다.

### 사용량·문의·홈 안내

- 내 사용량과 관리자 사용량 페이지 모두 `TODAY`, `MONTH`, `TOTAL`을 사용합니다. 현재 프런트에 연간 선택 탭은 없습니다.
- 카테고리 작업 횟수, 처리 상품 수, 이미지 다운로드 수, 학습 요청 수 등을 표시합니다.
- QnA 목록은 자주 묻는 질문을 먼저 보여주고 문의 제목을 표시합니다. 내용과 답변은 상세 페이지에서 확인합니다.
- 홈과 카테고리 찾기 페이지에서 카테고리 학습을 안내합니다.
- 홈 진입 시 사용법 팝업을 표시하고, 상단 사용법 버튼은 Notion 안내 문서를 새 탭으로 엽니다.
- `오늘 하루 보지 않기`는 localStorage의 `storepilot-guide-hidden-until`에 **선택 시점부터 24시간 후**를 저장합니다. 자정 기준도, 계정별 설정도 아닙니다. 같은 사이트·브라우저 프로필에서는 공유되지만 다른 컴퓨터에 동기화되지는 않습니다.

## 5. 코드 구조

```text
app/
├─ layout.tsx                 # 공통 CSS·메타데이터·인증 Context
├─ page.tsx                   # 홈 진입점
├─ auth/                      # 이메일 인증·비밀번호 재설정
├─ product-excel-jobs/        # 카테고리·키워드 찾기 라우트
├─ product-images/            # 이미지 다운로드 라우트
├─ my-category-mappings/      # 사용자 매핑 라우트
├─ category-learning/         # 학습 요청 라우트
├─ watermarks/ / usage/       # 워터마크·내 사용량
├─ qna/                       # 목록·등록·동적 상세 라우트
├─ naver-categories/          # 관리자 카테고리 업로드
├─ training-products/         # 관리자 검색 데이터 도구
└─ admin/                     # 학습 요청·사용량 관리
components/
├─ features/                  # 도메인별 UI·상태·이벤트 처리
│  └─ auth/authenticated-home.tsx # 공통 사이드바·화면 선택·권한 UI
└─ ui/                        # 업로드 카드·버튼·결과 표시
lib/
├─ api.ts                     # BE API·쿠키 인증·refresh 재시도
├─ file-download.ts           # 파일/폴더 선택·Blob 저장·파일명 해석
└─ format.ts                  # 파일 크기·선택 파일 라벨
types/store-pilot.ts           # API 응답·상태·파일 시스템 타입
public/                       # 정적 이미지
```

대부분의 `page.tsx`는 `AuthenticatedHome`에 `currentView`를 전달하는 진입점입니다.
QnA 상세는 동적 경로의 ID를 검증한 뒤 같은 화면 틀을 사용합니다.
`@/*` 별칭은 저장소 루트에 매핑되고, `src/` 디렉터리는 사용하지 않습니다.

## 6. API 연동

모든 호출 경로와 요청 데이터의 기준은 [lib/api.ts](lib/api.ts), 응답 타입은 [types/store-pilot.ts](types/store-pilot.ts)입니다.

| BE 경로 그룹 | 용도 |
| --- | --- |
| `/api/v1/auth/*` | 가입·인증·세션·비밀번호·회원 탈퇴 |
| `/api/v1/product-excel-jobs` | 작업 등록 및 `/{jobId}/status`, `/{jobId}/download` |
| `/api/v1/admin/product-excel-jobs` | 관리자용 결과 목록 및 선택 과정 포함 결과 다운로드 |
| `/api/v1/product-excel-jobs/images/*` | `prepare`, `download`, `failures/excel` |
| `/api/v1/users/me/watermark` | 워터마크 조회·저장·삭제 및 `/image` 조회 |
| `/api/v1/my-category-mappings` | 내 매핑 조회 및 `/upload` |
| `/api/v1/training-product-requests` | 학습 요청 접수·내 요청 조회 |
| `/api/v1/user-usages/me?period=...` | 내 사용량 |
| `/api/v1/qna/*` | 자주 묻는 질문·내 문의 |
| `/api/v1/admin/naver-categories/upload` | 네이버 카테고리 업로드 |
| `/api/v1/admin/training-products/*` | `rebuild`, `append`, `category-stats`, `feedback`, `mapping-preview` |
| `/api/v1/admin/training-product-requests/*` | 요청 관리·원본/매핑 다운로드 |
| `/api/v1/admin/user-usages?period=...` | 사용자별 사용량 |
| `/api/v1/admin/qna/*` | 관리자 FAQ·문의 관리 |

파일 업로드는 `FormData`, 일반 요청은 JSON을 사용합니다.
다운로드 응답은 Blob으로 읽고, 가능한 경우 `Content-Disposition`에서 파일명을 추출합니다.
FE는 AI 서버의 URL이나 API 키를 직접 사용하지 않습니다.

## 7. 로컬 실행

설치된 Next.js의 최소 요구사항은 **Node.js 20.9 이상**입니다. BE를 함께 실행하고, AI 관련 기능을 확인하려면 BE 뒤의 AI 서버와 검색 데이터도 준비해야 합니다.

```powershell
cd C:\Project\StorePilot\fe
npm ci
Copy-Item .env.example .env.local
```

이미 `.env.local`이 있으면 복사 명령을 생략하고 필요한 값만 수정합니다.

```env
NEXT_PUBLIC_API_BASE=http://localhost:8080
```

API 주소 끝에 `/`를 붙이지 않습니다. 미설정 시 브라우저에서는 `http://<현재 hostname>:8080`, 서버 환경에서는 `http://localhost:8080`을 사용합니다.

```powershell
npm run dev
```

접속: [http://localhost:3000](http://localhost:3000)

| 명령 | 기능 |
| --- | --- |
| `npm ci` | lockfile 기준 의존성 설치 |
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드·TypeScript 검사 |
| `npm start` | 빌드한 결과 실행 |
| `npm run lint` | ESLint 검사 |

Turbopack 기본 설정을 사용합니다. `next.config.ts`에는 개발 origin으로 `127.0.0.1`을 허용하는 설정만 있으며, 이는 BE의 CORS 설정을 대신하지 않습니다.

## 8. 인증·배포 설정

인증 요청은 `credentials: "include"`로 쿠키를 전송합니다. 로컬 BE 설정 예시:

```env
STOREPILOT_AUTH_ALLOWED_ORIGINS=http://localhost:3000
STOREPILOT_AUTH_COOKIE_SAME_SITE=Lax
STOREPILOT_AUTH_COOKIE_SECURE=false
```

Vercel에 배포할 때는 프로젝트의 환경변수에 브라우저가 접근할 HTTPS BE 주소를 등록합니다.

```env
NEXT_PUBLIC_API_BASE=https://your-backend-domain.com
```

`NEXT_PUBLIC_` 값은 클라이언트 번들에 공개되므로 비밀키를 넣지 않습니다. API 주소를 변경한 뒤에는 다시 빌드·배포합니다.

BE에서는 실제 프런트 origin을 허용하고 HTTPS 쿠키 설정을 맞춰야 합니다.
프런트와 BE가 서로 다른 사이트라면 `SameSite=None; Secure` 설정이 필요할 수 있으나, 이것만으로 브라우저의 서드파티 쿠키 차단을 해결하지는 못합니다.
시크릿 모드 등을 포함해 실제 배포 도메인에서 로그인·세션 복원·refresh를 확인해야 합니다.

다운로드 파일명을 읽으려면 BE CORS에서 `Content-Disposition` 응답 헤더 노출도 확인합니다.
실제 권한·사용량·파일 검증은 BE 설정을 기준으로 관리합니다.

[app/layout.tsx](app/layout.tsx)에 사이트 제목·설명·Open Graph 메타데이터와 배포 URL이 선언되어 있습니다.
서비스 도메인을 변경하면 `metadataBase`도 함께 확인합니다.
현재 QnA 상세 라우트는 동적 렌더링을 사용하므로, 전체 프로젝트를 정적 파일만으로 배포하도록 구성된 상태는 아닙니다.

## 9. 브라우저 및 현재 제약

- 이미지 일괄 저장은 `showDirectoryPicker`가 필요합니다. 미지원 시 Chrome/Edge 사용 안내를 표시하며 ZIP 다운로드 대체 기능은 없습니다.
- 엑셀은 `showSaveFilePicker`가 없으면 일반 브라우저 다운로드로 대체합니다.
- 파일 시스템 선택 기능은 브라우저 지원·보안 컨텍스트·사용자 권한의 영향을 받습니다. 배포 환경에서는 HTTPS로 확인합니다.
- 같은 폴더에 동일 이름으로 저장하면 기존 파일을 덮어쓸 수 있습니다.
- 작업 ID와 진행 상태는 컴포넌트 메모리에만 있습니다. 새로고침 후 작업을 찾아 이어받는 화면은 없습니다.
- 작업 폴링에는 전체 제한 시간과 언마운트 시 취소 처리가 없습니다. 페이지 이동이 BE 작업 취소를 의미하지 않습니다.
- 공통 API 클라이언트에 별도 요청 타임아웃이 없고, 동시에 발생한 refresh 요청을 하나로 합치는 처리도 없습니다.
- 관리자 메뉴를 숨기는 것만으로 보안을 보장하지 않습니다. API의 권한 검증이 필수입니다.
- 학습 요청·사용량 목록은 페이지 진입이나 사용자 동작에 따라 조회하며 실시간 구독 방식이 아닙니다.

## 10. 검증

```powershell
npm run lint
npm run build
```

현재 `package.json`에는 단위 테스트나 E2E 테스트 실행 스크립트가 없습니다.
빌드와 린트 성공은 BE 연동이나 브라우저 파일 저장 동작 검증을 대신하지 않습니다.

수동 확인 항목:

1. 로그인·새로고침 세션 복원·로그아웃과 일반 사용자/관리자 접근 구분
2. 마이카테 미등록 시 업로드 페이지 안내
3. 엑셀 작업 등록·진행률·완료/실패·오늘 사용량·결과 파일 저장
4. 이미지 3개 병렬 저장·일부 URL 실패·실패 목록 엑셀
5. 워터마크 저장·미리보기·실제 다운로드 적용
6. 다중 학습 요청의 부분 실패와 관리자 상태 변경
7. QnA 상세 이동·문의 작성/삭제·답변 확인
8. 배포 환경의 쿠키 전송과 파일/폴더 저장 권한
