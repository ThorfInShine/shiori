import { NextRequest, NextResponse } from 'next/server'
import { getDivisionSession, getAdminSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  // Check admin session first
  const adminSession = await getAdminSession()
  if (adminSession) {
    return NextResponse.json({ ok: true, admin: true, username: adminSession })
  }

  // Check division session
  const divisionSession = await getDivisionSession()
  if (divisionSession) {
    return NextResponse.json({ ok: true, admin: false, id: divisionSession.id, username: divisionSession.username, name: divisionSession.name })
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}
