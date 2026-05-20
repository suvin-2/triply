import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import type { Plugin } from "vite";

/**
 * 빌드 후 번들에서 Pretendard 핵심 청크([89]-[91])를 찾아
 * HTML에 <link rel="preload">를 주입한다.
 * [89]-[91]: ASCII 전체(U+0020-7d) + 가장 빈도 높은 한글 음절 범위.
 * preload로 HTML 파싱 시점에 폰트 다운로드를 시작해 CSS→폰트 발견 지연을 제거한다.
 */
function fontPreloadPlugin(): Plugin {
  return {
    name: "font-preload",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.bundle) return html;

        const criticalSubsets = ["subset.89", "subset.90", "subset.91"];
        const links = Object.keys(ctx.bundle)
          .filter((key) => key.endsWith(".woff2") && criticalSubsets.some((s) => key.includes(s)))
          .map(
            (key) =>
              `    <link rel="preload" href="/${key}" as="font" type="font/woff2" crossorigin>`,
          )
          .join("\n");

        if (!links) return html;
        // </head>의 앞 줄바꿈+공백을 캡처해 같은 들여쓰기로 링크 삽입
        return html.replace(/(\n\s*)<\/head>/, `\n${links}$1</head>`);
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    fontPreloadPlugin(),
    // npm run analyze 시에만 stats.html 생성 (cross-env ANALYZE=true vite build)
    process.env.ANALYZE === "true" &&
      visualizer({
        filename: "stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean) as Plugin[],
  build: {
    chunkSizeWarningLimit: 700, // Firebase SDK 청크 ~600KB → 기본값 500KB 경고 억제
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React 계열은 한 청크 — 버전 변경 전까지 브라우저 캐시 재사용
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "vendor-react";
          }
          // Firebase SDK는 별도 청크 — 앱 코드와 독립적으로 캐시
          if (id.includes("node_modules/firebase") || id.includes("node_modules/@firebase")) {
            return "vendor-firebase";
          }
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
  },
});
