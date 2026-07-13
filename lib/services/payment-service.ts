import type { PaymentMethod } from '@/lib/types/database';

// Payment service — abstracted for future gateway integration.
// For the MVP, supports payment-on-delivery methods (cash, PIX manual).
export class PaymentService {
  static readonly PAYMENT_LABELS: Record<PaymentMethod, string> = {
    pix: 'PIX',
    cash: 'Dinheiro na entrega',
    card: 'Cartão na entrega',
    meal_voucher: 'Vale-refeição',
  };

  static readonly PAYMENT_DESCRIPTIONS: Record<PaymentMethod, string> = {
    pix: 'Você receberá a chave PIX para fazer o pagamento.',
    cash: 'Pague em dinheiro no momento da entrega.',
    card: 'Pague com cartão no momento da entrega.',
    meal_voucher: 'Use seu vale-refeição no momento da entrega.',
  };

  static getLabel(method: PaymentMethod): string {
    return this.PAYMENT_LABELS[method];
  }

  static getDescription(method: PaymentMethod): string {
    return this.PAYMENT_DESCRIPTIONS[method];
  }

  static getAllMethods(): PaymentMethod[] {
    return ['pix', 'cash', 'card', 'meal_voucher'];
  }

  // Validate payment method
  static isValidMethod(method: string): method is PaymentMethod {
    return ['pix', 'cash', 'card', 'meal_voucher'].includes(method);
  }
}
