export default function CargandoApartamento() {
  return (
    <div className="space-y-8" aria-busy="true">
      <span className="sr-only" role="status">
        Cargando apartamento…
      </span>
      <div className="space-y-3">
        <div className="h-4 w-40 animate-pulse rounded bg-hundido" />
        <div className="h-12 w-2/3 animate-pulse rounded-control bg-hundido" />
      </div>
      <div className="aspect-[4/3] animate-pulse rounded-bloque bg-hundido sm:aspect-auto sm:h-[28rem]" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-16">
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-control bg-hundido" />
          <div className="h-4 w-full animate-pulse rounded bg-hundido" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-hundido" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-hundido" />
        </div>
        <div className="h-80 animate-pulse rounded-tarjeta bg-hundido" />
      </div>
    </div>
  )
}
