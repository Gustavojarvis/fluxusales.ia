'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle2, MapPin, CreditCard, Truck, Store } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CartService } from '@/lib/services/cart-service';
import { OrderService } from '@/lib/services/order-service';
import { CompanyService } from '@/lib/services/company-service';
import type { Company, Cart, DeliveryMethod, PaymentMethod, Order } from '@/lib/types/database';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const companyId = searchParams.get('company') || '';
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [cartItems, setCartItems] = useState<{ product_id: string; name: string; price: number; quantity: number }[]>([]);

  useEffect(() => {
    if (!companyId) {
      router.push('/');
      return;
    }
    loadData();
  }, [companyId]);

  async function loadData() {
    setLoading(true);
    try {
      const comp = await CompanyService.getById(companyId);
      if (!comp) {
        toast({ title: 'Loja não encontrada', variant: 'destructive' });
        router.push('/');
        return;
      }
      setCompany(comp);

      // Load cart from sessionStorage
      const cartJson = sessionStorage.getItem(`cart:${companyId}`);
      if (cartJson) {
        const cart = JSON.parse(cartJson) as { items: typeof cartItems };
        setCartItems(cart.items || []);
      }
    } catch {
      toast({ title: 'Erro ao carregar dados da loja', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'delivery' ? (company?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Adicione produtos antes de finalizar.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = deliveryMethod === 'delivery'
        ? `${address}, ${addressNumber}${complement ? ' - ' + complement : ''}`
        : null;

      const payload = {
        company_id: companyId,
        customer_name: name,
        customer_phone: phone,
        delivery_address: fullAddress,
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        items: cartItems,
        total,
        notes,
      };

      const errors = OrderService.validate(payload);
      if (errors.length > 0) {
        toast({ title: 'Erro de validação', description: errors.join(' '), variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      const order = await OrderService.create(payload);
      setCompletedOrder(order);
      sessionStorage.removeItem(`cart:${companyId}`);
      toast({ title: 'Pedido confirmado!', description: `Pedido #${order.order_number} criado com sucesso.` });
    } catch (err) {
      toast({ title: 'Erro ao criar pedido', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (completedOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Pedido confirmado!</h1>
          <p className="mt-2 text-muted-foreground">
            Pedido <strong>#{completedOrder.order_number}</strong> recebido! A cozinha já começou o preparo.
          </p>
          <div className="mt-6 rounded-lg bg-muted/50 p-4 text-left text-sm">
            <p className="font-semibold">Resumo:</p>
            {(completedOrder.items || []).map((item, i) => (
              <p key={i}>{item.quantity}x {item.name} — R$ {(item.price * item.quantity).toFixed(2)}</p>
            ))}
            <Separator className="my-2" />
            <p className="font-bold">Total: R$ {Number(completedOrder.total).toFixed(2)}</p>
            <p className="text-muted-foreground">
              {completedOrder.delivery_method === 'pickup' ? 'Retirada no local' : 'Entrega'}
            </p>
          </div>
          <Button className="mt-6 w-full" onClick={() => router.push(`/loja/${companyId}`)}>
            Voltar para a loja
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button onClick={() => router.push(`/loja/${companyId}`)} className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Finalizar Pedido</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {cartItems.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Seu carrinho está vazio.</p>
            <Button className="mt-4" onClick={() => router.push(`/loja/${companyId}`)}>
              Ver cardápio
            </Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cart summary */}
            <Card className="p-4">
              <h2 className="mb-3 text-base font-semibold">Seu pedido</h2>
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxa de entrega</span><span>R$ {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span><span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Customer data */}
            <Card className="p-4 space-y-4">
              <h2 className="text-base font-semibold">Seus dados</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="(11) 99999-9999" />
                </div>
              </div>
            </Card>

            {/* Delivery method */}
            <Card className="p-4 space-y-4">
              <h2 className="text-base font-semibold">Forma de entrega</h2>
              <RadioGroup value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as DeliveryMethod)}>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <label htmlFor="delivery" className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-primary" /> Entrega
                  </label>
                  <span className="text-sm text-muted-foreground">R$ {(company?.delivery_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <label htmlFor="pickup" className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                    <Store className="h-4 w-4 text-primary" /> Retirada no local
                  </label>
                  <span className="text-sm text-success">Grátis</span>
                </div>
              </RadioGroup>

              {deliveryMethod === 'delivery' && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required className="pl-9" placeholder="Rua, bairro" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="number">Número *</Label>
                      <Input id="number" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} required placeholder="123" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto 4" />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Payment method */}
            <Card className="p-4 space-y-4">
              <h2 className="text-base font-semibold">Forma de pagamento</h2>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                {[
                  { value: 'pix', label: 'PIX', desc: 'Você receberá a chave PIX' },
                  { value: 'cash', label: 'Dinheiro', desc: 'Pagamento na entrega' },
                  { value: 'card', label: 'Cartão', desc: 'Na entrega/retirada' },
                  { value: 'meal_voucher', label: 'Vale-refeição', desc: 'Na entrega/retirada' },
                ].map((opt) => (
                  <div key={opt.value} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <RadioGroupItem value={opt.value} id={`pay-${opt.value}`} />
                    <label htmlFor={`pay-${opt.value}`} className="flex-1 cursor-pointer">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <CreditCard className="h-4 w-4" /> {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            {/* Notes */}
            <Card className="p-4 space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: sem cebola, ponto da carne..." rows={2} />
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
              ) : (
                `Confirmar pedido — R$ ${total.toFixed(2)}`
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
