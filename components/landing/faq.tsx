'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
  {
    question: 'Como a FluxSales AI atende meus clientes?',
    answer:
      'Nossa IA conversa naturalmente com seus clientes pelo chat do site, entendendo pedidos, tirando dúvidas e sugerindo produtos. Tudo de forma automática, 24 horas por dia.',
  },
  {
    question: 'Preciso de conhecimento técnico para configurar?',
    answer:
      'Não. Você cadastra seus produtos e categorias no painel e a IA começa a vender em minutos. A interface é simples e intuitiva.',
  },
  {
    question: 'Posso cancelar quando quiser?',
    answer:
      'Sim. Não há fidelidade. Você pode cancelar ou trocar de plano a qualquer momento diretamente pelo painel.',
  },
  {
    question: 'A IA funciona com qualquer tipo de restaurante?',
    answer:
      'Sim. Embora seja otimizada para hamburguerias, a FluxSales AI se adapta a qualquer cardápio: pizzarias, restaurantes japoneses, lanchonetes e mais.',
  },
  {
    question: 'Como recebo os pedidos?',
    answer:
      'Todos os pedidos aparecem instantaneamente no seu dashboard, com notificações em tempo real. Você pode acompanhar o status de cada pedido do início ao fim.',
  },
  {
    question: 'Meus dados estão seguros?',
    answer:
      'Sim. Usamos criptografia de ponta a ponta e cada empresa tem seus dados isolados. Ninguém além de você acessa suas informações.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-b">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
