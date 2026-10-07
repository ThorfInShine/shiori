import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Create order
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nama, area, jenjangFilter, items, potonganPersen = 10 } = body

  if (!nama || !area || !items?.length) {
    return NextResponse.json({ error: 'Nama, area, dan minimal 1 item diperlukan' }, { status: 400 })
  }

  // Generate nomor nota
  const count = await prisma.order.count()
  const nomorNota = String(count + 1).padStart(3, '0')

  // Calculate totals
  let subtotal = 0
  const orderItems = []
  for (const item of items) {
    const book = await prisma.book.findUnique({ where: { id: item.bookId } })
    if (!book) continue
    const harga = item.tipe === 'pg' ? (book.hargaPg || 0) : (book.hargaLks || 0)
    const total = harga * item.jumlah
    subtotal += total
    orderItems.push({
      bookId: item.bookId,
      jumlah: item.jumlah,
      hargaSatuan: harga,
      totalHarga: total,
    })
  }

  const potonganNominal = Math.round(subtotal * potonganPersen / 100)
  const netto = subtotal - potonganNominal

  // Create buyer
  const buyer = await prisma.buyer.create({ data: { nama, area } })

  // Create order with items
  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      nomorNota,
      jenjangFilter: jenjangFilter || null,
      subtotal,
      potonganPersen,
      potonganNominal,
      netto,
      status: 'pending',
      items: { create: orderItems },
    },
    include: { items: { include: { book: true } }, buyer: true },
  })

  return NextResponse.json(order)
}

// Get all orders (for admin)
export async function GET() {
  const orders = await prisma.order.findMany({
    include: { items: { include: { book: true } }, buyer: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}
