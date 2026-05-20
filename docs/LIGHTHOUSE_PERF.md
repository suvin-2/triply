# Lighthouse Performance 개선 기록

## 결과 요약

| 항목           | 개선 전 | 개선 후 |
| -------------- | ------- | ------- |
| Performance    | 64      | **94**  |
| Accessibility  | 94      | 94      |
| Best Practices | 100     | 100     |
| SEO            | 100     | 100     |

---

## 문제 분석

### 증상

Lighthouse 모바일 시뮬레이션(Slow 4G / 4× CPU throttle)에서 Performance 64점.  
FCP, LCP, Speed Index, TTI 가 **모두 5.9s**로 동일 — React CSR이라 JS 실행 후 페이지가 한 번에 그려지는데, 폰트 파일이 병목이었다.

| 지표                           | 개선 전           | 목표   |
| ------------------------------ | ----------------- | ------ |
| FCP (First Contentful Paint)   | 5.9s (score 0.04) | < 1.8s |
| LCP (Largest Contentful Paint) | 5.9s (score 0.14) | < 2.5s |
| Speed Index                    | 5.9s (score 0.49) | < 3.4s |
| TBT (Total Blocking Time)      | 0ms ✓             | —      |
| CLS (Cumulative Layout Shift)  | 0 ✓               | —      |
| TTI (Time to Interactive)      | 5.9s (score 0.66) | —      |

Lighthouse 진단: `render-blocking-insight` — CSS→폰트 체인이 **4,200ms** 낭비 추정.

### 근본 원인: 폰트 파일 크기 + 발견 지연

```
크리티컬 렌더링 체인:
HTML → CSS (render-blocking) → @font-face 발견 → 폰트 다운로드
```

`pretendard/dist/web/static/pretendard-subset.css` 를 사용하고 있었는데, 이는 weight별 정적 파일 9개(각 ~260KB)를 선언한다. HomeScreen 초기 렌더에서 세 개 weight가 동시에 다운로드됐다:

| 파일                             | 크기      |
| -------------------------------- | --------- |
| Pretendard-Bold.subset.woff2     | 264KB     |
| Pretendard-SemiBold.subset.woff2 | 262KB     |
| Pretendard-Regular.subset.woff2  | 261KB     |
| **합계**                         | **787KB** |

Slow 4G 시뮬레이션(1.6Mbps) 기준 이 세 파일을 다운로드하는 데만 **약 3–4초** 소요.

### 이미 잘 되어 있던 것

- `font-display: swap` 설정 ✓
- 비홈 화면 `lazy()` import ✓
- vendor-react / vendor-firebase 청크 분리 ✓
- Vite가 빌드 HTML에 JS `<link rel="modulepreload">` 자동 삽입 ✓
- TBT 0ms, CLS 0 ✓

---

## 적용한 개선 4가지

### 1. Pretendard → Variable Dynamic Subset 전환

**파일:** `src/styles/global.scss`, `src/styles/_variables.scss`

```scss
/* 변경 전 */
@import "pretendard/dist/web/static/pretendard-subset.css";

/* 변경 후 */
@import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
```

```scss
/* 변경 전 */
$font-sans:
  "Pretendard",
  -apple-system,
  system-ui,
  sans-serif;

/* 변경 후 */
$font-sans:
  "Pretendard Variable",
  -apple-system,
  system-ui,
  sans-serif;
```

**효과:**

- Dynamic subset: unicode-range로 분할된 92개 청크, 각 20–37KB
- Variable font: weight 45–920을 단일 파일 타입으로 커버 (weight별 파일 불필요)
- 브라우저가 실제 화면에 존재하는 문자 범위의 파일만 다운로드
- HomeScreen 기준 다운로드량: **787KB → 약 150–200KB** (약 75% 감소)

> `font-family: 'Pretendard Variable'` 로 이름이 바뀌므로 반드시 같이 수정해야 한다.

---

### 2. 핵심 폰트 청크 Preload 자동 주입 (Vite 플러그인)

**파일:** `vite.config.ts`

CSS를 파싱한 뒤에야 폰트 URL을 발견하는 기존 방식 대신, HTML 파싱 시점에 즉시 다운로드를 시작하도록 `<link rel="preload">` 를 빌드 결과물에 자동 삽입하는 Vite 플러그인을 추가.

```typescript
import type { Plugin } from "vite";

function fontPreloadPlugin(): Plugin {
  return {
    name: "font-preload",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        // [89]–[91]: ASCII 전체(U+0020–7d) + 가장 빈도 높은 한글 음절 범위
        const criticalSubsets = ["subset.89", "subset.90", "subset.91"];
        const links = Object.keys(ctx.bundle)
          .filter((key) => key.endsWith(".woff2") && criticalSubsets.some((s) => key.includes(s)))
          .map(
            (key) =>
              `    <link rel="preload" href="/${key}" as="font" type="font/woff2" crossorigin>`,
          )
          .join("\n");

        if (!links) return html;
        return html.replace(/(\n\s*)<\/head>/, `\n${links}$1</head>`);
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), fontPreloadPlugin()],
  // ...
});
```

