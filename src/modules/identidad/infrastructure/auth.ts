import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import type { Rol } from '@/shared/domain/Actor'
import type { AutenticarUsuario } from '../application/AutenticarUsuario'
import { CredencialesInvalidasError } from '../domain/errores'

declare module 'next-auth' {
  interface User {
    rol?: Rol
  }
  interface Session {
    user: { id: string; rol: Rol } & DefaultSession['user']
  }
}

/**
 * Adaptador de NextAuth (Auth.js v5). La verificación real de credenciales la hace el caso de uso
 * AutenticarUsuario, que se recibe como parámetro: este archivo no sabe cómo se construye.
 * Nota: el rol queda guardado en el JWT; si cambia, el usuario debe volver a iniciar sesión.
 */
export function crearAutenticacion(autenticarUsuario: AutenticarUsuario) {
  return NextAuth({
    trustHost: true,
    session: { strategy: 'jwt' },
    pages: { signIn: '/login' },
    providers: [
      Credentials({
        credentials: { email: {}, password: {} },
        async authorize(credenciales) {
          try {
            const usuario = await autenticarUsuario.ejecutar({
              email: String(credenciales.email ?? ''),
              password: String(credenciales.password ?? ''),
            })
            return { id: usuario.id, name: usuario.nombre, email: usuario.email, rol: usuario.rol }
          } catch (error) {
            if (error instanceof CredencialesInvalidasError) return null
            throw error
          }
        },
      }),
    ],
    callbacks: {
      jwt({ token, user }) {
        if (user) {
          token.id = user.id
          token.rol = user.rol
        }
        return token
      },
      session({ session, token }) {
        session.user.id = token.id as string
        session.user.rol = token.rol as Rol
        return session
      },
    },
  })
}
