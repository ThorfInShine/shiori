import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import NotaClient from './NotaClient'

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await cookies()
  const adminSession = c.get('admin_session')?.value
  const divisionCookie = c.get('division_session')?.value

  // Must have some session (proxy enforces this too, defense-in-depth)
  if (!adminSession && !divisionCookie) redirect('/admin')

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) notFound()

  // IDOR protection: division users can only view their own orders
  if (!adminSession && divisionCookie) {
    try {
      const div = JSON.parse(divisionCookie)
      if (order.divisionId && order.divisionId !== div.id) notFound()
    } catch { notFound() }
  }

  // Serialize dates
  const data = JSON.parse(JSON.stringify(order))
  return <NotaClient order={data} isAdmin={!!adminSession} />
}
