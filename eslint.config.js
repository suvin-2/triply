import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierConfig from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
      prettierConfig, // 반드시 마지막 — 포매팅 룰 충돌 비활성화
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // CLAUDE.md: console.error는 복구 불가능한 에러 기록 의무 → error만 허용
      "no-console": ["error", { allow: ["error"] }],
      // 모바일 터치 앱 — 다이얼로그 오버레이·바텀시트 패턴에서 의도적으로 div에 onClick 사용
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
    },
  },
  {
    // E2E 테스트 파일 — console.log로 성능 계측값을 기록하는 패턴 허용
    files: ["tests/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
]);
