import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const VALID_JENJANG = ['SD', 'SMP', 'SMA', 'SMK', 'MADRASAH', 'TK AKADEMIK', 'AKM & P5', 'PRODUKTIF', 'ASAJ UM', 'JURNAL & TK', 'MTS', 'MI', 'SMA-SMK']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')
  const kategori = searchParams.get('kategori')

  // Validate jenjang against whitelist
  if (jenjang && !VALID_JENJANG.includes(jenjang)) {
    return NextResponse.json({ error: 'Invalid jenjang parameter' }, { status: 400 })
  }

  // Ensure parameters are strings, not objects (prevent operator injection)
  if (jenjang && typeof jenjang !== 'string') {
    return NextResponse.json({ error: 'Invalid parameter type' }, { status: 400 })
  }
  if (kategori && typeof kategori !== 'string') {
    return NextResponse.json({ error: 'Invalid parameter type' }, { status: 400 })
  }

  const where: { jenjang?: string; kategori?: string } = {}
  if (jenjang) where.jenjang = jenjang
  if (kategori) where.kategori = kategori

  const books = await prisma.book.findMany({ where, orderBy: { id: 'asc' } })
  return NextResponse.json(books)
}
