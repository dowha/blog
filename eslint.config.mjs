// ESLint 설정 (next lint 대신 ESLint CLI로 실행: pnpm lint)
import { dirname } from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  // 플러그인(@next/eslint-plugin-next 등)은 eslint-config-next의 의존성이라 그 위치에서 찾는다.
  // pnpm 10은 eslint 플러그인을 최상위 node_modules로 끌어올리지 않아 기본 위치에서는 못 찾는다.
  resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next/package.json")),
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
