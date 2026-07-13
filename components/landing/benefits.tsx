'use client';

import { Clock, TrendingUp, Zap, ShoppingCart, LayoutDashboard, Settings } from 'lucide-react';

const BENEFITS = [
  {
    icon: Clock,
    title: 'Atendimento 24 horas',
    description: 'Seu negócio nunca fecha. A IA atende clientes a qualquer hora do dia ou da noite.',
  },
  {
    icon: TrendingUp,
    title: 'Aumento das vendas',
    description: 'Sugestões inteligentes e upsell automático aumentam o ticket médio.',
  },
  {
    icon: Zap,
    title: 'Redução do tempo de resposta',
    description: 'Respostas instantâneas. Nenhum cliente espera na fila.',
  },
  {
    icon: ShoppingCart,
    title: 'Mais pedidos automáticos',
    description: 'A IA cria pedidos diretamente no painel, sem intervenção manual.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard completo',
    description: 'Acompanhe receita, pedidos, clientes e produtos em tempo real.',
  },
  {
    icon: Settings,
    title: 'Configuração simples',
    description: 'Cadastre seus produtos e a IA começa a vender em minutos.',
  },
];

export function Benefits() {
  return (
    <section id="recursos" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Benefícios
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Tudo que sua hamburgueria precisa
          </h2>
          <p className="mt-4 text-muted-foreground">
            Recursos pensados para aumentar suas vendas e facilitar sua gestão.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
