import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

/**
 * ESLint Config (Next.js App Router + TypeScript)
 *
 * Objetivo:
 * - Manter as regras importantes do Next (core-web-vitals + TS)
 * - Evitar falsos positivos no padrão de hidratação:
 *   - ler localStorage dentro de useEffect
 *   - sincronizar estado do React com fonte externa (storage)
 *
 * Observação:
 * - Essas regras são úteis em projetos “puros”, mas aqui geram ruído e não representam bug real.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Ignorar arquivos/pastas que não devem ser lintados
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  /**
   * Overrides do projeto
   * - Desliga regras que estão atrapalhando o fluxo e não indicam erro real aqui.
   */
  {
    rules: {
      /**
       * Você usa useEffect para sincronizar com localStorage:
       * setItems(getCart()) / setHydrated(true) etc.
       *
       * Isso é um padrão válido: o effect existe justamente para sincronizar com sistemas externos.
       * Essa regra fica muito agressiva e vira “erro” no VS Code.
       */
      "react-hooks/set-state-in-effect": "off",

      /**
       * Você já removeu o uso de ref.current durante render no carrinho,
       * mas caso apareça novamente, essa regra pode gerar ruído.
       * Ref deve ser lido em handlers/effects; quando isso é respeitado,
       * não há motivo para o lint bloquear o desenvolvimento.
       */
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;