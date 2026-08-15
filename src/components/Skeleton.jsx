/**
 * Skeleton loading placeholders for editorial lookbook / grid layouts.
 * Same shapes as ProductCard so loading feels native.
 */

export function ProductCardSkeleton() {
  return (
    <div className="relative w-full aspect-[4/5] bg-surface-container-low border border-outline-variant/20 overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-br from-surface-container/40 to-surface-container" />
      <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
        <div className="h-3 w-1/2 bg-on-surface/15 rounded" />
        <div className="h-5 w-3/4 bg-on-surface/15 rounded" />
        <div className="h-4 w-1/4 bg-primary/20 rounded mt-3" />
      </div>
    </div>
  );
}

export function ShopGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="md:col-span-6">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function ProductModalSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
      <div className="aspect-square w-full bg-surface-container animate-pulse" />
      <div className="space-y-4 py-4">
        <div className="h-3 w-1/3 bg-on-surface/15 rounded animate-pulse" />
        <div className="h-8 w-2/3 bg-on-surface/20 rounded animate-pulse" />
        <div className="h-4 w-1/4 bg-primary/25 rounded animate-pulse" />
        <div className="h-24 w-full bg-surface-container-high rounded animate-pulse mt-6" />
      </div>
    </div>
  );
}

export function CartDrawerSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="w-20 h-24 bg-surface-container animate-pulse rounded" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 w-3/4 bg-on-surface/15 rounded" />
            <div className="h-3 w-1/2 bg-on-surface/15 rounded" />
            <div className="h-4 w-1/4 bg-primary/20 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 max-w-md mx-auto">
      {icon && (
        <div className="material-symbols-outlined text-on-surface-variant text-5xl mb-4 filled">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl text-on-background mb-2">{title}</h3>
      {message && (
        <p className="font-body text-sm text-on-surface-variant mb-6 leading-relaxed">{message}</p>
      )}
      {action}
    </div>
  );
}
