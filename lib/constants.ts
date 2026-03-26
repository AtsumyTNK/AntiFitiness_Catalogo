/**
 * lib/constants.ts
 *
 * Constantes globais e utilitários de link do WhatsApp.
 * Centraliza todos os números, mensagens e links de WhatsApp
 * usados nas páginas (home, catálogo, carrinho, produto).
 */

/** Número do WhatsApp principal da loja (com DDI). */
export const WHATS_NUMBER = "5517981229285";

/** Aviso padrão exibido em todo o catálogo sobre disponibilidade. */
export const WHATS_AVAILABILITY_NOTE = "Verificar disponibilidade no WhatsApp.";

const NUTRI_WHATS_NUMBER = "5517997429113";
const NUTRI_WHATS_MESSAGE =
  "Olá! Vim pelo Catálogo Online do AntiFitness e gostaria de falar com o nutricionista.";

/** Link direto para o WhatsApp da nutricionista com mensagem pré-preenchida. */
export const NUTRI_WHATS_LINK = `https://wa.me/${NUTRI_WHATS_NUMBER}?text=${encodeURIComponent(NUTRI_WHATS_MESSAGE)}`;

/**
 * Gera um link `wa.me` para o WhatsApp da loja com a mensagem codificada.
 * @param message Texto da mensagem a ser enviada (será codificado com encodeURIComponent).
 */
export function buildWhatsUrl(message: string): string {
  return `https://wa.me/${WHATS_NUMBER}?text=${encodeURIComponent(message)}`;
}
