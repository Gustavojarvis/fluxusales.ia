import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://fluxsales.ai'),
  title: 'FluxSales AI — Seu melhor vendedor trabalha 24 horas por dia',
  description:
    'Automatize seu atendimento, responda clientes instantaneamente e aumente suas vendas utilizando inteligência artificial.',
  openGraph: {
    title: 'FluxSales AI',
    description:
      'Automatize seu atendimento, responda clientes instantaneamente e aumente suas vendas utilizando inteligência artificial.',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
