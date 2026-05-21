# Vercel 배포 설정 가이드

## 구조

```
triply          (GitHub: suvin-2/triply)       ← 웹앱, Vercel 배포 대상
triply-native   (GitHub: suvin-2/triply-native) ← Expo 앱, WebView로 웹앱 URL을 로드
```

`triply-native`의 `App.tsx`에서 Vercel 배포 URL을 WebView로 열어 네이티브 앱을 구성한다.

```ts
const WEB_URL = "https://triply-app-ecru.vercel.app/";
```

---

## Git 푸시 → 자동 배포 설정 방법

1. [vercel.com](https://vercel.com) 로그인
2. 해당 프로젝트 → **Settings → Git** 에서 `suvin-2/triply` 레포 연결
3. 이후 `main` 브랜치에 푸시하면 자동으로 배포됨

### 빌드 설정

| 항목             | 값              |
| ---------------- | --------------- |
| Framework Preset | Vite            |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Install Command  | `npm install`   |

---

## 환경 변수

`.env` 파일은 git에 포함되지 않으므로, Vercel 대시보드 **Settings → Environment Variables** 에 아래 항목을 직접 등록해야 한다.

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_URL
```

값은 로컬 `.env` 파일을 참고한다.

---

## 트러블슈팅

### `npm install` 실패 — ERESOLVE peer dependency 충돌

**원인**

`eslint-plugin-jsx-a11y@6.10.2`가 ESLint 10을 공식 지원하지 않아 peer dependency 충돌이 발생한다.

```
npm error ERESOLVE could not resolve
npm error peer eslint@"^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9"
npm error   from eslint-plugin-jsx-a11y@6.10.2
npm error Found: eslint@10.4.0
```

**해결**

프로젝트 루트에 `.npmrc` 파일을 추가해 legacy peer deps 모드로 설치하도록 설정한다.

```
# .npmrc
legacy-peer-deps=true
```

이 파일은 로컬과 Vercel 빌드 환경 모두에 적용된다.
