// eslint.config.js
import eslintPluginPrettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import tseslint from "@typescript-eslint/eslint-plugin";
import parser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  /* ignore patterns --------------------------------------------------- */
  {
    ignores: [
      "eslint.config.js",
      "**/node_modules/**",
      "**/.ignored_node_modules/**",
      "**/dist/**",
      "**/build/**",
      "vitest.config.ts",
    ],
  },

  /* JS _and_ TS common rules ----------------------------------------- */
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        ecmaVersion: 2023,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "prettier/prettier": "error",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      // leave react/prop-types ON for plain .js/.jsx if you still have them
    },
    settings: { react: { version: "detect" } },
  },

  /* TS-specific override: disable prop-types ------------------------- */
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "react/prop-types": "off",
    },
  },

  /* prettier last so it can touch everything ------------------------- */
  prettierConfig,
];
