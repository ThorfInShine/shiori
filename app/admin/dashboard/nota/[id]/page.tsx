import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import NotaClient from '@/app/order/[id]/nota/NotaClient'

export default async function AdminNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await cookies()
  if (!c.get('admin_session')?.value) redirect('/admin')

  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) notFound()

  const data = JSON.parse(JSON.stringify(order))
  return <NotaClient order={data} isAdmin={true} />
}
