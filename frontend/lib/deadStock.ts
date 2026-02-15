import { supabase } from '@/lib/supabase'

export type DeadStock = {
  id: string
  item_name: string
  quantity: number
  cost_price: number | null
  selling_price: number | null
  last_updated: string
}

export async function getDeadStockItems(userId: string): Promise<DeadStock[]> {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 45)
    const cutoffStr = cutoff.toISOString()
    const { data, error } = await supabase
      .from('inventory')
      .select('id,item_name,quantity,cost_price,selling_price,last_updated')
      .eq('user_id', userId)
      .lt('last_updated', cutoffStr)
      .order('last_updated', { ascending: true })
    if (error) throw error
    return data ?? []
  } catch (e) {
    console.error('getDeadStockItems error:', e)
    return []
  }
}

export async function applyDiscount(itemId: string): Promise<DeadStock | null> {
  try {
    const { data: current, error: readErr } = await supabase
      .from('inventory')
      .select('id,item_name,quantity,cost_price,selling_price,last_updated')
      .eq('id', itemId)
      .single()
    if (readErr) throw readErr
    const price = Number(current?.selling_price ?? 0)
    const newPrice = Math.max(0, Number((price * 0.8).toFixed(2)))
    const { data, error } = await supabase
      .from('inventory')
      .update({ selling_price: newPrice })
      .eq('id', itemId)
      .select('id,item_name,quantity,cost_price,selling_price,last_updated')
      .single()
    if (error) throw error
    return data as DeadStock
  } catch (e) {
    console.error('applyDiscount error:', e)
    return null
  }
}

export async function bundleItem(itemId: string): Promise<DeadStock | null> {
  try {
    const { data: current, error: readErr } = await supabase
      .from('inventory')
      .select('id,item_name,quantity,cost_price,selling_price,last_updated')
      .eq('id', itemId)
      .single()
    if (readErr) throw readErr
    const price = Number(current?.selling_price ?? 0)
    const newPrice = Math.max(0, Number((price * 0.85).toFixed(2)))
    const { data, error } = await supabase
      .from('inventory')
      .update({ selling_price: newPrice })
      .eq('id', itemId)
      .select('id,item_name,quantity,cost_price,selling_price,last_updated')
      .single()
    if (error) throw error
    return data as DeadStock
  } catch (e) {
    console.error('bundleItem error:', e)
    return null
  }
}

export async function disposeItem(itemId: string): Promise<void> {
  try {
    const { error } = await supabase.from('inventory').delete().eq('id', itemId)
    if (error) throw error
  } catch (e) {
    console.error('disposeItem error:', e)
    throw e
  }
}
