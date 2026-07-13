import { NextRequest, NextResponse } from 'next/server';
import { CatalogService } from '@/lib/services/catalog-service';
import type { ApiResponse, Category } from '@/lib/types/database';

// GET /api/categories?company_id=xxx
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

    const categories = await CatalogService.getCategories(companyId);
    return NextResponse.json<ApiResponse<Category[]>>({ success: true, data: categories });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
