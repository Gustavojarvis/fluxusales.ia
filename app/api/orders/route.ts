import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order-service';
import type { ApiResponse, Order, CreateOrderPayload } from '@/lib/types/database';

// GET /api/orders?company_id=xxx
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

    const orders = await OrderService.listByCompany(companyId);
    return NextResponse.json<ApiResponse<Order[]>>({ success: true, data: orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// POST /api/orders — create a new order
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as CreateOrderPayload;

    const errors = OrderService.validate(payload);
    if (errors.length > 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: errors.join(' ') },
        { status: 400 }
      );
    }

    const order = await OrderService.create(payload);
    return NextResponse.json<ApiResponse<Order>>(
      { success: true, data: order, message: 'Pedido criado com sucesso.' },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao criar pedido.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
