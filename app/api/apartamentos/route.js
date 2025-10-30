// GET, POST apartamentos

// app/api/apartamentos/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'


// GET - Obtener todos los apartamentos con filtros
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filtros de búsqueda
    const ciudad = searchParams.get('ciudad')
    const minPrecio = searchParams.get('minPrecio')
    const maxPrecio = searchParams.get('maxPrecio')
    const capacidad = searchParams.get('capacidad')
    const numHabitaciones = searchParams.get('numHabitaciones')
    const estado = searchParams.get('estado') || 'ACTIVO'
    
    // Construir filtros dinámicamente
    const where = {
      estadoApartamento: estado
    }

    if (ciudad) {
      where.ciudad = {
        contains: ciudad,
        mode: 'insensitive'
      }
    }

    if (minPrecio || maxPrecio) {
      where.precioPorNoche = {}
      if (minPrecio) where.precioPorNoche.gte = parseFloat(minPrecio)
      if (maxPrecio) where.precioPorNoche.lte = parseFloat(maxPrecio)
    }

    if (capacidad) {
      where.capacidad = {
        gte: parseInt(capacidad)
      }
    }

    if (numHabitaciones) {
      where.numHabitaciones = {
        gte: parseInt(numHabitaciones)
      }
    }

    // Consultar apartamentos
    const apartamentos = await prisma.apartamento.findMany({
      where,
      include: {
        imagenes: {
          orderBy: {
            orden: 'asc'
          }
        },
        propietario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        _count: {
          select: {
            reservas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      count: apartamentos.length,
      data: apartamentos
    })

  } catch (error) {
    console.error('Error al obtener apartamentos:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener apartamentos' 
      },
      { status: 500 }
    )
  }
}

// POST - Crear un nuevo apartamento
export async function POST(request) {
  try {
    const body = await request.json()

    // Validar campos requeridos
    const camposRequeridos = [
      'nombre', 
      'descripcion', 
      'direccion', 
      'ciudad', 
      'estado',
      'capacidad', 
      'numHabitaciones', 
      'numBanos', 
      'precioPorNoche',
      'propietarioId'
    ]

    for (const campo of camposRequeridos) {
      if (!body[campo]) {
        return NextResponse.json(
          { 
            success: false,
            error: `El campo ${campo} es requerido` 
          },
          { status: 400 }
        )
      }
    }

    // Validar que el precio sea un número positivo
    if (body.precioPorNoche <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'El precio debe ser mayor a 0' 
        },
        { status: 400 }
      )
    }

    // Crear apartamento
    const nuevoApartamento = await prisma.apartamento.create({
      data: {
        nombre: body.nombre,
        descripcion: body.descripcion,
        direccion: body.direccion,
        ciudad: body.ciudad,
        estado: body.estado,
        codigoPostal: body.codigoPostal || null,
        capacidad: parseInt(body.capacidad),
        numHabitaciones: parseInt(body.numHabitaciones),
        numBanos: parseInt(body.numBanos),
        metrosCuadrados: body.metrosCuadrados ? parseFloat(body.metrosCuadrados) : null,
        precioPorNoche: parseFloat(body.precioPorNoche),
        tarifaLimpieza: body.tarifaLimpieza ? parseFloat(body.tarifaLimpieza) : 0,
        amenidades: body.amenidades || null,
        propietarioId: body.propietarioId,
        estadoApartamento: 'ACTIVO'
      },
      include: {
        propietario: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Apartamento creado exitosamente',
      data: nuevoApartamento
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear apartamento:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear apartamento' 
      },
      { status: 500 }
    )
  }
}