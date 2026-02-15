import { supabase } from '@/lib/supabase'

export type InventoryItem = {
  id: string
  user_id: string
  item_name: string
  quantity: number
  cost_price: number | null
  selling_price: number | null
  last_updated: string
}

export async function getInventoryItems(userId: string): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addInventoryItem(
  userId: string,
  itemData: {
    item_name: string
    quantity: number
    cost_price?: number | null
    selling_price?: number | null
    category?: string | null
  }
): Promise<InventoryItem> {
  const payload = {
    user_id: userId,
    item_name: itemData.item_name,
    quantity: itemData.quantity,
    cost_price: itemData.cost_price ?? 0,
    selling_price: itemData.selling_price ?? 0,
  }
  const { data, error } = await supabase
    .from('inventory')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data as InventoryItem
}

export async function updateInventoryItem(
  userId: string,
  itemId: string,
  itemData: Partial<{
    item_name: string
    quantity: number
    cost_price: number | null
    selling_price: number | null
  }>
): Promise<InventoryItem> {
  const update = {
    item_name: itemData.item_name,
    quantity: itemData.quantity,
    cost_price: itemData.cost_price ?? 0,
    selling_price: itemData.selling_price ?? 0,
  }
  const { data, error } = await supabase
    .from('inventory')
    .update(update)
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data as InventoryItem
}

export async function deleteInventoryItem(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId)
  if (error) throw error
}

export function getStockStatus(quantity: number, reorder_level: number | null): 'Critical' | 'Low Stock' | 'In Stock' {
  const rl = reorder_level ?? 0
  if (rl === 0) return quantity === 0 ? 'Critical' : 'In Stock'
  if (quantity <= Math.floor(rl / 2)) return 'Critical'
  if (quantity <= rl) return 'Low Stock'
  return 'In Stock'
}
