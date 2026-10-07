import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdminSession, unauthorized } from '@/lib/auth'

export async function GET() {
  if (!await getAdminSession()) return unauthorized()
  const [admins, divisions] = await Promise.all([
    prisma.admin.findMany({ select: { id: true, username: true } }),
    prisma.division.findMany({ select: { id: true, namaDivisi: true, username: true } }),
  ])
  return NextResponse.json({ admins, divisions })
}

export async function POST(req: NextRequest) {
  if (!await getAdminSession()) return unauthorized()
  const { type, username, password, namaDivisi } = await req.json()
  if (!username || !password) return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })

  const hash = await bcrypt.hash(password, 10)

  if (type === 'admin') {
    const exists = await prisma.admin.findUnique({ where: { username } })
    if (exists) return NextResponse.json({ error: 'Username admin sudah digunakan' }, { status: 409 })
    const admin = await prisma.admin.create({ data: { username, passwordHash: hash } })
    return NextResponse.json({ ok: true, id: admin.id })
  }

  if (type === 'division') {
    if (!namaDivisi) return NextResponse.json({ error: 'Nama divisi wajib diisi' }, { status: 400 })
    const exists = await prisma.division.findUnique({ where: { username } })
    if (exists) return NextResponse.json({ error: 'Username divisi sudah digunakan' }, { status: 409 })
    const div = await prisma.division.create({ data: { namaDivisi, username, passwordHash: hash } })
    return NextResponse.json({ ok: true, id: div.id })
  }

  return NextResponse.json({ error: 'Type harus admin atau division' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  if (!await getAdminSession()) return unauthorized()
  const { type, id, password } = await req.json()
  if (!id || !password) return NextResponse.json({ error: 'ID dan password baru wajib diisi' }, { status: 400 })

  const hash = await bcrypt.hash(password, 10)

  if (type === 'admin') {
    await prisma.admin.update({ where: { id }, data: { passwordHash: hash } })
    return NextResponse.json({ ok: true })
  }

  if (type === 'division') {
    await prisma.division.update({ where: { id }, data: { passwordHash: hash } })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Type harus admin atau division' }, { status: 400 })
}
