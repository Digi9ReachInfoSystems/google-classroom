import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Disable unused variable warnings
      "@typescript-eslint/no-unused-vars": "off",
      // Disable explicit any warnings
      "@typescript-eslint/no-explicit-any": "off",
      // Disable React hook dependency warnings
      "react-hooks/exhaustive-deps": "off",
      // Disable unescaped entities warnings
      "react/no-unescaped-entities": "off",
      // Disable prefer-const warnings
      "prefer-const": "off",
      // Disable no-assign-module-variable warnings
      "@next/next/no-assign-module-variable": "off",
      // Disable no-img-element warnings
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
