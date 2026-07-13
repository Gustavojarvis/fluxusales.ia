'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle, Sparkles, MessageSquare, BarChart3, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Background grid + glow */}
      <div className="absolute inset-0 bg-grid-dark [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur animate-fade-up">
            <Sparkles className="h-4 w-4 text-primary" />
            Inteligência Artificial para vendas
          </div>

          {/* Title */}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-up" style={{ animationDelay: '0.05s' }}>
            Seu melhor vendedor trabalha{' '}
            <span className="text-gradient">24 horas por dia.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Automatize seu atendimento, responda clientes instantaneamente e aumente
            suas vendas utilizando inteligência artificial.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <Link href="/signup">
              <Button size="lg" className="group w-full sm:w-auto">
                Criar Conta
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="#demonstracao">
              <Button variant="outline" size="lg" className="group w-full sm:w-auto">
                <PlayCircle className="mr-2 h-4 w-4" />
                Ver Demonstração
              </Button>
            </Link>
          </div>
        </div>

        {/* Illustration: dashboard + chat side by side */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl glow-primary">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-success/60" />
              </div>
              <div className="mx-auto rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                app.fluxsales.ai
              </div>
            </div>

            {/* Content: dashboard left, chat right */}
            <div className="grid gap-0 md:grid-cols-2">
              {/* Dashboard mock */}
              <div className="border-r border-border p-5">
                <div className="mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Dashboard</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Receita do Dia', value: 'R$ 1.247', change: '+12%' },
                    { label: 'Pedidos Hoje', value: '38', change: '+8%' },
                    { label: 'Ticket Médio', value: 'R$ 32,80', change: '+3%' },
                    { label: 'Pendentes', value: '5', change: '-2' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border border-border bg-background p-3">
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                      <p className="mt-1 text-lg font-bold">{kpi.value}</p>
                      <p className="text-xs font-medium text-success">{kpi.change}</p>
                    </div>
                  ))}
                </div>
                {/* Mini chart */}
                <div className="mt-4 flex h-20 items-end gap-1.5">
                  {[40, 55, 35, 70, 50, 80, 60, 90, 65, 85, 75, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/70"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Chat mock */}
              <div className="flex flex-col p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Atendimento IA</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-success">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                    Online
                  </span>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="max-w-[80%] rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-sm">
                    Olá! Gostaria de fazer um pedido.
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    Olá! Claro! Quer ver nosso cardápio de hambúrgueres?
                  </div>
                  <div className="max-w-[80%] rounded-lg rounded-tl-sm bg-muted px-3 py-2 text-sm">
                    Sim, quero um bacon burger com batata.
                  </div>
                  <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                    Perfeito! Bacon Burger + Batata frita. Total: R$ 34,90. Confirmar?
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    IA está digitando...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
