import { supabase } from '@/lib/supabase'

export type Supplier = {
  id: string
  user_id: string
  name: string
  phone: string | null
  category: string
  created_at: string
}

export async function getSuppliers(userId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addSupplier(
  userId: string,
  supplierData: {
    name: string
    phone?: string | null
    category: string
  }
): Promise<Supplier> {
  const payload = {
    user_id: userId,
    name: supplierData.name,
    phone: supplierData.phone ?? null,
    category: supplierData.category,
  }
  const { data, error } = await supabase
    .from('suppliers')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(
  userId: string,
  supplierId: string,
  supplierData: Partial<{
    name: string
    phone: string | null
    category: string
  }>
): Promise<Supplier> {
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: supplierData.name,
      phone: supplierData.phone ?? null,
      category: supplierData.category,
    })
    .eq('id', supplierId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(userId: string, supplierId: string): Promise<void> {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId)
    .eq('user_id', userId)
  if (error) throw error
}
