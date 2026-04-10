export default function RequestLicensePageSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md shadow-sm flex items-center gap-3 px-4 h-16">
        <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
        <div className="h-5 w-44 rounded-md bg-surface-container-low animate-pulse" />
        <div className="ml-auto w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
      </header>

      <main className="pt-20 pb-10 px-5 max-w-lg mx-auto space-y-4 animate-pulse">
        <div className="h-10 rounded-xl bg-surface-container-low border border-outline-variant/30" />
        <div className="h-14 rounded-xl bg-surface-container-low border border-outline-variant/30" />
        <div className="h-14 rounded-xl bg-surface-container-low border border-outline-variant/30" />
        <div className="h-14 rounded-xl bg-surface-container-low border border-outline-variant/30" />
        <div className="h-14 rounded-xl bg-surface-container-low border border-outline-variant/30" />
      </main>
    </div>
  );
}
