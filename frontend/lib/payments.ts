import { supabase } from '@/lib/supabase'

export type Payment = {
  id: string
  user_id: string
  supplier_name: string
  amount: number
  due_date: string
  status: string
  created_at: string
}

export async function addPayment(
  userId: string,
  data: {
    supplier_name: string
    amount: number
    due_date: string
    status?: string
  }
): Promise<Payment> {
  const payload = {
    user_id: userId,
    supplier_name: data.supplier_name,
    amount: data.amount,
    due_date: data.due_date,
    status: data.status ?? 'pending',
  }

  const { data: row, error } = await supabase
    .from('payments')
    .insert([payload])
    .select()
    .single()

  if (error) throw error
  return row as Payment
}

export async function getPayments(userId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function markPaymentAsPaid(paymentId: string): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'paid' })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error
  return data as Payment
}

export async function schedulePayment(paymentId: string, newDate: string): Promise<Payment> {
  const { data, error } = await supabase
    .from('payments')
    .update({ due_date: newDate, status: 'pending' })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error
  return data as Payment
}
