import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/services/cart-service';
import type { ApiResponse, Cart } from '@/lib/types/database';

// PATCH /api/cart/update — update item quantity
export async function PATCH(req: NextRequest) {
  try {
    const { cart, product_id, quantity } = await req.json() as {
      cart: Cart;
      product_id: string;
      quantity: number;
    };

    if (!cart || !product_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const updatedCart = CartService.updateQuantity(cart, product_id, quantity);
    return NextResponse.json<ApiResponse<Cart>>({ success: true, data: updatedCart });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Erro interno.' },
      { status: 500 }
    );
  }
}
