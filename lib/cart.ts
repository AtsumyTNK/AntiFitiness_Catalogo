/**
 * lib/cart.ts
 *
 * Carrinho de compras — persistência em localStorage.
 * Só deve ser usado em componentes com "use client",
 * pois depende de `window` e `localStorage`.
 *
 * Chave de armazenamento: "af_cart_v1"
 * Evento de mudança:      "af:cart-changed"
 */

export type CartItem = {
  /** Identificador único do produto (SKU). */
  sku: string;
  /** Nome do produto. */
  name: string;
  /** URL da imagem do produto (opcional). */
  photo?: string;
  /** Rótulo da variação selecionada (ex: "500g", "1kg"). */
  variantLabel?: string;
  /** Quantidade no carrinho. */
  qty: number;
  /** Preço normal em R$ (pode ser nulo se não cadastrado). */
  price?: number | null;
  /** Preço com desconto em R$ (pode ser nulo se não cadastrado). */
  price_discounted?: number | null;
};

const STORAGE_KEY = "af_cart_v1";
const CART_EVENT = "af:cart-changed";

/** Retorna o nome do evento disparado quando o carrinho muda. */
export function getCartEventName() {
  return CART_EVENT;
}

function emitCartChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVENT));
}

/** Lê e retorna todos os itens do carrinho no localStorage. */
export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function setCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitCartChanged();
}

function keyOf(item: Pick<CartItem, "sku" | "variantLabel">) {
  return `${item.sku}::${item.variantLabel ?? "default"}`;
}

/**
 * Adiciona um item ao carrinho.
 * Se o item (sku + variação) já existe, incrementa a quantidade.
 */
export function addToCart(input: CartItem) {
  const items = getCart();
  const k = keyOf(input);
  const idx = items.findIndex((i) => keyOf(i) === k);

  if (idx >= 0) {
    const current = items[idx]!;
    items[idx] = { ...current, qty: Math.max(1, current.qty + Math.max(1, input.qty)) };
  } else {
    items.push({ ...input, qty: Math.max(1, input.qty) });
  }

  setCart(items);
}

/**
 * Atualiza a quantidade de um item específico.
 * Se qty for 0, o item é removido.
 */
export function updateCartItem(params: { sku: string; variantLabel?: string; qty: number }) {
  const items = getCart()
    .map((i) => (keyOf(i) === keyOf(params) ? { ...i, qty: params.qty } : i))
    .filter((i) => i.qty > 0);
  setCart(items);
}

/** Remove um item específico do carrinho pelo sku + variação. */
export function removeCartItem(params: { sku: string; variantLabel?: string }) {
  setCart(getCart().filter((i) => keyOf(i) !== keyOf(params)));
}

/** Remove todos os itens do carrinho. */
export function clearCart() {
  setCart([]);
}

// ── Item helpers (compat com campos legados do localStorage) ─────────────────
// Itens salvos em versões antigas podem ter campos diferentes (ex: productName,
// quantity, productSlug). Esses helpers normalizam o acesso de forma segura.

type AnyItem = CartItem & Record<string, unknown>;

/** Retorna a quantidade do item, compatível com o campo legado `quantity`. */
export function getItemQty(i: CartItem): number {
  const raw = (i as AnyItem).qty ?? (i as AnyItem).quantity ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

/** Retorna o nome do item, compatível com o campo legado `productName`. */
export function getItemName(i: CartItem): string {
  return String((i as AnyItem).name ?? (i as AnyItem).productName ?? "Produto");
}

/** Retorna o rótulo da variação, compatível com o campo legado `variantId`. */
export function getItemVariantLabel(i: CartItem): string {
  return String(
    (i as AnyItem).variantLabel ?? (i as AnyItem).variantId ?? "Padrão",
  );
}

/** Retorna o SKU do item, compatível com o campo legado `productSlug`. */
export function getItemSku(i: CartItem): string {
  return String((i as AnyItem).sku ?? (i as AnyItem).productSlug ?? "");
}

/** Retorna uma chave única para o item (sku + variação), usada como React key. */
export function getItemKey(i: CartItem): string {
  return `${getItemSku(i)}__${getItemVariantLabel(i)}`;
}

/**
 * Retorna o preço efetivo do item.
 * Prioridade: price_discounted → price → null.
 */
export function getEffectivePrice(i: CartItem): number | null {
  const p = i.price_discounted ?? i.price ?? null;
  return typeof p === "number" ? p : null;
}
