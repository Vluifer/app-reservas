'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { BotonEnviar, BotonEnviarConfirmando } from '@/shared/ui/boton-enviar'
import { Alerta, Avatar, Campo, CLASE_CONTROL, CLASE_ETIQUETA, claseBoton } from '@/shared/ui/componentes'
import { actualizarPerfil, cambiarFotoPerfil, quitarFotoPerfil } from '../acciones'

/**
 * Foto grande del perfil. Al elegir un archivo se ve al instante (aún sin subir)
 * y se confirma con "Guardar foto" o se descarta con "Cancelar".
 */
export function FormularioFoto({ nombre, foto }: { nombre: string; foto: string | null }) {
  const [estadoSubida, subir] = useActionState(cambiarFotoPerfil, null)
  const [estadoQuitar, quitar] = useActionState(quitarFotoPerfil, null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const campo = useRef<HTMLInputElement>(null)

  // Libera la URL temporal de la vista previa cuando cambia o se desmonta
  useEffect(() => {
    if (!vistaPrevia) return
    return () => URL.revokeObjectURL(vistaPrevia)
  }, [vistaPrevia])

  // Tras subir, la foto nueva llega del servidor: se descarta la vista previa
  const [estadoVisto, setEstadoVisto] = useState(estadoSubida)
  if (estadoSubida !== estadoVisto) {
    setEstadoVisto(estadoSubida)
    if (estadoSubida?.exito) setVistaPrevia(null)
  }

  function cancelar() {
    setVistaPrevia(null)
    if (campo.current) campo.current.value = ''
  }

  const estado = estadoSubida ?? estadoQuitar

  return (
    <div className="flex flex-col items-center text-center">
      {vistaPrevia ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL local (blob:) que next/image no optimiza
        <img src={vistaPrevia} alt="" className="size-28 rounded-full object-cover" />
      ) : (
        <Avatar nombre={nombre} foto={foto} tamano="lg" />
      )}

      <form action={subir} className="mt-5 flex flex-wrap justify-center gap-2">
        <input
          ref={campo}
          id="campo-foto"
          type="file"
          name="foto"
          accept="image/jpeg,image/png,image/webp"
          required
          className="sr-only"
          onChange={(e) => {
            const archivo = e.target.files?.[0]
            setVistaPrevia(archivo ? URL.createObjectURL(archivo) : null)
          }}
        />
        {vistaPrevia ? (
          <>
            <BotonEnviar>Guardar foto</BotonEnviar>
            <button type="button" onClick={cancelar} className={claseBoton('fantasma')}>
              Cancelar
            </button>
          </>
        ) : (
          <label htmlFor="campo-foto" className={`${claseBoton('secundario')} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-acento`}>
            {foto ? 'Cambiar foto' : 'Agregar foto'}
          </label>
        )}
      </form>

      {foto && !vistaPrevia && (
        <form action={quitar} className="mt-1">
          <BotonEnviarConfirmando variante="fantasma" mensaje="¿Quitar tu foto de perfil?">
            Quitar foto
          </BotonEnviarConfirmando>
        </form>
      )}

      <p className="mt-3 text-xs text-tinta-suave">JPG, PNG o WebP de hasta 5 MB.</p>
      {estado?.error && (
        <div className="mt-4 w-full text-left">
          <Alerta tipo="error">{estado.error}</Alerta>
        </div>
      )}
    </div>
  )
}

export function FormularioDatos({ nombre, telefono, email }: { nombre: string; telefono: string | null; email: string }) {
  const [estado, enviar] = useActionState(actualizarPerfil, null)

  return (
    <form action={enviar} className="space-y-5">
      <Campo etiqueta="Nombre" name="nombre" defaultValue={nombre} autoComplete="name" required minLength={2} />
      <Campo etiqueta="Teléfono (opcional)" name="telefono" type="tel" defaultValue={telefono ?? ''} autoComplete="tel" />
      <div>
        <label htmlFor="email-perfil" className={CLASE_ETIQUETA}>
          Correo electrónico
        </label>
        <input id="email-perfil" value={email} disabled aria-describedby="ayuda-email" className={CLASE_CONTROL} />
        <p id="ayuda-email" className="mt-1.5 text-xs text-tinta-suave">
          Es con el que inicias sesión; no se puede cambiar.
        </p>
      </div>
      {estado?.error && <Alerta tipo="error">{estado.error}</Alerta>}
      {estado?.exito && <Alerta tipo="exito">{estado.exito}</Alerta>}
      <BotonEnviar>Guardar cambios</BotonEnviar>
    </form>
  )
}
