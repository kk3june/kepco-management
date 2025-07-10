# KEPCO Management System - Login Setup

## 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성하세요
2. Authentication > Settings에서 이메일 인증을 활성화하세요
3. Authentication > Users에서 테스트 사용자를 생성하세요:
   - Email: admin@kepco.com
   - Password: password123

## 로그인 기능

- 이메일과 비밀번호로 로그인
- 로그인 상태 유지 (localStorage)
- 자동 로그아웃 (세션 만료 시)
- 보호된 라우트 (인증되지 않은 사용자는 로그인 페이지로 리다이렉트)

## 테스트 계정

- 이메일: admin@kepco.com
- 비밀번호: password123

## 주요 기능

- ✅ 현대적인 UI/UX (Shadcn UI + Tailwind CSS)
- ✅ 반응형 디자인
- ✅ 로딩 상태 표시
- ✅ 에러 처리
- ✅ 비밀번호 표시/숨김 토글
- ✅ 자동 인증 상태 관리
- ✅ 보호된 라우트
- ✅ 로그아웃 기능
