import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function getDivisionId(req: NextRequest): number | null {
  const cookie = req.cookies.get('division_session')?.value
  if (!cookie) return null
  try { return JSON.parse(cookie).id } catch { return null }
}

// GET — load cart
export async function GET(req: NextRequest) {
  const divId = getDivisionId(req)
  if (!divId) return NextResponse.json({ ok: false }, { status: 401 })

  const items = await prisma.savedCart.findMany({
    where: { divisionId: divId },
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
  const divId = getDivisionId(req)
  if (!divId) return NextResponse.json({ ok: false }, { status: 401 })

  const { cart } = await req.json() as {
    cart: { bookId: number; jenis: 'lks' | 'pg'; jumlah: number }[]
  }

  // Transaction: delete all, then insert new
  await prisma.$transaction([
    prisma.savedCart.deleteMany({ where: { divisionId: divId } }),
    ...cart.map(item =>
      prisma.savedCart.create({
        data: {
          divisionId: divId,
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
  const divId = getDivisionId(req)
  if (!divId) return NextResponse.json({ ok: false }, { status: 401 })

  await prisma.savedCart.deleteMany({ where: { divisionId: divId } })
  return NextResponse.json({ ok: true })
}
