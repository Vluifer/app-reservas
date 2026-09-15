export default function Cargando() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only" role="status">
        Cargando apartamentos…
      </span>
      <div className="h-12 w-64 animate-pulse rounded-control bg-hundido" />
      <div className="h-24 animate-pulse rounded-tarjeta bg-hundido" />
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] animate-pulse rounded-tarjeta bg-hundido" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-hundido" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-hundido" />
          </div>
        ))}
      </div>
    </div>
  )
}
