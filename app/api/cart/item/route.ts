import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/services/cart-service';
import type { ApiResponse, Cart } from '@/lib/types/database';

// DELETE /api/cart/item — remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const { cart, product_id } = await req.json() as {
      cart: Cart;
      product_id: string;
    };

    if (!cart || !product_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const updatedCart = CartService.removeItem(cart, product_id);
    return NextResponse.json<ApiResponse<Cart>>({ success: true, data: updatedCart });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Erro interno.' },
      { status: 500 }
    );
  }
}
