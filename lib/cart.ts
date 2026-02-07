/**
 * Carrinho (client-side)
 * - Persistência em localStorage
 * - Operações: getCart, addToCart, updateCartItem/updateQty, removeCartItem, clearCart
 *
 * Observação:
 * - Este módulo deve ser usado apenas em componentes client ("use client"),
 *   porque localStorage não existe no server.
 */

export type CartItem = {
  sku: string;
  name: string;
  photo?: string;
  variantLabel?: string; // ex: "250g"
  qty: number;
};

const STORAGE_KEY = "af_cart_v1";
const CART_EVENT = "af:cart-changed";

/**
 * Dispara evento para atualizar UI (mesma aba).
 */
function emitCartChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CART_EVENT));
}

/**
 * Exponho o nome do evento para quem quiser escutar.
 */
export function getCartEventName() {
  return CART_EVENT;
}

/**
 * Lê o carrinho do localStorage com fallback seguro.
 */
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

/**
 * Salva o carrinho no localStorage.
 */
function setCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitCartChanged();
}

/**
 * Gera uma chave única por item (SKU + variação).
 */
function keyOf(item: Pick<CartItem, "sku" | "variantLabel">) {
  return `${item.sku}::${item.variantLabel ?? "default"}`;
}

/**
 * Adiciona item ao carrinho.
 * - Se o item já existir (mesmo sku + variação), soma qty.
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
 * Atualiza quantidade de um item do carrinho.
 * - Se qty <= 0, remove o item.
 */
export function updateCartItem(params: { sku: string; variantLabel?: string; qty: number }) {
  const items = getCart();
  const k = keyOf(params);

  const next = items
    .map((i) => {
      if (keyOf(i) !== k) return i;
      return { ...i, qty: params.qty };
    })
    .filter((i) => i.qty > 0);

  setCart(next);
}

/**
 * Alias (compatibilidade).
 */
export const updateQty = updateCartItem;

/**
 * Remove um item do carrinho (SKU + variação).
 */
export function removeCartItem(params: { sku: string; variantLabel?: string }) {
  const items = getCart();
  const k = keyOf(params);
  setCart(items.filter((i) => keyOf(i) !== k));
}

/**
 * Limpa o carrinho por completo.
 */
export function clearCart() {
  setCart([]);
}