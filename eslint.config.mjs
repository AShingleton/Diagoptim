import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dist/**",
    "coverage/**",
    "workers/**",
  ]),
  // Stricter TypeScript rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Enforce explicit return types on exported functions
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      // Prevent unused variables (error level)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // Disallow explicit 'any' type
      "@typescript-eslint/no-explicit-any": "warn",
      // Require consistent type imports
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      // No floating promises (must be awaited or void-returned)
      "@typescript-eslint/no-floating-promises": "off",
      // Prefer nullish coalescing over logical OR for nullable values
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      // Enforce strict boolean expressions
      "@typescript-eslint/strict-boolean-expressions": "off",
      // General best practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
]);

export default eslintConfig;
