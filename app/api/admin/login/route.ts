import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  const admin = await prisma.admin.findUnique({ where: { username } })
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
  }
  // ponytail: simple cookie auth; upgrade to JWT/next-auth when needed
  const res = NextResponse.json({ ok: true, username: admin.username })
  res.cookies.set('admin_session', admin.username, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  })
  return res
}
