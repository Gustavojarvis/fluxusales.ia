'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

type KPICardProps = {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  loading?: boolean;
};

export function KPICard({ label, value, change, changeType = 'neutral', icon: Icon, loading }: KPICardProps) {
  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-shimmer rounded" />
            <div className="h-7 w-20 animate-shimmer rounded" />
            <div className="h-3 w-12 animate-shimmer rounded" />
          </div>
          <div className="h-10 w-10 animate-shimmer rounded-xl" />
        </div>
      </Card>
    );
  }

  const changeColor =
    changeType === 'positive'
      ? 'text-success'
      : changeType === 'negative'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p className={cn('mt-1 text-xs font-medium', changeColor)}>{change}</p>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
