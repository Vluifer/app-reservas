/**
 * Bloqueo optimista sin ensuciar el dominio: el repositorio anota con qué versión cargó cada agregado
 * y al guardar exige que la fila siga teniendo esa versión. La versión es un detalle de persistencia,
 * así que vive aquí y no en las entidades.
 */
export class RegistroDeVersiones<T extends object> {
  private readonly versiones = new WeakMap<T, number>()

  /** Anota la versión con la que se leyó (o creó) el agregado y lo devuelve. */
  anotar(agregado: T, version: number): T {
    this.versiones.set(agregado, version)
    return agregado
  }

  /** undefined = el agregado es nuevo: no salió de este repositorio. */
  versionDe(agregado: T): number | undefined {
    return this.versiones.get(agregado)
  }
}
