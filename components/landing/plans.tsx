'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    price: 'R$ 49',
    period: '/mês',
    description: 'Para quem está começando a vender com IA.',
    features: [
      'Atendimento via IA',
      'Até 100 pedidos por mês',
      'Dashboard básico',
      '1 categoria de produtos',
      'Suporte por e-mail',
    ],
    cta: 'Começar agora',
    href: '/signup?plan=starter',
    featured: false,
  },
  {
    name: 'Pro',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para restaurantes em crescimento.',
    features: [
      'Tudo do Starter',
      'Até 1.000 pedidos por mês',
      'Dashboard completo com gráficos',
      'Categorias ilimitadas',
      'Destaques de produtos',
      'Suporte prioritário',
    ],
    cta: 'Assinar Pro',
    href: '/signup?plan=pro',
    featured: true,
  },
  {
    name: 'Business',
    price: 'R$ 199',
    period: '/mês',
    description: 'Para operações de alto volume.',
    features: [
      'Tudo do Pro',
      'Pedidos ilimitados',
      'Relatórios avançados',
      'Múltiplas lojas',
      'API de integração',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com vendas',
    href: '/signup?plan=business',
    featured: false,
  },
];

export function Plans() {
  return (
    <section id="precos" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Preços
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Planos para cada etapa do seu negócio
          </h2>
          <p className="mt-4 text-muted-foreground">
            Comece pequeno e escale conforme suas vendas crescem. Sem fidelidade.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-card p-6 transition-all',
                plan.featured
                  ? 'border-primary shadow-xl lg:scale-105'
                  : 'border-border hover:border-primary/40 hover:shadow-md'
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    <Sparkles className="h-3 w-3" />
                    Mais popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-2">
                <Link href={plan.href} className="block">
                  <Button
                    className="w-full"
                    variant={plan.featured ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
