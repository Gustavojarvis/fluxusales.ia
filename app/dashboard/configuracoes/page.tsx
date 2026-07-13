'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Loader2, Building2, Save, ExternalLink, Copy, Upload, Palette, MessageSquare, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CompanyService } from '@/lib/services/company-service';
import type { Plan, CompanySettings } from '@/lib/types/database';

function SettingsContent() {
  const { company, refreshCompany } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Company fields
  const [name, setName] = useState(company?.name || '');
  const [plan, setPlan] = useState<Plan>(company?.plan || 'starter');
  const [phone, setPhone] = useState(company?.phone || '');
  const [address, setAddress] = useState(company?.address || '');
  const [hours, setHours] = useState(company?.hours || '');
  const [deliveryFee, setDeliveryFee] = useState(String(company?.delivery_fee || 0));
  const [logo, setLogo] = useState(company?.logo || '');

  // Settings fields
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [brandColor, setBrandColor] = useState('#0ea5e9');

  const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/loja/${company?.id}` : '';

  useEffect(() => {
    async function loadSettings() {
      if (!company) return;
      try {
        const settings = await CompanyService.getSettings(company.id);
        if (settings) {
          setWelcomeMessage(settings.welcome_message || '');
          setBrandColor(settings.brand_color || '#0ea5e9');
          if (settings.logo) setLogo(settings.logo);
        }
      } catch {
        // Settings don't exist yet — that's fine
      } finally {
        setSettingsLoading(false);
      }
    }
    loadSettings();
  }, [company]);

  function handleLogoUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setLoading(true);

    try {
      // Update company
      await CompanyService.update(company.id, {
        name,
        plan,
        phone: phone || null,
        address: address || null,
        hours: hours || null,
        delivery_fee: Number(deliveryFee) || 0,
        logo: logo || null,
      });

      // Upsert settings
      await CompanyService.upsertSettings(company.id, {
        company_name: name,
        welcome_message: welcomeMessage || null,
        brand_color: brandColor,
        logo: logo || null,
      });

      await refreshCompany();
      toast({ title: 'Configurações salvas', description: 'Suas alterações foram aplicadas.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Gerencie as configurações da sua empresa" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company data */}
        <Card className="max-w-2xl p-6">
          <div className="mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Dados da empresa</h3>
          </div>

          <div className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo da empresa</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-muted">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} className="text-sm" />
                  <p className="mt-1 text-xs text-muted-foreground">PNG ou JPG, idealmente quadrada</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Nome da empresa</Label>
              <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Burger House" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 3333-4444" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Horário de funcionamento</Label>
                <Input id="hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Seg-Dom 18h-23h" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua das Flores, 123, Centro" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery-fee">
                  <span className="flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> Taxa de entrega (R$)
                  </span>
                </Label>
                <Input id="delivery-fee" type="number" step="0.50" min="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Plano atual</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Settings */}
        <Card className="max-w-2xl p-6">
          <div className="mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Configurações da IA</h3>
          </div>

          {settingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome">Mensagem de boas-vindas</Label>
                <Textarea
                  id="welcome"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder={`Olá! Bem-vindo(a) à ${name || 'nossa loja'}! 👋 Sou seu assistente virtual. Quer ver nosso cardápio?`}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Esta mensagem será enviada automaticamente quando um cliente abrir o chat.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-color">
                  <span className="flex items-center gap-1">
                    <Palette className="h-3.5 w-3.5" /> Cor principal da marca
                  </span>
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="brand-color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-10 w-16 cursor-pointer rounded border border-border"
                  />
                  <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="max-w-[120px]" />
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Salvar alterações</>
            )}
          </Button>
        </div>
      </form>

      {/* Store link */}
      {company && (
        <Card className="max-w-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold">Link da sua loja</h3>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Compartilhe este link com seus clientes para que possam fazer pedidos pelo chat com IA.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
            <Input readOnly value={storeUrl} className="border-0 bg-transparent" />
            <Button type="button" variant="outline" size="sm" onClick={() => {
              navigator.clipboard.writeText(storeUrl);
              toast({ title: 'Link copiado!', description: 'Link copiado para a área de transferência.' });
            }}>
              <Copy className="mr-2 h-4 w-4" /> Copiar
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}
