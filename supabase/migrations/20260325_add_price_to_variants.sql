-- Adiciona colunas de preço na tabela product_variants
-- price: preço normal (ex: 39.90)
-- price_discounted: preço com desconto — NULL significa sem desconto ativo

ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS price numeric(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_discounted numeric(10, 2) DEFAULT NULL;

-- Comentários para documentar as colunas
COMMENT ON COLUMN product_variants.price IS 'Preço normal do produto nesta variação (ex: 39.90). NULL = sem preço cadastrado.';
COMMENT ON COLUMN product_variants.price_discounted IS 'Preço com desconto. NULL = sem desconto ativo. Sempre deve ser menor que price.';
