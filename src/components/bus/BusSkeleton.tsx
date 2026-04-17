export function BusSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface-container-low animate-pulse h-32 border border-outline-variant/30"
        />
      ))}
    </div>
  );
}
