import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintImport from "eslint-plugin-import";
import prettier from "eslint-config-prettier";
import formatjs from "eslint-plugin-formatjs";

export default defineConfig([
  { ignores: ["*/__generated__/*", "node_modules"] },

  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      eslintImport.flatConfigs.recommended,
      eslintImport.flatConfigs.typescript,
      formatjs.configs.strict,
      prettier,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import/resolver": {
        node: { extensions: [".ts", ".tsx"] },
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      "import/no-unresolved": ["error", { ignore: ["bun:test"] }],

      // Enforce a consistent import grouping, especially for external dependencies.
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["sibling", "parent"], "object"],
          "newlines-between": "always",
        },
      ],

      // Disabled because it's not worth the hassle.
      "@typescript-eslint/no-unnecessary-type-parameters": "off",

      // Actually, it's nice to be able to have explicit if conditionals rather than be
      // forced to use a no-condition else.
      "@typescript-eslint/no-unnecessary-condition": "off",

      // ESLint suggests that `str || fallback` is the same as `str ?? fallback`, but
      // the left one also treats `""` as a falsy value, which is sometimes what we want.
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true } },
      ],

      // We still want the strict template expression check, but we can let numbers slide.
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],

      // Enforce a consistent ID pattern for all messages. This lets us generate IDs using
      // eslint's autofix.
      "formatjs/enforce-id": ["error", { idInterpolationPattern: "[sha512:contenthash:base64:8]" }],

      // For organizational reasons, we don't want a mess of message definitions in every
      // random file.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@formatjs/intl",
              importNames: ["defineMessage", "defineMessages"],
              message: "Only define messages in specific *.intl.ts files.",
            },
          ],
        },
      ],
    },
  },

  {
    files: ["**/*.intl.ts"],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  {
    files: ["**/*.test.ts"],
    rules: {
      // For cases like `expect(instance.unboundMethod).toBeCalled()`.
      "@typescript-eslint/unbound-method": "off",
    },
  },
]);
