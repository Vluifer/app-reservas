import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();

    // ✅ Campos requeridos
    const camposRequeridos = ["nombre", "email", "password", "rol"];

    for (const campo of camposRequeridos) {
      if (!body[campo]) {
        return NextResponse.json(
          {
            success: false,
            error: `El campo ${campo} es requerido`,
          },
          { status: 400 }
        );
      }
    }

    // ✅ Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "El correo electrónico no tiene un formato válido",
        },
        { status: 400 }
      );
    }

    // ✅ Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: body.email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        {
          success: false,
          error: "El correo electrónico ya está registrado",
        },
        { status: 409 }
      );
    }

    // ✅ Encriptar contraseña
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre: body.nombre,
        email: body.email,
        password: hashedPassword,
        telefono: body.telefono || null,
        rol: body.rol.toUpperCase(), // CLIENTE o PROPIETARIO
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        rol: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Usuario creado exitosamente",
        data: nuevoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear usuario",
      },
      { status: 500 }
    );
  }
}
