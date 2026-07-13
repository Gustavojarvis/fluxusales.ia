import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/order-service';
import type { ApiResponse, Order, OrderStatus } from '@/lib/types/database';

// GET /api/orders/[id]?company_id=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Empresa não identificada.' },
        { status: 400 }
      );
    }

    const order = await OrderService.getById(companyId, params.id);
    if (!order) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Pedido não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Order>>({ success: true, data: order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] — update order status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const body = await req.json();
    const { status } = body as { status: OrderStatus };

    if (!companyId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Empresa não identificada.' },
        { status: 400 }
      );
    }

    const validStatuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Status inválido.' },
        { status: 400 }
      );
    }

    const order = await OrderService.updateStatus(companyId, params.id, status);
    return NextResponse.json<ApiResponse<Order>>({ success: true, data: order });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao atualizar pedido.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
