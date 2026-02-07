import ProdutoClient from "./produto-client";

/**
 * app/produto/[slug]/page.tsx
 *
 * Server Component
 * - Mantém SSR/streaming do Next ativo.
 * - Não acessa browser APIs (window/localStorage).
 * - Delega a lógica e a leitura do slug para o Client Component (ProdutoClient),
 *   que pode usar useParams() ou usePathname().
 *
 * Observação:
 * - A regra "Verificar disponibilidade no WhatsApp." deve ser exibida no UI
 *   do ProdutoClient (no bloco do produto e nas variações), não aqui.
 */
export default function ProdutoPage() {
  return <ProdutoClient />;
}