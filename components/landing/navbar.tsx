'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { label: 'Recursos', href: '#recursos' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Demonstração', href: '#demonstracao' },
  { label: 'Preços', href: '#precos' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border/60 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span className="text-lg">
            FluxSales <span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Criar Conta</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-background/95 backdrop-blur-lg md:hidden animate-fade-in">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-3">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  Entrar
                </Button>
              </Link>
              <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1">
                <Button size="sm" className="w-full">
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
