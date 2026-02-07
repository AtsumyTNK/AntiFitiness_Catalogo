import { supabase } from "@/lib/supabase";

/**
 * ============================================================
 * Tipos do banco (Supabase)
 * ============================================================
 */

/**
 * Produto como vem do banco.
 * Observação:
 * - Removido status_label porque a UI foi padronizada em "ENCOMENDA".
 * - Se sua coluna description puder ser null, ajuste o tipo para `string | null`.
 */
export type DbProduct = {
  sku: string;
  name: string;
  description: string;
  photo_url: string | null;
};

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
 * - status e status das variantes são fixos: "ENCOMENDA"
 * - category está vazio por enquanto (pode vir do banco no futuro)
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
 * fetchCatalogProducts
 * ============================================================
 * Busca:
 * - products (SKU, nome, descrição, foto)
 * - product_variants (vinculadas por product_sku)
 *
 * Retorna no formato exato da UI.
 */
export async function fetchCatalogProducts(): Promise<CatalogProduct[]> {
  /**
   * 1) Produtos
   */
  const { data: productsRaw, error: pErr } = await supabase
    .from("products")
    .select("sku,name,description,photo_url")
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
   */
  return products.map((p) => {
    const v = bySku.get(p.sku) ?? [];

    const safeName = p.name ?? "";
    const safeDescription = p.description ?? "";

    const slug = slugify(safeName) || p.sku;
    const imageUrl = p.photo_url || "/placeholder.png";

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
      category: "",
      variants: mappedVariants,
    };
  });
}