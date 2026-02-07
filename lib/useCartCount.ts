"use client";

import { getCart, getCartEventName } from "@/lib/cart";
import { useEffect, useMemo, useState } from "react";

function safeCount() {
  const items = getCart();
  return items.reduce((acc, i) => acc + (Number.isFinite(i.qty) ? i.qty : 0), 0);
}

export function useCartCount() {
  const [count, setCount] = useState<number>(() => 0);

  useEffect(() => {
    // inicializa no mount
    setCount(safeCount());

    const onCartChanged = () => setCount(safeCount());

    // mesma aba (evento custom)
    window.addEventListener(getCartEventName(), onCartChanged);

    // outra aba (storage)
    const onStorage = (e: StorageEvent) => {
      // qualquer mudança no localStorage do carrinho atualiza
      if (!e.key) return;
      if (e.key.includes("af_cart_v1")) onCartChanged();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(getCartEventName(), onCartChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return useMemo(() => count, [count]);
}