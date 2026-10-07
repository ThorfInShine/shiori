import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('division_session')?.value
  if (!cookie) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  try {
    const data = JSON.parse(cookie)
    return NextResponse.json({ ok: true, id: data.id, username: data.username, name: data.name })
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}
