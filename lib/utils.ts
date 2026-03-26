/**
 * lib/utils.ts
 *
 * Funções utilitárias genéricas reutilizadas em todo o projeto.
 */

/**
 * Mantém um número dentro do intervalo [min, max].
 * @param n   Valor de entrada.
 * @param min Limite inferior (inclusive).
 * @param max Limite superior (inclusive).
 */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Formata um número como moeda brasileira (R$).
 * @param value Valor numérico a ser formatado.
 * @returns String no formato "R$ X.XXX,XX".
 */
export function formatPrice(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
