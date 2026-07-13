'use client';

import { ShoppingCart, MessageSquare, ClipboardList, Bell } from 'lucide-react';

const STEPS = [
  {
    icon: ShoppingCart,
    title: 'Cliente acessa o site da hamburgueria',
    description: 'O cliente entra no site e é recebido instantaneamente pela IA.',
  },
  {
    icon: MessageSquare,
    title: 'A IA conversa naturalmente',
    description: 'A inteligência artificial entende o pedido, tira dúvidas e sugere produtos.',
  },
  {
    icon: ClipboardList,
    title: 'O pedido é criado automaticamente',
    description: 'Sem intervenção humana, o pedido é montado e enviado para a cozinha.',
  },
  {
    icon: Bell,
    title: 'O proprietário recebe o pedido no painel',
    description: 'Você acompanha tudo em tempo real pelo dashboard FluxSales AI.',
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Como Funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Do primeiro olá ao pedido na cozinha
          </h2>
          <p className="mt-4 text-muted-foreground">
            Quatro passos simples para transformar conversas em vendas.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative mt-16">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block" />

          <div className="grid gap-8 md:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={i} className="relative text-center">
                {/* Number circle */}
                <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                {/* Step number badge */}
                <div className="mx-auto mt-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="mt-3 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
