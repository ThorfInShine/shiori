import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error('CRITICAL: JWT_SECRET environment variable must be set')
})()

// Token revocation store - in production use Redis or database
const revokedTokens = new Set<string>()

interface AdminSession {
  username: string
  type: 'admin'
}

interface DivisionSessionToken {
  id: number
  type: 'division'
}

export interface DivisionSession {
  id: number
  username: string
  name: string
}

/** Verify and return admin session data or null */
export async function getAdminSession(): Promise<string | null> {
  const c = await cookies()
  const token = c.get('admin_session')?.value
  if (!token) return null

  // Check if token has been revoked
  if (revokedTokens.has(token)) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AdminSession
    if (payload.type !== 'admin') return null
    return payload.username
  } catch {
    return null
  }
}

/** Verify and return division session data or null - fetches full data from DB */
export async function getDivisionSession(): Promise<DivisionSession | null> {
  const c = await cookies()
  const token = c.get('division_session')?.value
  if (!token) return null

  // Check if token has been revoked
  if (revokedTokens.has(token)) return null

  try {
    const payload = jwt.verify(token, JWT_SECRET) as DivisionSessionToken
    if (payload.type !== 'division') return null

    // Fetch full division data from database
    const division = await prisma.division.findUnique({
      where: { id: payload.id },
      select: { id: true, username: true, namaDivisi: true }
    })

    if (!division) return null

    return {
      id: division.id,
      username: division.username,
      name: division.namaDivisi
    }
  } catch {
    return null
  }
}

/** Create signed admin session token */
export function createAdminToken(username: string): string {
  return jwt.sign({ username, type: 'admin' } as AdminSession, JWT_SECRET, { expiresIn: '24h' })
}

/** Create signed division session token - stores only ID, not sensitive data */
export function createDivisionToken(id: number): string {
  return jwt.sign({ id, type: 'division' } as DivisionSessionToken, JWT_SECRET, { expiresIn: '24h' })
}

/** 401 response for unauthorized API requests */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/** Revoke tokens on logout */
export async function revokeTokens() {
  const c = await cookies()
  const adminToken = c.get('admin_session')?.value
  const divisionToken = c.get('division_session')?.value

  if (adminToken) revokedTokens.add(adminToken)
  if (divisionToken) revokedTokens.add(divisionToken)
}
