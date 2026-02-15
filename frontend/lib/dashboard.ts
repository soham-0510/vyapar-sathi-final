import { supabase } from '@/lib/supabase'
import { getDeadStock, getUpcomingPayments, getDailySummary } from '@/lib/alerts'

export async function getDashboardStats(userId: string) {
  const inv = await supabase.from('inventory').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  const stf = await supabase.from('staff').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  const sup = await supabase.from('suppliers').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  return {
    totalProducts: inv.count ?? 0,
    totalStaff: stf.count ?? 0,
    totalSuppliers: sup.count ?? 0,
  }
}

export async function getAlerts(userId: string) {
  try {
    const dead = await getDeadStock(userId)
    const payments = await getUpcomingPayments(userId)
    const diffDays = (due: string) => {
      const d = new Date(due)
      const t = new Date()
      const ms = d.getTime() - t.getTime()
      return Math.ceil(ms / (1000 * 60 * 60 * 24))
    }
    const items = [
      ...dead.map((d) => ({
        id: d.id,
        type: 'dead_stock',
        title: d.item_name,
        description: 'Item not sold in 30+ days',
      })),
      ...payments.map((p) => ({
        id: p.id,
        type: 'payment_due',
        title: p.supplier_name,
        description: `Payment due in ${diffDays(p.due_date)} days`,
      })),
    ]
    return items.slice(0, 6)
  } catch (e) {
    console.error('getAlerts error:', e)
    return []
  }
}

export function calculateHealthScore(alertCount: number) {
  let score = 100 - alertCount * 10
  if (score < 40) score = 40
  if (score > 100) score = 100
  return score
}

export async function getAISummary(userId: string) {
  try {
    return await getDailySummary(userId)
  } catch (e) {
    console.error('getAISummary error:', e)
    return { summary: ['Unable to generate summary at this time.'] }
  }
}

export async function getDashboardData(userId: string) {
  const stats = await getDashboardStats(userId)
  const alerts = await getAlerts(userId)
  const healthScore = calculateHealthScore(alerts.length)
  const { summary } = await getAISummary(userId)
  return {
    stats,
    healthScore,
    alerts,
    aiSummary: summary,
  }
}
