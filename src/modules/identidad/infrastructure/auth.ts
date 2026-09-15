import NextAuth, { type DefaultSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { identidad } from '@/contenedor'
import type { Rol } from '@/shared/domain/Actor'
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
 * Configuración de NextAuth (Auth.js v5). La verificación real de credenciales
 * la hace el caso de uso AutenticarUsuario; aquí solo se adapta a NextAuth.
 * Nota: el rol queda guardado en el JWT; si cambia, el usuario debe volver a iniciar sesión.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credenciales) {
        try {
          const usuario = await identidad.autenticarUsuario.ejecutar({
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
