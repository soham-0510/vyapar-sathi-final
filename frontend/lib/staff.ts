import { supabase } from '@/lib/supabase'

export type Staff = {
  id: string
  user_id: string
  name: string
  role: string
  phone: string | null
  status: string
  created_at: string
}

export async function getStaff(userId: string): Promise<Staff[]> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addStaff(
  userId: string,
  staffData: {
    name: string
    role: string
    phone?: string | null
    status?: string | null
  }
): Promise<Staff> {
  const payload = {
    user_id: userId,
    name: staffData.name,
    role: staffData.role,
    phone: staffData.phone ?? null,
    status: staffData.status ?? 'Active',
  }
  const { data, error } = await supabase
    .from('staff')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data as Staff
}

export async function updateStaff(
  userId: string,
  staffId: string,
  staffData: Partial<{
    name: string
    role: string
    phone: string | null
    status: string
  }>
): Promise<Staff> {
  const { data, error } = await supabase
    .from('staff')
    .update({
      name: staffData.name,
      role: staffData.role,
      phone: staffData.phone ?? null,
      status: staffData.status,
    })
    .eq('id', staffId)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) throw error
  return data as Staff
}

export async function deleteStaff(userId: string, staffId: string): Promise<void> {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', staffId)
    .eq('user_id', userId)
  if (error) throw error
}
