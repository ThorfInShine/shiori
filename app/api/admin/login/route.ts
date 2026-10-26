import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminToken, createDivisionToken, revokeTokens } from '@/lib/auth'

// Pre-computed dummy hash for timing attack prevention
const DUMMY_HASH = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' // bcrypt hash of 'dummy'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  // Validate input
  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
  }
  if (typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid input type' }, { status: 400 })
  }
  if (username.length > 50 || password.length > 128) {
    return NextResponse.json({ error: 'Input too long' }, { status: 400 })
  }

  // Check both admin and division in parallel to prevent timing attacks
  const [admin, division] = await Promise.all([
    prisma.admin.findUnique({ where: { username } }),
    prisma.division.findUnique({ where: { username } }),
  ])

  // Always perform bcrypt comparison to prevent timing attacks
  // Use dummy hash if user doesn't exist
  const adminHash = admin?.passwordHash || DUMMY_HASH
  const divisionHash = division?.passwordHash || DUMMY_HASH

  const [isAdminValid, isDivisionValid] = await Promise.all([
    bcrypt.compare(password, adminHash),
    bcrypt.compare(password, divisionHash),
  ])

  // Check admin authentication
  if (admin && isAdminValid) {
    const token = createAdminToken(admin.username)
    const res = NextResponse.json({ ok: true, role: 'admin', username: admin.username })
    res.cookies.set('admin_session', token, {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24,
      sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    })
    return res
  }

  // Check division authentication
  if (division && isDivisionValid) {
    const token = createDivisionToken(division.id)
    const res = NextResponse.json({ ok: true, role: 'division', username: division.username, divisionName: division.namaDivisi })
    res.cookies.set('division_session', token, {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24,
      sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    })
    return res
  }

  // Both validations completed, return error
  return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
}

// Logout — revoke tokens and clear session cookies
export async function DELETE() {
  await revokeTokens()
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', '', { maxAge: 0, path: '/' })
  res.cookies.set('division_session', '', { maxAge: 0, path: '/' })
  return res
}
