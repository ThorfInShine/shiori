import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDivisionSession } from '@/lib/auth'

// GET — load cart
export async function GET(req: NextRequest) {
  const session = await getDivisionSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const items = await prisma.savedCart.findMany({
    where: { divisionId: session.id },
    include: { book: true },
  })

  const cart = items.map(i => ({
    book: i.book,
    jenis: i.jenis as 'lks' | 'pg',
    jumlah: i.jumlah,
  }))

  return NextResponse.json({ ok: true, cart })
}

// PUT — save entire cart (replace all)
export async function PUT(req: NextRequest) {
  const session = await getDivisionSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  const { cart } = await req.json() as {
    cart: { bookId: number; jenis: 'lks' | 'pg'; jumlah: number }[]
  }

  // Validate quantities
  for (const item of cart) {
    if (!Number.isInteger(item.jumlah) || item.jumlah < 1 || item.jumlah > 10000) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }
  }

  // Transaction: delete all, then insert new
  await prisma.$transaction([
    prisma.savedCart.deleteMany({ where: { divisionId: session.id } }),
    ...cart.map(item =>
      prisma.savedCart.create({
        data: {
          divisionId: session.id,
          bookId: item.bookId,
          jenis: item.jenis,
          jumlah: item.jumlah,
        },
      })
    ),
  ])

  return NextResponse.json({ ok: true })
}

// DELETE — clear cart
export async function DELETE(req: NextRequest) {
  const session = await getDivisionSession()
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })

  await prisma.savedCart.deleteMany({ where: { divisionId: session.id } })
  return NextResponse.json({ ok: true })
}
