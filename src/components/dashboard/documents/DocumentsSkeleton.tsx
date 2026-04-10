export function DocumentsSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-16 px-4 flex items-center">
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          <div className="mx-auto h-5 w-40 rounded-md bg-surface-container-low animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
        </div>
      </header>
      <main className="animate-pulse pt-20 pb-10 px-5 max-w-lg mx-auto space-y-4">
        <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-36 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-xl h-12 border border-outline-variant/30" />
      </main>
    </div>
  );
}
