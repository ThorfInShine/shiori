import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  // Check admin first
  const admin = await prisma.admin.findUnique({ where: { username } })
  if (admin && (await bcrypt.compare(password, admin.passwordHash))) {
    const res = NextResponse.json({ ok: true, role: 'admin', username: admin.username })
    res.cookies.set('admin_session', admin.username, {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24,
      sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    })
    return res
  }

  // Check division
  const division = await prisma.division.findUnique({ where: { username } })
  if (division && (await bcrypt.compare(password, division.passwordHash))) {
    const res = NextResponse.json({ ok: true, role: 'division', username: division.username, divisionName: division.namaDivisi })
    res.cookies.set('division_session', JSON.stringify({ id: division.id, username: division.username, name: division.namaDivisi }), {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24,
      sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    })
    return res
  }

  return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
}

// Logout — clear session cookies
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
  res.cookies.set('division_session', '', { maxAge: 0, path: '/' })
  return res
}
