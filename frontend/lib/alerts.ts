import { supabase } from '@/lib/supabase'

type DeadStockItem = {
  id: string
  item_name: string
  quantity: number
  last_updated: string
}

type UpcomingPayment = {
  id: string
  supplier_name: string
  amount: number
  due_date: string
}

export async function getDeadStock(userId: string): Promise<DeadStockItem[]> {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('id,item_name,quantity,last_updated')
      .eq('user_id', userId)
    if (error) throw error
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    return (data ?? []).filter((i) => {
      const lu = new Date(i.last_updated)
      return lu <= cutoff
    })
  } catch (e) {
    console.error('getDeadStock error:', e)
    return []
  }
}

export async function getUpcomingPayments(userId: string): Promise<UpcomingPayment[]> {
  try {
    const today = new Date()
    const next7 = new Date()
    next7.setDate(today.getDate() + 7)
    const toStr = (d: Date) => d.toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('payments')
      .select('id,supplier_name,amount,due_date,status')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', toStr(today))
      .lte('due_date', toStr(next7))
      .order('due_date', { ascending: true })
    if (error) throw error
    return (data ?? []).map((p: any) => ({
      id: p.id,
      supplier_name: p.supplier_name,
      amount: Number(p.amount ?? 0),
      due_date: p.due_date,
    }))
  } catch (e) {
    console.error('getUpcomingPayments error:', e)
    return []
  }
}

export async function getDailySummary(userId: string): Promise<{ summary: string[] }> {
  try {
    const { data: items, error: invErr } = await supabase
      .from('inventory')
      .select('id,item_name,quantity,last_updated')
      .eq('user_id', userId)
    if (invErr) throw invErr
    const dead = await getDeadStock(userId)
    const payments = await getUpcomingPayments(userId)
    const lowCount = (items ?? []).filter((i) => (i.quantity ?? 0) === 0).length
    const deadCount = dead.length
    const totalDue = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
    const lines: string[] = []
    if (lowCount > 0) lines.push(`You have ${lowCount} low-stock items. Consider restocking.`)
    if (deadCount > 0) lines.push(`${deadCount} products have not sold in over 30 days.`)
    if (payments.length > 0) lines.push(`You have ₹${totalDue} due in the next few days.`)
    if (lines.length === 0) lines.push('All systems look good today. No alerts.')
    return { summary: lines }
  } catch (e) {
    console.error('getDailySummary error:', e)
    return { summary: ['Unable to generate summary at this time.'] }
  }
}
