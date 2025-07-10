# Supabase에서 REST API로의 마이그레이션 가이드

## 개요

이 프로젝트는 Supabase 백엔드에서 REST API 백엔드로 전환되었습니다.

## 주요 변경사항

### 1. 의존성 제거

- `@supabase/supabase-js` 패키지 제거
- Supabase 관련 환경변수 제거

### 2. 새로운 API 클라이언트

- `src/lib/api.ts` - REST API 클라이언트 생성
- `src/lib/auth.tsx` - REST API 기반 인증 시스템

### 3. API 엔드포인트

모든 API 엔드포인트는 `http://ec2-3-36-179-72.ap-northeast-2.compute.amazonaws.com:8080`을 기본 URL로 사용합니다.

#### 인증

- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/me` - 현재 사용자 정보

#### 영업사원

- `GET /api/sales-reps` - 영업사원 목록
- `POST /api/sales-reps` - 영업사원 생성
- `PUT /api/sales-reps/:id` - 영업사원 수정
- `DELETE /api/sales-reps/:id` - 영업사원 삭제

#### 엔지니어

- `GET /api/engineers` - 엔지니어 목록
- `POST /api/engineers` - 엔지니어 생성
- `PUT /api/engineers/:id` - 엔지니어 수정
- `DELETE /api/engineers/:id` - 엔지니어 삭제

#### 고객

- `GET /api/customers` - 고객 목록
- `POST /api/customers` - 고객 생성
- `PUT /api/customers/:id` - 고객 수정
- `DELETE /api/customers/:id` - 고객 삭제

#### 공장 사용량

- `GET /api/factory-usage` - 공장 사용량 목록
- `POST /api/factory-usage` - 공장 사용량 생성
- `PUT /api/factory-usage/:id` - 공장 사용량 수정
- `DELETE /api/factory-usage/:id` - 공장 사용량 삭제

#### 타당성 검토

- `GET /api/feasibility-studies` - 타당성 검토 목록
- `POST /api/feasibility-studies` - 타당성 검토 생성
- `PUT /api/feasibility-studies/:id` - 타당성 검토 수정
- `DELETE /api/feasibility-studies/:id` - 타당성 검토 삭제

#### 파일 업로드

- `POST /api/files/upload` - 파일 업로드
- `DELETE /api/files/:id` - 파일 삭제
- `GET /api/files/:id` - 파일 정보 조회
- `GET /api/files/:id/download` - 파일 다운로드

## 인증 시스템

### 로그인

1. 사용자가 이메일과 비밀번호 입력
2. `POST /api/auth/login` API 호출
3. 성공 시 JWT 토큰을 localStorage에 저장
4. 이후 모든 API 요청에 자동으로 Authorization 헤더 포함

### 세션 관리

- 토큰은 localStorage에 `auth_token` 키로 저장
- 페이지 새로고침 시 `GET /api/auth/me`로 토큰 유효성 검증
- 토큰이 유효하지 않으면 자동으로 로그아웃

## 에러 핸들링

`handleApiError` 함수를 통해 일관된 에러 메시지 제공:

- 인증 오류: "인증 오류가 발생했습니다. 새로고침 후 다시 시도해주세요."
- 네트워크 오류: "네트워크 연결을 확인해주세요."
- 404 오류: "데이터를 찾을 수 없습니다."
- 409 오류: "이미 존재하는 데이터입니다."

## 마이그레이션 완료된 컴포넌트

- [x] Login.tsx
- [x] Customers.tsx
- [x] SalesReps.tsx
- [x] Engineers.tsx
- [x] CustomerDetail.tsx
- [x] CustomerForm.tsx
- [x] SalesRepForm.tsx
- [x] EngineerForm.tsx
- [x] FactoryUsageForm.tsx
- [x] FeasibilityStudyForm.tsx
- [x] FileUpload.tsx

## 환경 설정

### 필요한 환경변수

```bash
# API 기본 URL (선택사항, 기본값 사용)
VITE_API_BASE_URL=http://ec2-3-36-179-72.ap-northeast-2.compute.amazonaws.com:8080
```

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `src/lib/api.ts`의 `API_ENDPOINTS` 객체에 새 엔드포인트 추가
2. 필요한 경우 새로운 타입 정의
3. 컴포넌트에서 `apiClient` 사용하여 API 호출

### 에러 처리

```typescript
import { handleApiError } from "@/lib/api";

try {
  const response = await apiClient.get("/api/endpoint");
  if (response.error) {
    const errorMessage = handleApiError(response.error, "작업명");
    // 에러 메시지 표시
  }
} catch (error) {
  const errorMessage = handleApiError(error, "작업명");
  // 에러 메시지 표시
}
```

## 문제 해결

### CORS 오류

- 백엔드에서 CORS 설정 확인
- 프리플라이트 요청 지원 확인

### 인증 토큰 오류

- localStorage의 `auth_token` 확인
- 토큰 만료 시 자동 로그아웃 확인

### 네트워크 오류

- API 서버 상태 확인
- 네트워크 연결 상태 확인
