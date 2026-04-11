export function UpdateDocumentsSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-16 px-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          <div className="h-5 w-36 rounded-md bg-surface-container-low animate-pulse" />
          <div className="ml-auto w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
        </div>
      </header>
      <main className="animate-pulse pt-20 pb-28 px-5 max-w-lg mx-auto space-y-4">
        <div className="bg-surface-container-low rounded-2xl h-16 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-8 w-2/3 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-20 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-20 border border-outline-variant/30" />
        <div className="bg-surface-container-low rounded-2xl h-20 border border-outline-variant/30" />
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 bg-linear-to-t from-surface via-surface/90 to-transparent">
        <div className="h-12 w-3/4 max-w-xs mx-auto rounded-xl bg-surface-container-low border border-outline-variant/30 animate-pulse" />
      </div>
    </div>
  );
}
