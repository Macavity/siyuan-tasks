import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginSvelte from "eslint-plugin-svelte";
import svelteParser from "svelte-eslint-parser";
import js from "@eslint/js";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.svelte"],
    plugins: {
      svelte: eslintPluginSvelte,
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...eslintPluginSvelte.configs.recommended.rules,
      // Disable specific a11y rules
      "svelte/a11y-click-events-have-key-events": "off",
      "svelte/a11y-missing-attribute": "off",
      // Add Svelte-specific unused variable detection
      "svelte/no-unused-svelte-ignore": "warn",
      "svelte/valid-compile": "warn",
      // TypeScript ESLint rules for Svelte files
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
    },
  },
  {
    files: ["src/**/*.{js,ts,svelte}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        project: "./tsconfig.json",
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-return": "warn",
    },
  },
  {
    rules: {
      // Disable specific a11y rules
      "svelte/a11y-click-events-have-key-events": "off",
      "svelte/no-static-element-interactions": "off",
      "svelte/a11y-missing-attribute": "off",
    },
  },
  {
    ignores: [
      "src/**/*.test.ts",
      "src/libs/siyuan/**/*",
      "test/**",
      "vue/**",
      "scripts/**",
      "dev/**",
      "yaml-plugin.js",
      "vue/**",
      "dist/**",
    ],
  },
];
