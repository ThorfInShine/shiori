import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getAdminSession, getDivisionSession } from '@/lib/auth'
import NotaClient from './NotaClient'

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const adminSession = await getAdminSession()
  const divisionSession = await getDivisionSession()

  // Must have some valid session
  if (!adminSession && !divisionSession) redirect('/login')

  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) notFound()

  // IDOR protection: division users can only view their own orders
  if (!adminSession && divisionSession) {
    if (order.divisionId !== divisionSession.id) notFound()
  }

  // Serialize dates
  const data = JSON.parse(JSON.stringify(order))
  return <NotaClient order={data} isAdmin={!!adminSession} />
}
