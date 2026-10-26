import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getAdminSession, unauthorized } from '@/lib/auth'

const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'] as const

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return unauthorized()
  const { id } = await params

  const orderId = parseInt(id)
  if (isNaN(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminSession()) return unauthorized()
  const { id } = await params

  const orderId = parseInt(id)
  if (isNaN(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
  }

  const body = await req.json()

  // Validate status against whitelist
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status. Must be: pending, confirmed, or cancelled' }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status: body.status },
    include: { items: { include: { book: true } }, buyer: true },
  })
  return NextResponse.json(order)
}
