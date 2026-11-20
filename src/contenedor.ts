/**
 * Raíz de composición: el ÚNICO lugar donde se conectan los casos de uso con sus implementaciones reales.
 *
 * Lo importan las capas de entrada: la ui de los módulos (páginas y Server Actions), las rutas de src/app
 * y las rutas de API. Nunca lo importan domain/, application/ ni infrastructure/ (lo verifica ESLint).
 */
import { AutenticarUsuario } from '@/modules/identidad/application/AutenticarUsuario'
import { ActualizarPerfil, CambiarFotoPerfil, ObtenerPerfil, QuitarFotoPerfil } from '@/modules/identidad/application/Perfil'
import { RegistrarUsuario } from '@/modules/identidad/application/RegistrarUsuario'
import { crearAutenticacion } from '@/modules/identidad/infrastructure/auth'
import { BcryptPasswordHasher } from '@/modules/identidad/infrastructure/BcryptPasswordHasher'
import { PrismaUsuarioRepository } from '@/modules/identidad/infrastructure/PrismaUsuarioRepository'

import { BuscarApartamentos, ObtenerApartamento, ObtenerFichasApartamentos, ObtenerVitrina } from '@/modules/apartamentos/application/ConsultasApartamentos'
import {
  ActualizarApartamento,
  CambiarEstadoApartamento,
  ListarApartamentosDePropietario,
  ObtenerApartamentoParaGestion,
  PublicarApartamento,
} from '@/modules/apartamentos/application/GestionApartamentos'
import { EliminarImagenApartamento, SubirImagenesApartamento } from '@/modules/apartamentos/application/ImagenesApartamento'
import { PrismaApartamentoRepository } from '@/modules/apartamentos/infrastructure/PrismaApartamentoRepository'

import {
  ConsultarCalendario,
  ConsultarFechasOcupadas,
  ListarReservasDeCliente,
  ListarReservasDePropietario,
  ObtenerReserva,
} from '@/modules/reservas/application/ConsultasReservas'
import {
  AvanzarEstadias,
  CancelarReserva,
  ConfirmarReserva,
  ExpirarReservasPendientes,
  RechazarReserva,
} from '@/modules/reservas/application/GestionReservas'
import { CotizarReserva, CrearReserva } from '@/modules/reservas/application/SolicitudReserva'
import { CatalogoApartamentosDesdeRepositorio } from '@/modules/reservas/infrastructure/CatalogoApartamentosDesdeRepositorio'
import { PrismaReservaRepository } from '@/modules/reservas/infrastructure/PrismaReservaRepository'

import { crearAlmacenImagenes } from '@/shared/infrastructure/CloudinaryAlmacenImagenes'
import { prisma } from '@/shared/infrastructure/prisma'

const usuariosRepo = new PrismaUsuarioRepository(prisma)
const apartamentosRepo = new PrismaApartamentoRepository(prisma)
const reservasRepo = new PrismaReservaRepository(prisma)
const passwordHasher = new BcryptPasswordHasher()
const almacenImagenes = crearAlmacenImagenes()
const catalogo = new CatalogoApartamentosDesdeRepositorio(apartamentosRepo)

export const identidad = {
  registrarUsuario: new RegistrarUsuario(usuariosRepo, passwordHasher),
  autenticarUsuario: new AutenticarUsuario(usuariosRepo, passwordHasher),
  obtenerPerfil: new ObtenerPerfil(usuariosRepo),
  actualizarPerfil: new ActualizarPerfil(usuariosRepo),
  cambiarFotoPerfil: new CambiarFotoPerfil(usuariosRepo, almacenImagenes),
  quitarFotoPerfil: new QuitarFotoPerfil(usuariosRepo, almacenImagenes),
}

/** NextAuth: handlers de la ruta de API, auth() para leer la sesión, signIn/signOut para las Server Actions. */
export const autenticacion = crearAutenticacion(identidad.autenticarUsuario)

export const apartamentos = {
  buscar: new BuscarApartamentos(apartamentosRepo, reservasRepo),
  obtener: new ObtenerApartamento(apartamentosRepo),
  vitrina: new ObtenerVitrina(apartamentosRepo),
  fichas: new ObtenerFichasApartamentos(apartamentosRepo),
  obtenerParaGestion: new ObtenerApartamentoParaGestion(apartamentosRepo),
  publicar: new PublicarApartamento(apartamentosRepo),
  actualizar: new ActualizarApartamento(apartamentosRepo),
  cambiarEstado: new CambiarEstadoApartamento(apartamentosRepo),
  listarDePropietario: new ListarApartamentosDePropietario(apartamentosRepo),
  subirImagenes: new SubirImagenesApartamento(apartamentosRepo, almacenImagenes),
  eliminarImagen: new EliminarImagenApartamento(apartamentosRepo, almacenImagenes),
}

export const reservas = {
  cotizar: new CotizarReserva(reservasRepo, catalogo),
  crear: new CrearReserva(reservasRepo, catalogo),
  confirmar: new ConfirmarReserva(reservasRepo),
  rechazar: new RechazarReserva(reservasRepo),
  cancelar: new CancelarReserva(reservasRepo),
  obtener: new ObtenerReserva(reservasRepo),
  listarDeCliente: new ListarReservasDeCliente(reservasRepo),
  listarDePropietario: new ListarReservasDePropietario(reservasRepo),
  calendario: new ConsultarCalendario(reservasRepo),
  fechasOcupadas: new ConsultarFechasOcupadas(reservasRepo),
  expirarPendientes: new ExpirarReservasPendientes(reservasRepo),
  avanzarEstadias: new AvanzarEstadias(reservasRepo),
}
