export default function Loading() {
  return (
    <main className="min-h-screen bg-(--bg) px-4 py-8 text-(--text)">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 h-10 w-56 animate-pulse rounded-2xl bg-(--surface-soft)" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="min-h-[300px] rounded-3xl border border-(--border) bg-(--surface) p-5 shadow-sm">
              <div className="h-40 animate-pulse rounded-2xl bg-(--surface-soft)" />
              <div className="mt-5 h-6 w-2/3 animate-pulse rounded-full bg-(--surface-soft)" />
              <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-(--surface-soft)" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-(--surface-soft)" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
