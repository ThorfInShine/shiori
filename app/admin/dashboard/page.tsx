import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/auth'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboardPage() {
  // Server-side authentication check - runs before rendering
  const adminSession = await getAdminSession()

  if (!adminSession) {
    redirect('/login')
  }

  // Only render if authenticated
  return <AdminDashboardClient />
}
