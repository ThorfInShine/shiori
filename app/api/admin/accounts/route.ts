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

  const body = await req.json()

  // Validate only allowed fields are present
  const allowedFields = ['type', 'username', 'password', 'namaDivisi']
  const receivedFields = Object.keys(body)
  const unexpectedFields = receivedFields.filter(f => !allowedFields.includes(f))
  if (unexpectedFields.length > 0) {
    return NextResponse.json({ error: `Unexpected fields: ${unexpectedFields.join(', ')}` }, { status: 400 })
  }

  const { type, username, password, namaDivisi } = body

  if (!username || !password) return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
  if (!type || (type !== 'admin' && type !== 'division')) {
    return NextResponse.json({ error: 'Type harus admin atau division' }, { status: 400 })
  }

  // Validate username format and length
  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50) {
    return NextResponse.json({ error: 'Username harus 3-50 karakter' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
    return NextResponse.json({ error: 'Username hanya boleh huruf, angka, underscore, dan dash' }, { status: 400 })
  }

  // Validate password strength
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Password harus 8-128 karakter' }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 10)
  const usernameTrimmed = username.trim()

  if (type === 'admin') {
    const exists = await prisma.admin.findUnique({ where: { username: usernameTrimmed } })
    if (exists) return NextResponse.json({ error: 'Username admin sudah digunakan' }, { status: 409 })
    const admin = await prisma.admin.create({ data: { username: usernameTrimmed, passwordHash: hash } })
    return NextResponse.json({ ok: true, id: admin.id })
  }

  if (type === 'division') {
    if (!namaDivisi) return NextResponse.json({ error: 'Nama divisi wajib diisi' }, { status: 400 })
    if (typeof namaDivisi !== 'string' || namaDivisi.trim().length < 2 || namaDivisi.trim().length > 100) {
      return NextResponse.json({ error: 'Nama divisi harus 2-100 karakter' }, { status: 400 })
    }
    const exists = await prisma.division.findUnique({ where: { username: usernameTrimmed } })
    if (exists) return NextResponse.json({ error: 'Username divisi sudah digunakan' }, { status: 409 })
    const div = await prisma.division.create({ data: { namaDivisi: namaDivisi.trim(), username: usernameTrimmed, passwordHash: hash } })
    return NextResponse.json({ ok: true, id: div.id })
  }

  return NextResponse.json({ error: 'Type harus admin atau division' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  if (!await getAdminSession()) return unauthorized()

  const body = await req.json()

  // Validate only allowed fields
  const allowedFields = ['type', 'id', 'password']
  const receivedFields = Object.keys(body)
  const unexpectedFields = receivedFields.filter(f => !allowedFields.includes(f))
  if (unexpectedFields.length > 0) {
    return NextResponse.json({ error: `Unexpected fields: ${unexpectedFields.join(', ')}` }, { status: 400 })
  }

  const { type, id, password } = body

  if (!id || !password) return NextResponse.json({ error: 'ID dan password baru wajib diisi' }, { status: 400 })
  if (!type || (type !== 'admin' && type !== 'division')) {
    return NextResponse.json({ error: 'Type harus admin atau division' }, { status: 400 })
  }

  // Validate password
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Password harus 8-128 karakter' }, { status: 400 })
  }

  // Validate ID is a positive integer
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

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
