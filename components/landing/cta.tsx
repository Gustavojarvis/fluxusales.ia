'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-16 text-center sm:px-16">
          <div className="absolute left-1/2 top-0 h-[300px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-[100px]" />
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Comece a vender com IA hoje mesmo
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Cadastre-se agora e tenha seu atendimento automatizado funcionando em
              minutos. Sem cartão de crédito.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="group w-full sm:w-auto">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Já tenho conta
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <Link href="/loja/flux-burger" className="text-sm text-primary hover:underline">
                Ou experimente a demonstração ao vivo →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
