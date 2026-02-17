import { supabase } from "@/lib/supabase";

/**
 * ============================================================
 * Tipos do banco (Supabase)
 * ============================================================
 *
 * Observação importante:
 * - Agora vamos suportar CATEGORIAS de verdade.
 * - Para isso, você precisa ter a coluna `category` (tipo text) na tabela `products`.
 *
 * Tabela: products
 *  - sku (text) [PK ou unique]
 *  - name (text)
 *  - description (text)
 *  - photo_url (text, pode ser null)
 *  - category (text, pode ser null)  ✅ NOVO
 */

/**
 * Produto como vem do banco.
 * - category pode ser null (se você não preencher em algum produto)
 */
export type DbProduct = {
  sku: string;
  name: string;
  description: string;
  photo_url: string | null;
  category: string | null;
};

/**
 * Variação como vem do banco.
 * Tabela: product_variants
 * - id (uuid)
 * - product_sku (text) -> referencia products.sku (idealmente)
 * - label (text)
 * - sort_order (int)
 */
export type DbVariant = {
  id: string;
  product_sku: string;
  label: string;
  sort_order: number;
};

/**
 * ============================================================
 * Tipo final que a UI consome (Catálogo e Produto)
 * ============================================================
 * Regras do projeto:
 * - status do produto é fixo: "ENCOMENDA"
 * - status das variantes é fixo: "ENCOMENDA"
 * - category agora vem do banco (products.category)
 */
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: string[];
  status: "ENCOMENDA";
  category: string;
  variants: {
    id: string;
    label: string;
    status: "ENCOMENDA";
  }[];
};

/**
 * ============================================================
 * Slugify
 * ============================================================
 * Gera slug previsível:
 * - remove acentos
 * - lower
 * - troca qualquer sequência não alfanumérica por "-"
 * - remove hífens sobrando no início/fim
 */
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

/**
 * ============================================================
 * Normalização de categoria
 * ============================================================
 * Evita:
 * - categoria vazia quebrando o filtro (fica "")
 * - espaços sobrando criando categorias duplicadas (ex: "Mix " vs "Mix")
 *
 * Dica: se você quiser forçar um padrão (ex: Title Case), dá pra fazer aqui.
 */
function normalizeCategory(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim();
}

/**
 * ============================================================
 * fetchCatalogProducts
 * ============================================================
 * Busca:
 * - products (SKU, nome, descrição, foto, categoria)
 * - product_variants (vinculadas por product_sku)
 *
 * Retorna no formato exato da UI.
 */
export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  /**
   * 1) Produtos
   * - IMPORTANTE: incluímos `category` no select.
   */
  const { data: productsRaw, error: pErr } = await supabase
    .from("products")
    .select("sku,name,description,photo_url,category")
    .order("name", { ascending: true });

  if (pErr) throw new Error(pErr.message);

  const products = (productsRaw ?? []) as DbProduct[];
  if (products.length === 0) return [];

  /**
   * 2) Variações
   */
  const { data: variantsRaw, error: vErr } = await supabase
    .from("product_variants")
    .select("id,product_sku,label,sort_order")
    .order("sort_order", { ascending: true });

  if (vErr) throw new Error(vErr.message);

  const variants = (variantsRaw ?? []) as DbVariant[];

  /**
   * 3) Indexa variações por SKU para lookup O(1)
   */
  const bySku = new Map<string, DbVariant[]>();
  for (const v of variants) {
    const arr = bySku.get(v.product_sku);
    if (arr) arr.push(v);
    else bySku.set(v.product_sku, [v]);
  }

  /**
   * 4) Monta o shape final da UI
   * - category vem do banco (products.category)
   * - fallback: "" (assim o filtro só funciona quando você preencher)
   */
  return products.map((p) => {
    const v = bySku.get(p.sku) ?? [];

    // “Blindagem” básica (evita undefined em edge-cases)
    const safeName = p.name ?? "";
    const safeDescription = p.description ?? "";

    // Slug sempre válido (se slugify falhar, usa o SKU)
    const slug = slugify(safeName) || p.sku;

    // Imagem: se não tiver URL, cai no placeholder local
    const imageUrl = p.photo_url || "/placeholder.png";

    // Categoria: agora vem do banco
    const category = normalizeCategory(p.category);

    // Variações: garante pelo menos 1 opção pra UI nunca quebrar
    const mappedVariants =
      v.length > 0
        ? v.map((x) => ({
            id: x.id,
            label: x.label,
            status: "ENCOMENDA" as const,
          }))
        : [
            {
              id: "default",
              label: "Padrão",
              status: "ENCOMENDA" as const,
            },
          ];

    return {
      id: p.sku,
      slug,
      name: safeName,
      description: safeDescription,
      images: [imageUrl],
      status: "ENCOMENDA",
      category,
      variants: mappedVariants,
    };
  });
}