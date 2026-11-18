// ESLint 설정 (next lint 대신 ESLint CLI로 실행: pnpm lint)
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // next lint가 검사하지 않던 빌드 결과물·자동 생성 파일은 제외
  // supabase/functions는 Deno 런타임 코드라 Next 린트 대상이 아님
  { ignores: ['.next/**', 'out/**', 'public/**', 'next-env.d.ts', 'supabase/functions/**'] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    settings: {
      "import/resolver": {
        node: {
          paths: ["src"]
        }
      }
    }
  }
];

export default eslintConfig;
