import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import NotaClient from '@/app/order/[id]/nota/NotaClient'

export default async function UserNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await cookies()
  const divisionCookie = c.get('division_session')?.value
  if (!divisionCookie) redirect('/admin')

  let divisionId: number
  try { divisionId = JSON.parse(divisionCookie).id } catch { redirect('/admin') }

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) notFound()

  // Ownership check — user can only see their own orders
  if (order.divisionId !== divisionId) notFound()

  const data = JSON.parse(JSON.stringify(order))
  return <NotaClient order={data} isAdmin={false} />
}
