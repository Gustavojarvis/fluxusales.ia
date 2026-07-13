import { NextRequest, NextResponse } from 'next/server';
import { CatalogService } from '@/lib/services/catalog-service';
import type { ApiResponse, Product } from '@/lib/types/database';

// GET /api/products?company_id=xxx
// Returns available products for the public storefront (anon-accessible).
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Empresa não identificada.' },
        { status: 400 }
      );
    }

    const products = await CatalogService.getProducts(companyId);
    return NextResponse.json<ApiResponse<Product[]>>({ success: true, data: products });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
