import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.node, 
        ...globals.jest, 
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "no-console": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
     // "quotes": ["error", "double"],
     // "semi": ["error", "always"],
    },
  },
];

// "no-console": "warn" → Warns against using console.log() (use a logger instead).
// "@typescript-eslint/no-unused-vars" → Prevents unused variables (_ prefix is ignored).
// "indent": ["error", 2] → Enforces 2-space indentation.
// "quotes": ["error", "double"] → Enforces double quotes.
// "semi": ["error", "always"] → Requires semicolons.
// npm run lint:fix