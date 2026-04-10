export default function DashboardSkeleton() {
  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="h-15 px-4 flex items-center">
          <div className="mx-auto h-5 w-40 rounded-md bg-surface-container-low animate-pulse" />
          <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse" />
        </div>
      </header>

      <main className="flex flex-col flex-1 pt-24 pb-8 px-6 max-w-lg mx-auto w-full animate-pulse">
        <section style={{ marginBottom: "40px" }}>
          <div className="h-10 w-3/4 rounded-lg bg-surface-container-low mb-2" />
          <div className="h-5 w-full rounded-md bg-surface-container-low" />
        </section>

        <nav className="flex flex-col gap-4 flex-1">
          <div className="rounded-xl bg-surface-container-low h-22 border border-outline-variant/30" />
          <div className="rounded-xl bg-surface-container-low h-26 border border-outline-variant/30" />
          <div className="rounded-xl bg-surface-container-low h-26 border border-outline-variant/30" />
          <div className="rounded-xl bg-surface-container-low h-26 border border-outline-variant/30" />
        </nav>

        <footer className="mt-12 flex flex-col items-center gap-1 opacity-30 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-surface-container-low" />
          <div className="h-3 w-40 rounded-md bg-surface-container-low" />
        </footer>
      </main>
    </>
  );
}
