/** Casa con una llave dentro: lo que se reserva y lo que se entrega al llegar. */
export function Logo({ className = 'size-8 text-dorado-claro' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 14.5 16 5l11.5 9.5V26a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 26Z" />
      <circle cx="16" cy="16" r="3" />
      <path d="M16 19v5.5M16 22.5h2.25" />
    </svg>
  )
}

/** Logo con el nombre de la marca en Cinzel, para fondos piedra (cabecera y pie). */
export function Marca() {
  return (
    <>
      <Logo />
      <span className="font-display text-xl tracking-[0.16em]">Morada</span>
    </>
  )
}
