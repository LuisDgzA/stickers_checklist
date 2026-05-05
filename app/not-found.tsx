import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-(--bg) text-(--text)">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_34%),radial-gradient(circle_at_80%_0%,var(--hero-glow-secondary),transparent_30%)]" />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:py-14">
        <section className="w-full max-w-4xl">
          <article className="rounded-[2rem] border border-(--border) bg-(--surface)/90 p-6 shadow-sm backdrop-blur sm:p-8 md:p-10">            
            <div className="mt-5 flex flex-wrap items-end gap-4">
              <div className="text-6xl font-black tracking-[-0.08em] text-(--text) sm:text-7xl">
                404
              </div>              
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-(--text) sm:text-4xl">
              Esta página se salió del álbum.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-(--muted)">
              La dirección que abriste no existe o cambió. Puedes volver al inicio, o entrar a tu perfil.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl bg-(--primary) px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-(--primary)/20 transition hover:bg-(--primary-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
              >
                Ir al inicio
              </Link>
              <Link
                href="/perfil"
                className="inline-flex items-center justify-center rounded-2xl border border-(--border) bg-(--surface-soft) px-5 py-3 text-sm font-semibold text-(--text) transition hover:border-(--accent)/40 hover:bg-(--surface-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--focus)"
              >
                Abrir mi perfil
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
