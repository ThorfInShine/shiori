import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { getDivisionSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getDivisionSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: { divisionId: session.id },
    include: { buyer: true, items: { include: { book: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const session = await getDivisionSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { buyerNama, buyerArea, items } = await req.json()
  if (!buyerNama || !buyerArea || !items?.length) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  // Validate string lengths and format
  if (typeof buyerNama !== 'string' || buyerNama.trim().length < 2 || buyerNama.trim().length > 100) {
    return NextResponse.json({ error: 'Nama pemesan harus 2-100 karakter' }, { status: 400 })
  }
  if (typeof buyerArea !== 'string' || buyerArea.trim().length < 2 || buyerArea.trim().length > 100) {
    return NextResponse.json({ error: 'Area harus 2-100 karakter' }, { status: 400 })
  }

  // Validate and fetch prices from database
  const orderItems: { bookId: number; jumlah: number; hargaSatuan: number; totalHarga: number }[] = []
  let subtotal = 0

  for (const item of items) {
    if (!Number.isInteger(item.jumlah) || item.jumlah < 1 || item.jumlah > 10000) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    const book = await prisma.book.findUnique({ where: { id: item.bookId } })
    if (!book) {
      return NextResponse.json({ error: `Book ${item.bookId} not found` }, { status: 404 })
    }

    // Server determines price from database, never trust client
    const hargaSatuan = item.hargaSatuan === book.hargaLks ? book.hargaLks :
                        item.hargaSatuan === book.hargaPg ? book.hargaPg : null

    if (!hargaSatuan || hargaSatuan <= 0) {
      return NextResponse.json({ error: `Invalid price for book ${item.bookId}` }, { status: 400 })
    }

    const totalHarga = hargaSatuan * item.jumlah
    subtotal += totalHarga

    orderItems.push({
      bookId: item.bookId,
      jumlah: item.jumlah,
      hargaSatuan,
      totalHarga,
    })
  }

  // Create or find buyer (use trimmed values)
  const namaTrimmed = buyerNama.trim()
  const areaTrimmed = buyerArea.trim()
  let buyer = await prisma.buyer.findFirst({ where: { nama: namaTrimmed, area: areaTrimmed } })
  if (!buyer) {
    buyer = await prisma.buyer.create({ data: { nama: namaTrimmed, area: areaTrimmed } })
  }

  // Generate nota number with transaction to prevent race condition
  const order = await prisma.$transaction(async (tx) => {
    const today = new Date()
    const prefix = `SH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const lastOrder = await tx.order.findFirst({
      where: { nomorNota: { startsWith: prefix } },
      orderBy: { nomorNota: 'desc' },
    })
    const seq = lastOrder ? parseInt(lastOrder.nomorNota.slice(-4)) + 1 : 1
    const nomorNota = `${prefix}${String(seq).padStart(4, '0')}`

    return await tx.order.create({
      data: {
        buyerId: buyer.id,
        divisionId: session.id,
        nomorNota,
        subtotal,
        netto: subtotal,
        items: { create: orderItems },
      },
    })
  })

  return NextResponse.json({ ok: true, orderId: order.id, nomorNota: order.nomorNota })
}
