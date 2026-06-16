import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/.next/**",
      "**/coverage/**",
      "**/.omo/tmp/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/next-env.d.ts",
      "demo-evidence/**",
      "**/next.config.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.integration.test.ts",
      "**/*.integration.test.tsx",
      "**/drizzle.config.ts",
      "eslint.config.mjs",
      "postcss.config.mjs",
      "prettier.config.mjs",
      "scripts/*.mjs",
      "scripts/prod-bootstrap/*.mjs",
      "vitest.config.ts",
      "pnpm-lock.yaml",
      "designs/stitch/stitch_clinical_trust_auth_redesign/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" }
      ],
      "@typescript-eslint/no-confusing-void-expression": "off"
    }
  },
  {
    files: ["apps/*/src/**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin
    },
    settings: {
      next: {
        rootDir: ["apps/web/", "apps/admin/"]
      }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-html-link-for-pages": "off"
    }
  },
  {
    files: ["**/*.tsx"],
    rules: {
      "@typescript-eslint/no-misused-promises": "off"
    }
  },
  prettier
);
