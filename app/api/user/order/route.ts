import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('division_session')?.value
  if (!cookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let divisionData: { id: number }
  try { divisionData = JSON.parse(cookie) } catch { return NextResponse.json({ error: 'Invalid session' }, { status: 401 }) }

  const orders = await prisma.order.findMany({
    where: { divisionId: divisionData.id },
    include: { buyer: true, items: { include: { book: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(orders)
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('division_session')?.value
  if (!cookie) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let divisionData: { id: number; name: string }
  try {
    divisionData = JSON.parse(cookie)
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  const { buyerNama, buyerArea, items } = await req.json()
  if (!buyerNama || !buyerArea || !items?.length) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  // Create or find buyer
  let buyer = await prisma.buyer.findFirst({ where: { nama: buyerNama, area: buyerArea } })
  if (!buyer) {
    buyer = await prisma.buyer.create({ data: { nama: buyerNama, area: buyerArea } })
  }

  // Generate nota number
  const today = new Date()
  const prefix = `SH${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
  const lastOrder = await prisma.order.findFirst({
    where: { nomorNota: { startsWith: prefix } },
    orderBy: { nomorNota: 'desc' },
  })
  const seq = lastOrder ? parseInt(lastOrder.nomorNota.slice(-4)) + 1 : 1
  const nomorNota = `${prefix}${String(seq).padStart(4, '0')}`

  // Calculate subtotal
  const subtotal = items.reduce((sum: number, i: { jumlah: number; hargaSatuan: number }) => sum + i.jumlah * i.hargaSatuan, 0)

  const order = await prisma.order.create({
    data: {
      buyerId: buyer.id,
      divisionId: divisionData.id,
      nomorNota,
      subtotal,
      netto: subtotal, // ponytail: no discount applied from user side; admin adjusts later
      items: {
        create: items.map((i: { bookId: number; jumlah: number; hargaSatuan: number }) => ({
          bookId: i.bookId,
          jumlah: i.jumlah,
          hargaSatuan: i.hargaSatuan,
          totalHarga: i.jumlah * i.hargaSatuan,
        })),
      },
    },
  })

  return NextResponse.json({ ok: true, orderId: order.id, nomorNota })
}
