export default function Cargando() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only" role="status">
        Cargando apartamentos…
      </span>
      <div className="h-16 animate-pulse rounded-full bg-hundido" />
      <div className="space-y-2">
        <div className="h-10 w-72 max-w-full animate-pulse rounded-control bg-hundido" />
        <div className="h-5 w-48 animate-pulse rounded bg-hundido" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-11 w-32 animate-pulse rounded-full bg-hundido" />
        ))}
      </div>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
