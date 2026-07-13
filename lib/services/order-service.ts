import { supabase } from '@/lib/supabase/client';
import type {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  DeliveryMethod,
  PaymentMethod,
  Customer,
} from '@/lib/types/database';
import { CustomerService } from './customer-service';
import { CompanyService } from './company-service';

// Order service — creates and manages orders in the database.
// The server (Supabase) is the single source of truth for prices and totals.
// Automatically creates/finds customers and saves order_items.
export class OrderService {
  // Create a new order with customer auto-creation and order_items
  static async create(payload: CreateOrderPayload): Promise<Order> {
    // 1. Upsert customer by phone
    let customerId: string | null = null;
    if (payload.customer_phone) {
      try {
        const customer = await CustomerService.upsertByPhone(
          payload.company_id,
          payload.customer_name,
          payload.customer_phone
        );
        customerId = customer.id;
      } catch {
        // Non-fatal — order can still be created without customer link
      }
    }

    // 2. Get company delivery fee
    let deliveryFee = 0;
    try {
      const company = await CompanyService.getById(payload.company_id);
      if (company?.delivery_fee && payload.delivery_method === 'delivery') {
        deliveryFee = Number(company.delivery_fee);
      }
    } catch {
      // Non-fatal
    }

    // 3. Generate order_number
    const { data: orderNumber, error: numError } = await supabase
      .rpc('generate_order_number', { company_uuid: payload.company_id });
    if (numError) throw new Error(`Erro ao gerar número do pedido: ${numError.message}`);

    // 4. Recalculate total from items (never trust client totals)
    const subtotal = payload.items.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    const total = subtotal + deliveryFee;

    // 5. Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        company_id: payload.company_id,
        customer_id: customerId,
        customer_name: payload.customer_name,
        customer_phone: payload.customer_phone,
        delivery_address: payload.delivery_method === 'pickup' ? null : payload.delivery_address,
        delivery_method: payload.delivery_method,
        payment_method: payload.payment_method,
        items: payload.items,
        total,
        notes: payload.notes || null,
        status: 'pending',
        order_number: orderNumber as number,
      })
      .select('*, customer:customers(*)')
      .single();

    if (orderError) throw new Error(`Erro ao criar pedido: ${orderError.message}`);
    const order = orderData as Order;

    // 6. Save order_items (normalized)
    if (order && payload.items.length > 0) {
      const orderItems = payload.items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await supabase.from('order_items').insert(orderItems);
    }

    return order;
  }

  // Fetch orders for a company (for the dashboard)
  static async listByCompany(companyId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Erro ao buscar pedidos: ${error.message}`);
    return (data as Order[]) || [];
  }

  // Fetch a single order
  static async getById(companyId: string, orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*)')
      .eq('company_id', companyId)
      .eq('id', orderId)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw new Error(`Erro ao buscar pedido: ${error.message}`);
    return (data as Order) || null;
  }

  // Update order status
  static async updateStatus(companyId: string, orderId: string, status: OrderStatus): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .eq('company_id', companyId)
      .select('*, customer:customers(*)')
      .single();
    if (error) throw new Error(`Erro ao atualizar status: ${error.message}`);
    return data as Order;
  }

  // Soft delete
  static async softDelete(companyId: string, orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('company_id', companyId);
    if (error) throw new Error(`Erro ao excluir pedido: ${error.message}`);
  }

  // Validate order before creation
  static validate(payload: CreateOrderPayload): string[] {
    const errors: string[] = [];
    if (!payload.customer_name?.trim()) errors.push('Nome do cliente é obrigatório.');
    if (!payload.customer_phone?.trim()) errors.push('Telefone do cliente é obrigatório.');
    if (payload.delivery_method === 'delivery' && !payload.delivery_address?.trim())
      errors.push('Endereço é obrigatório para entrega.');
    if (!payload.items || payload.items.length === 0) errors.push('O carrinho não pode estar vazio.');
    if (!payload.company_id) errors.push('Empresa não identificada.');
    return errors;
  }

  static formatOrderSummary(order: Order): string {
    const items = (order.items || [])
      .map((item: OrderItem) => `${item.quantity}x ${item.name} — R$ ${Number(item.price * item.quantity).toFixed(2)}`)
      .join('\n');
    const deliveryLabel = order.delivery_method === 'pickup' ? 'Retirada no local' : 'Entrega';
    const paymentLabels: Record<string, string> = {
      pix: 'PIX', cash: 'Dinheiro', card: 'Cartão', meal_voucher: 'Vale-refeição',
    };
    return `Pedido #${order.order_number || order.id.slice(0, 8)}\n\n${items}\n\nTotal: R$ ${Number(order.total).toFixed(2)}\nEntrega: ${deliveryLabel}\nPagamento: ${paymentLabels[order.payment_method || 'cash'] || order.payment_method}\nStatus: ${order.status}`;
  }
}
