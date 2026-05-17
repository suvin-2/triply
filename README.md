# Triply — 여행 정산 앱

회원가입 없이 링크 공유로 여행 경비를 실시간 입력하고, 최소 송금 횟수로 자동 정산하는 웹앱입니다.

## 소개

- 회원가입 없음 — 이름 입력 후 localStorage에 저장
- 초대 링크 하나로 팀원 전원 입장
- 지출 실시간 동기화 (Firebase Realtime Database)
- 최소 송금 횟수 그리디 알고리즘으로 정산
- 토스 / 카카오페이 딥링크 연동
- 영수증 스타일 공유 카드 (html2canvas)

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프레임워크 | React 19 + TypeScript + Vite |
| 스타일 | SCSS + CSS Modules |
| DB | Firebase Realtime Database |
| 공유 카드 | html2canvas + Web Share API |
| 딥링크 | 토스 / 카카오페이 URL Scheme |
| 배포 | Vercel |
| 테스트 | Vitest (단위) + Playwright (E2E) |

## 로컬 실행 방법

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.example 참고)
cp .env.example .env
# .env 파일에 Firebase 프로젝트 값 입력

# 개발 서버 실행
npm run dev
```

## 환경 변수 설정

`.env.example` 파일을 복사해 `.env`를 만들고 Firebase 콘솔에서 값을 복사합니다.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
```

Firebase 콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정 및 구성에서 확인할 수 있습니다.

## 테스트

```bash
npm run test           # 단위 테스트 (1회)
npm run test:watch     # watch 모드
npm run test:coverage  # 커버리지
npm run test:e2e       # E2E (dev 서버 자동 실행)
```

## 배포

Vercel과 연결된 GitHub 저장소에 push하면 자동 배포됩니다.
환경 변수는 Vercel 대시보드 → Settings → Environment Variables에서 설정합니다.
