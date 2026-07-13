import { NextRequest, NextResponse } from 'next/server';
import { CartService } from '@/lib/services/cart-service';
import type { ApiResponse, Cart, Product } from '@/lib/types/database';
import { supabase } from '@/lib/supabase/client';

// POST /api/cart/add — add item to cart (validates product against DB)
export async function POST(req: NextRequest) {
  try {
    const { cart, product_id, quantity } = await req.json() as {
      cart: Cart;
      product_id: string;
      quantity?: number;
    };

    if (!cart || !product_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Dados inválidos.' },
        { status: 400 }
      );
    }

    // Fetch the product from DB to validate price and availability
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !product) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Produto inexistente.' },
        { status: 404 }
      );
    }

    if (!product.is_available) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Produto indisponível.' },
        { status: 400 }
      );
    }

    const updatedCart = CartService.addItem(cart, product as Product, quantity || 1);
    return NextResponse.json<ApiResponse<Cart>>({ success: true, data: updatedCart });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Erro interno.' },
      { status: 500 }
    );
  }
}
