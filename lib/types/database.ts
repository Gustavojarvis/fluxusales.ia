// ============ Existing types (from Part 2) ============

export type Plan = 'starter' | 'pro' | 'business';

export type Company = {
  id: string;
  name: string;
  slug: string | null;
  user_id: string;
  plan: Plan;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Extended fields (SaaS evolution)
  logo?: string | null;
  phone?: string | null;
  address?: string | null;
  hours?: string | null;
  delivery_fee?: number;
  welcome_message?: string | null;
  brand_color?: string | null;
};

export type Category = {
  id: string;
  company_id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Product = {
  id: string;
  company_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sku: string | null;
  prep_time: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: Category | null;
};

export type Customer = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  // Extended fields
  total_spent?: number;
  order_count?: number;
  last_order_at?: string | null;
};

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type OrderItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  company_id: string;
  customer_id: string | null;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: Customer | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_method?: DeliveryMethod;
  payment_method?: PaymentMethod;
  notes?: string | null;
  order_number?: number | null;
};

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sku: string;
  prep_time: string;
};

// ============ Part 3: Chat, Cart, Orders, Payments ============

export type DeliveryMethod = 'delivery' | 'pickup';
export type PaymentMethod = 'pix' | 'cash' | 'card' | 'meal_voucher';

export type ConversationState =
  | 'INICIO'
  | 'ESCOLHENDO_PRODUTO'
  | 'OFERECENDO_ADICIONAIS'
  | 'CONFIRMANDO_PEDIDO'
  | 'COLETANDO_NOME'
  | 'COLETANDO_TELEFONE'
  | 'COLETANDO_ENDERECO'
  | 'ESCOLHENDO_ENTREGA'
  | 'ESCOLHENDO_PAGAMENTO'
  | 'RESUMO'
  | 'FINALIZADO';

export type MessageRole = 'user' | 'bot' | 'system';

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  products?: Product[];
  quickReplies?: string[];
};

export type CartItem = {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
};

export type Cart = {
  items: CartItem[];
  delivery_fee: number;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  notes: string;
};

export type ConversationSession = {
  id: string;
  company_id: string;
  state: ConversationState;
  messages: ChatMessage[];
  cart: Cart;
  last_offered_category?: string | null;
  offered_categories: string[];
  conversation_db_id?: string | null;
};

export type CreateOrderPayload = {
  company_id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  items: OrderItem[];
  total: number;
  notes: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string;
};

// ============ SaaS Evolution: Multi-company, Settings, Kitchen ============

export type UserRole = 'admin' | 'funcionario';

export type AppUser = {
  id: string;
  company_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type CompanySettings = {
  id: string;
  company_id: string;
  company_name: string | null;
  welcome_message: string | null;
  brand_color: string | null;
  logo: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  company_id: string;
  plan: Plan;
  status: 'active' | 'canceled' | 'trialing' | 'past_due';
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  company_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: 'active' | 'completed' | 'abandoned';
  state: string;
  cart_data: Record<string, unknown>;
  abandoned_cart: Record<string, unknown>;
  last_message: string | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender: 'customer' | 'ai' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
};

export type AbandonedCart = {
  conversation_id: string;
  company_id: string;
  customer_name: string;
  customer_phone: string;
  cart_items: CartItem[];
  last_message: string;
  created_at: string;
};

export type DashboardAnalytics = {
  conversationsStarted: number;
  ordersCreated: number;
  conversionRate: number;
  topProduct: { name: string; quantity: number } | null;
  avgTicket: number;
  revenueToday: number;
  ordersToday: number;
  pendingOrders: number;
  newCustomers: number;
};
