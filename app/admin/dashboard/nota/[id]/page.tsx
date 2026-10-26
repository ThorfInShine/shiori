import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import NotaClient from '@/app/order/[id]/nota/NotaClient'

export default async function AdminNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const adminSession = await getAdminSession()
  if (!adminSession) redirect('/login')

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) notFound()

  const data = JSON.parse(JSON.stringify(order))
  return <NotaClient order={data} isAdmin={true} />
}
