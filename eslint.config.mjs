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
    // Vendored ReUI registry code (installed by the shadcn CLI, not edited here).
    // cascader-virtual.tsx disables `react-hooks/incompatible-library`, a rule that
    // only exists in eslint-plugin-react-hooks v6+; this project ships v5 via
    // eslint-config-next 15, so linting that one file would fail on the unknown rule.
    ignores: ["src/components/reui/cascader/cascader-virtual.tsx"],
  },
];

export default eslintConfig;
