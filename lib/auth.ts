import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/** Returns admin username or null. Use in API routes for defense-in-depth. */
export async function getAdminSession(): Promise<string | null> {
  const c = await cookies()
  return c.get('admin_session')?.value ?? null
}

/** 401 response for unauthorized API requests. */
export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
