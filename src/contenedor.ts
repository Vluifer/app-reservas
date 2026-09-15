/**
 * Raíz de composición: el ÚNICO lugar donde se conectan casos de uso con sus implementaciones reales.
 * La interfaz (src/app) importa desde aquí; los módulos nunca importan este archivo.
 */
import { AutenticarUsuario } from '@/modules/identidad/application/AutenticarUsuario'
import { RegistrarUsuario } from '@/modules/identidad/application/RegistrarUsuario'
import { BcryptPasswordHasher } from '@/modules/identidad/infrastructure/BcryptPasswordHasher'
import { PrismaUsuarioRepository } from '@/modules/identidad/infrastructure/PrismaUsuarioRepository'

import { BuscarApartamentos, ObtenerApartamento } from '@/modules/apartamentos/application/ConsultasApartamentos'
import {
  ActualizarApartamento,
  CambiarEstadoApartamento,
  ListarApartamentosDePropietario,
  PublicarApartamento,
} from '@/modules/apartamentos/application/GestionApartamentos'
import { EliminarImagenApartamento, SubirImagenesApartamento } from '@/modules/apartamentos/application/ImagenesApartamento'
import { crearAlmacenImagenes } from '@/modules/apartamentos/infrastructure/CloudinaryAlmacenImagenes'
import { PrismaApartamentoRepository } from '@/modules/apartamentos/infrastructure/PrismaApartamentoRepository'

import {
  ConsultarFechasOcupadas,
  ListarReservasDeCliente,
  ListarReservasDePropietario,
  ObtenerReserva,
} from '@/modules/reservas/application/ConsultasReservas'
import {
  CancelarReserva,
  ConfirmarReserva,
  ExpirarReservasPendientes,
  RechazarReserva,
} from '@/modules/reservas/application/GestionReservas'
import { CotizarReserva, CrearReserva } from '@/modules/reservas/application/SolicitudReserva'
import { CatalogoApartamentosDesdeRepositorio } from '@/modules/reservas/infrastructure/CatalogoApartamentosDesdeRepositorio'
import { PrismaReservaRepository } from '@/modules/reservas/infrastructure/PrismaReservaRepository'

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
}

export const apartamentos = {
  buscar: new BuscarApartamentos(apartamentosRepo, reservasRepo),
  obtener: new ObtenerApartamento(apartamentosRepo),
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
  fechasOcupadas: new ConsultarFechasOcupadas(reservasRepo),
  expirarPendientes: new ExpirarReservasPendientes(reservasRepo),
}
