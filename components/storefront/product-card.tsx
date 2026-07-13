'use client';

import type { Product } from '@/lib/types/database';

// Product card for the storefront — displays product info and price.
// The actual ordering happens through the chat widget.
export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
      <div className="flex gap-3">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-lg">🍔</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-semibold">{product.name}</h4>
            {product.is_featured && (
              <span className="flex-shrink-0 text-xs text-warning">★</span>
            )}
          </div>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {product.description}
            </p>
          )}
          <p className="mt-2 text-base font-bold text-primary">
            R$ {Number(product.price).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
