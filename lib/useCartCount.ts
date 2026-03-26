"use client";

/**
 * lib/useCartCount.ts
 *
 * Hook React que retorna o total de itens no carrinho em tempo real.
 * Atualiza automaticamente quando o carrinho muda via evento "af:cart-changed"
 * ou via `localStorage` (sincronização entre abas).
 *
 * Só pode ser usado em componentes com "use client".
 */

import { getCart, getCartEventName } from "@/lib/cart";
import { useEffect, useState } from "react";

function safeCount() {
  return getCart().reduce((acc, i) => acc + (Number.isFinite(i.qty) ? i.qty : 0), 0);
}

/**
 * Retorna o número total de itens no carrinho (somando quantidades).
 * Inicia em 0 no servidor (SSR-safe) e sincroniza no cliente após hidratação.
 */
export function useCartCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(safeCount());

    const update = () => setCount(safeCount());

    window.addEventListener(getCartEventName(), update);
    window.addEventListener("storage", (e: StorageEvent) => {
      if (e.key?.includes("af_cart_v1")) update();
    });

    return () => {
      window.removeEventListener(getCartEventName(), update);
    };
  }, []);

  return count;
}
