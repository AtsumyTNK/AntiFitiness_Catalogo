import { fetchCatalogProducts } from "@/lib/db/products";
import { NextResponse } from "next/server";

/**
 * GET /api/products
 * Retorna produtos no shape que o front já usa.
 */
export async function GET() {
  try {
    const products = await fetchCatalogProducts();
    return NextResponse.json({ products });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}