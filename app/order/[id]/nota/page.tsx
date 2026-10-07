import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import NotaClient from './NotaClient'

export default async function NotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id: parseInt(id) },
    include: { items: { include: { book: true } }, buyer: true },
  })
  if (!order) notFound()

  // Serialize dates
  const data = JSON.parse(JSON.stringify(order))
  return <NotaClient order={data} />
}
