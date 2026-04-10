export default function CardSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-16 px-4 flex items-center">
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
          <div className="mx-auto h-5 w-40 rounded-md bg-surface-container-low animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
        </div>
      </header>
      <main className="animate-pulse pt-20 pb-10 px-4 max-w-lg mx-auto">
        <div className="mx-auto w-4/5 bg-surface-container-low border border-outline-variant/30 h-56 mb-4" />
        <div className="flex justify-center gap-2 mb-5">
          <div className="bg-primary w-6 h-2 rounded-full" />
          <div className="bg-outline-variant w-2 h-2 rounded-full" />
        </div>
        <div className="bg-surface-container-low rounded-xl h-16 mb-4 border border-outline-variant/30" />
        <div className="bg-primary rounded-xl h-13" />
      </main>
    </div>
  );
}
