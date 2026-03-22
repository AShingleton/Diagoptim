"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonVariant = "card" | "list" | "chart" | "text";

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  count?: number;
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

function ListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border p-6 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

function TextSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

const variantComponents: Record<
  SkeletonVariant,
  React.FC<{ className?: string }>
> = {
  card: CardSkeleton,
  list: ListSkeleton,
  chart: ChartSkeleton,
  text: TextSkeleton,
};

export function LoadingSkeleton({
  variant = "card",
  className,
  count = 1,
}: LoadingSkeletonProps) {
  const Component = variantComponents[variant];

  if (count === 1) {
    return <Component className={className} />;
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
