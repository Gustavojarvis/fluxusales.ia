'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Bot,
  BarChart3,
  ChefHat,
  Settings,
  User,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Produtos', href: '/dashboard/produtos', icon: Package },
  { label: 'Pedidos', href: '/dashboard/pedidos', icon: ShoppingBag },
  { label: 'Cozinha', href: '/dashboard/cozinha', icon: ChefHat },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { label: 'IA', href: '/dashboard/ia', icon: Bot },
  { label: 'Relatórios', href: '/dashboard/relatorios', icon: BarChart3 },
  { label: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
  { label: 'Perfil', href: '/dashboard/perfil', icon: User },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="sidebar-label">FluxSales</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-2">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Bot className="h-5 w-5" />
      </div>
      {!collapsed && (
        <span className="text-base font-semibold">
          FluxSales <span className="text-primary">AI</span>
        </span>
      )}
    </div>
  );
}

function SignOutButton({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    onNavigate?.();
    router.push('/login');
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="h-4 w-4 flex-shrink-0" />
      <span className="sidebar-label">Sair</span>
    </button>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, company, loading } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-border bg-card transition-all duration-300 md:flex',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-3">
          <Logo collapsed={collapsed} />
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <NavLinks />
        </div>

        <div className="border-t border-border p-3">
          {/* Company info */}
          {!collapsed && company && (
            <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2">
              <p className="truncate text-xs font-medium">{company.name}</p>
              <p className="text-xs text-muted-foreground">Plano: {company.plan}</p>
            </div>
          )}
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <div className="md:hidden">
        <div className="fixed left-0 top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-16 items-center border-b border-border px-3">
                <Logo />
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-border p-3">
                {company && (
                  <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2">
                    <p className="truncate text-xs font-medium">{company.name}</p>
                    <p className="text-xs text-muted-foreground">Plano: {company.plan}</p>
                  </div>
                )}
                <SignOutButton onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Logo />

          <div className="w-9" />
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'md:pl-16' : 'md:pl-60'
        )}
      >
        <div className="min-h-screen pt-16 md:pt-0">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
