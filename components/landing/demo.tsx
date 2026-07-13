'use client';

import Link from 'next/link';
import { ArrowRight, Bot, MessageSquare, ShoppingCart, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Demo() {
  return (
    <section id="demonstracao" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Demonstração
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Veja a FluxSales AI em ação
          </h2>
          <p className="mt-4 text-muted-foreground">
            Uma conversa real entre um cliente e a IA, do pedido à confirmação.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Assistente FluxSales</p>
                <p className="flex items-center gap-1 text-xs text-success">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-soft" />
                  Online agora
                </p>
              </div>
            </div>

            {/* Chat messages */}
            <div className="space-y-4 p-6">
              {[
                { from: 'customer', text: 'Oi, quero pedir um hambúrguer para entrega' },
                { from: 'bot', text: 'Olá! Que ótimo! Temos o Classic Burger (R$ 18,90), Bacon Burger (R$ 24,90) e o Duplo Cheddar (R$ 28,90). Qual você gostaria?' },
                { from: 'customer', text: 'Quero o Bacon Burger com batata frita' },
                { from: 'bot', text: 'Excelente escolha! Bacon Burger + Batata Frita Grande. Fica R$ 34,90. Deseja adicionar uma bebida?' },
                { from: 'customer', text: 'Sim, uma Coca-Cola lata' },
                { from: 'bot', text: 'Perfeito! Resumo do pedido:\n\n• Bacon Burger\n• Batata Frita Grande\n• Coca-Cola Lata\n\nTotal: R$ 41,80\nEntrega estimada: 30-40 min\n\nConfirmar o pedido?' },
                { from: 'customer', text: 'Sim, confirmo!' },
                { from: 'bot', text: 'Pedido confirmado! Já foi enviado para a cozinha. Você receberá uma notificação quando sair para entrega. Obrigado!' },
              ].map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.from === 'bot' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`flex items-start gap-2 ${msg.from === 'bot' ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        msg.from === 'bot'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {msg.from === 'bot' ? (
                        <Bot className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={`max-w-[75%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                        msg.from === 'bot'
                          ? 'rounded-tl-sm bg-muted'
                          : 'rounded-tr-sm bg-primary text-primary-foreground'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order status */}
            <div className="border-t border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Pedido #1023 criado automaticamente</p>
                  <p className="text-xs text-muted-foreground">Enviado para o painel do proprietário</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-success">
                  <BarChart3 className="h-3 w-3" />
                  +R$ 41,80
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/signup">
              <Button size="lg" className="group">
                Criar minha conta
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
