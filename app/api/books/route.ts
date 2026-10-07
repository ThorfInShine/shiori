import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jenjang = searchParams.get('jenjang')
  const kategori = searchParams.get('kategori')

  const where: Record<string, string> = {}
  if (jenjang) where.jenjang = jenjang
  if (kategori) where.kategori = kategori

  const books = await prisma.book.findMany({ where, orderBy: { id: 'asc' } })
  return NextResponse.json(books)
}
