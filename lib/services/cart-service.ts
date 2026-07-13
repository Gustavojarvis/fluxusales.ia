import type { Product, Category, CartItem, Cart, DeliveryMethod, PaymentMethod } from '@/lib/types/database';

// Cart service — manages cart state in memory during the conversation.
// Calculates subtotals, delivery fees, and totals.
export class CartService {
  static createEmptyCart(): Cart {
    return {
      items: [],
      delivery_fee: 0,
      delivery_method: 'delivery',
      payment_method: 'cash',
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      notes: '',
    };
  }

  static addItem(cart: Cart, product: Product, quantity: number = 1): Cart {
    const existing = cart.items.find((item) => item.product_id === product.id);

    if (existing) {
      return {
        ...cart,
        items: cart.items.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * Number(item.price),
              }
            : item
        ),
      };
    }

    const newItem: CartItem = {
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      subtotal: Number(product.price) * quantity,
    };

    return { ...cart, items: [...cart.items, newItem] };
  }

  static removeItem(cart: Cart, productId: string): Cart {
    return {
      ...cart,
      items: cart.items.filter((item) => item.product_id !== productId),
    };
  }

  static updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
    if (quantity <= 0) return this.removeItem(cart, productId);

    return {
      ...cart,
      items: cart.items.map((item) =>
        item.product_id === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      ),
    };
  }

  static clear(cart: Cart): Cart {
    return { ...this.createEmptyCart(), delivery_method: cart.delivery_method, payment_method: cart.payment_method };
  }

  static getSubtotal(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  static getDeliveryFee(cart: Cart): number {
    return cart.delivery_method === 'pickup' ? 0 : cart.delivery_fee;
  }

  static getTotal(cart: Cart): number {
    return this.getSubtotal(cart) + this.getDeliveryFee(cart);
  }

  static getItemCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  static isEmpty(cart: Cart): boolean {
    return cart.items.length === 0;
  }

  static formatSummary(cart: Cart): string {
    if (this.isEmpty(cart)) return 'Seu carrinho está vazio.';

    const lines = cart.items.map(
      (item) => `${item.quantity}x ${item.name} — R$ ${item.subtotal.toFixed(2)}`
    );
    const subtotal = this.getSubtotal(cart);
    const deliveryFee = this.getDeliveryFee(cart);
    const total = this.getTotal(cart);

    let summary = lines.join('\n');
    summary += `\n\nSubtotal: R$ ${subtotal.toFixed(2)}`;
    if (deliveryFee > 0) {
      summary += `\nTaxa de entrega: R$ ${deliveryFee.toFixed(2)}`;
    }
    summary += `\n\n*Total: R$ ${total.toFixed(2)}*`;

    return summary;
  }
}