**빌드 결과 (dist/index.html):**

```html
<link
  rel="preload"
  href="/assets/PretendardVariable.subset.89-HASH.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  href="/assets/PretendardVariable.subset.90-HASH.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
<link
  rel="preload"
  href="/assets/PretendardVariable.subset.91-HASH.woff2"
  as="font"
  type="font/woff2"
  crossorigin
/>
```

**왜 [89]–[91]을 선택했나:**

- [91]: ASCII (U+0020–7d) + 가장 흔한 한글 음절 15자 — 어떤 페이지에서도 반드시 필요
- [90]: 자주 쓰이는 한글 음절 (가, 고, 기, 다, 라 등)
- [89]: 그 다음 빈도의 한글 음절

3개 파일의 합계는 약 80KB. 이 파일들이 HTML 파싱 시점부터 다운로드를 시작하면 CSS→폰트 발견 체인(150ms RTT 손실)을 제거할 수 있다.

> 파일명에 Vite 해시가 포함된 상태 그대로 주입하므로 캐시 버스팅이 유지된다.

---

### 3. JetBrains Mono를 Latin 전용으로 교체

**파일:** `src/styles/global.scss`, `CreateScreen.module.scss`, `TripScreen.module.scss`

```scss
/* 변경 전 — 6개 @font-face (cyrillic / greek / latin-ext 포함) */
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";
@import "@fontsource/jetbrains-mono/700.css";

/* 변경 후 — 1개 @font-face (latin만) */
@import "@fontsource/jetbrains-mono/latin-400.css";
@import "@fontsource/jetbrains-mono/latin-500.css";
@import "@fontsource/jetbrains-mono/latin-700.css";
```

**효과:**  
JetBrains Mono는 금액 숫자·기호 표시에만 사용되므로 Latin 범위(0–9, 쉼표, 원 기호 등)만 필요. 불필요한 cyrillic/greek/vietnamese @font-face 선언과 URL 참조 제거.

- CreateScreen CSS: 27KB → **5KB** (gzip 15KB → **1.5KB**)
- TripScreen CSS: 35KB → **13KB** (gzip 17KB → **3KB**)

---

### 4. 미사용 Firebase preconnect 제거

**파일:** `index.html`

```html
<!-- 제거 -->
<link rel="preconnect" href="https://triply-22680-default-rtdb.firebaseio.com" />
```

Lighthouse에서 "Unused preconnect" 경고로 플래그됨. Firebase SDK가 앱 코드 내에서 WebSocket 연결을 직접 관리하므로 HTML preconnect 힌트가 실질적으로 사용되지 않았다.

---

## 파일별 변경 요약

| 파일                                                | 변경 내용                                               |
| --------------------------------------------------- | ------------------------------------------------------- |
| `src/styles/global.scss`                            | Pretendard → dynamic subset, JetBrains Mono → latin-400 |
| `src/styles/_variables.scss`                        | `'Pretendard'` → `'Pretendard Variable'`                |
| `src/screens/CreateScreen/CreateScreen.module.scss` | JetBrains Mono 500/700 → latin 전용                     |
| `src/screens/TripScreen/TripScreen.module.scss`     | JetBrains Mono 500/700 → latin 전용                     |
| `vite.config.ts`                                    | `fontPreloadPlugin()` 추가                              |
| `index.html`                                        | Firebase preconnect 제거                                |

---

## 유사 문제 발생 시 체크리스트

비슷한 상황(FCP/LCP가 수 초대, TBT/CLS는 양호)이 다시 생기면 아래 순서로 점검한다.

1. **Lighthouse → `render-blocking-insight` 확인**  
   어떤 리소스가 크리티컬 렌더링 체인을 막고 있는지 파악.

2. **Network 탭 → 폰트 다운로드 크기 확인**  
   weight별 정적 파일이 여러 개 다운로드되고 있으면 variable + dynamic subset 전환 검토.

3. **CSS가 폰트를 발견하는 시점 확인**  
   HTML → CSS → @font-face 체인이 생기면 `<link rel="preload">` 로 HTML 파싱 시점으로 앞당긴다.

4. **폰트 범위가 과도하게 넓은지 확인**  
   한국어 앱에서 cyrillic/greek 폰트 파일이 포함돼 있으면 제거.

5. **미사용 preconnect/prefetch 정리**  
   Lighthouse `network-dependency-tree-insight` 의 "Unused preconnect" 경고 확인.
