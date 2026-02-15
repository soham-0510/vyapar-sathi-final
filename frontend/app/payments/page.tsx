'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { SterlingGateNavigation } from '@/components/ui/sterling-gate-navigation';
import { ElegantBackgroundShapes } from '@/components/elegant-background';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getPayments, markPaymentAsPaid, schedulePayment, addPayment, type Payment } from '@/lib/payments';
import { getSuppliers } from '@/lib/suppliers';

export default function PaymentsPage() {
  const [items, setItems] = useState<Payment[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [formSupplierName, setFormSupplierName] = useState('')
  const [formAmount, setFormAmount] = useState<number | ''>('')
  const [formDueDate, setFormDueDate] = useState('')
  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.1 + i * 0.05,
      },
    }),
  };

  useEffect(() => {
    const run = async () => {
      setDataLoading(true)
      setErrorMsg(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setDataLoading(false)
        return
      }
      try {
        const rows = await getPayments(user.id)
        setItems(rows)
      } catch (e: any) {
        console.error('Payments load error:', e)
        setErrorMsg(e?.message || 'Failed to load payments')
      } finally {
        setDataLoading(false)
      }
    }
    run()
  }, [])

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const rows = await getSuppliers(user.id)
        setSuppliers(rows.map(r => ({ id: r.id, name: r.name })))
      } catch (e) {
        console.error('Load suppliers error:', e)
      }
    }
    if (showForm) loadSuppliers()
  }, [showForm])

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200';
      case 'Due Soon':
        return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-200';
      case 'Overdue':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200';
      default:
        return 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="w-5 h-5" />;
      case 'Overdue':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const displayStatus = (p: Payment) => {
    const today = new Date()
    const due = new Date(p.due_date)
    if (p.status?.toLowerCase() === 'paid') return 'Paid'
    if (due < new Date(today.toDateString())) return 'Overdue'
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 3) return 'Due Soon'
    return 'Pending'
  }

  const daysInfo = (p: Payment) => {
    const today = new Date()
    const due = new Date(p.due_date)
    if (p.status?.toLowerCase() === 'paid') return null
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff < 0 ? `Overdue by ${Math.abs(diff)} days` : `Due in ${diff} days`
  }

  const totalDue = useMemo(() => {
    return items.filter(p => displayStatus(p) !== 'Paid').reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
  }, [items])

  const paymentsThisMonth = useMemo(() => {
    const today = new Date()
    const m = today.getMonth()
    const y = today.getFullYear()
    return items
      .filter(p => {
        const d = new Date(p.due_date)
        return d.getMonth() === m && d.getFullYear() === y
      })
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
  }, [items])

  const overdueTotal = useMemo(() => {
    return items
      .filter(p => displayStatus(p) === 'Overdue')
      .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
  }, [items])

  async function refresh() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const rows = await getPayments(user.id)
      setItems(rows)
    } catch (e: any) {
      console.error('Refresh payments error:', e)
      setErrorMsg(e?.message || 'Failed to refresh')
    }
  }

  async function handlePayNow(id: string) {
    try {
      await markPaymentAsPaid(id)
      await refresh()
    } catch (e: any) {
      console.error('Pay now error:', e)
      setErrorMsg(e?.message || 'Failed to mark as paid')
    }
  }

  async function handleSchedule(id: string) {
    const newDate = window.prompt('Enter new due date (YYYY-MM-DD)')
    if (!newDate) return
    try {
      await schedulePayment(id, newDate)
      await refresh()
    } catch (e: any) {
      console.error('Schedule error:', e)
      setErrorMsg(e?.message || 'Failed to schedule payment')
    }
  }

  async function handleSavePayment() {
    try {
      setErrorMsg(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (!formSupplierName || !formAmount || !formDueDate) {
        setErrorMsg('Please fill all fields')
        return
      }
      const row = await addPayment(user.id, {
        supplier_name: formSupplierName,
        amount: Number(formAmount),
        due_date: formDueDate,
        status: 'pending',
      })
      setShowForm(false)
      setFormSupplierName('')
      setFormAmount('')
      setFormDueDate('')
      setItems(prev => {
        const next = [...prev, row]
        next.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
        return next
      })
    } catch (e: any) {
      console.error('Save payment error:', e)
      setErrorMsg(e?.message || 'Failed to save payment')
    }
  }

  return (
    <main className="bg-background text-foreground min-h-screen relative">
      <SterlingGateNavigation />
      <Header isLoggedIn={true} />
      <ElegantBackgroundShapes />

      <div className="pt-24 pb-12 px-4 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">Payments</h1>
              <p className="text-muted-foreground">
                Track supplier payments and due dates
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              Add Payment
            </button>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-xl p-6 border border-border"
            >
              <p className="text-muted-foreground text-sm mb-1">Total Due</p>
              <p className="text-3xl font-bold text-primary">₹{totalDue.toLocaleString()}</p>
            </motion.div>

            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-xl p-6 border border-border"
            >
              <p className="text-muted-foreground text-sm mb-1">Payments This Month</p>
              <p className="text-3xl font-bold">₹{paymentsThisMonth.toLocaleString()}</p>
            </motion.div>

            <motion.div
              custom={3}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-xl p-6 border border-border"
            >
              <p className="text-muted-foreground text-sm mb-1">Overdue</p>
              <p className="text-3xl font-bold text-destructive">₹{overdueTotal.toLocaleString()}</p>
            </motion.div>
          </div>

          {/* Add Payment Form */}
          {showForm && (
            <motion.div
              custom={3.5}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="bg-card rounded-xl p-6 border border-border mb-8"
            >
              <h3 className="text-lg font-semibold mb-4">New Payment</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Supplier</label>
                  <select
                    value={formSupplierName}
                    onChange={(e) => setFormSupplierName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Amount</label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none"
                  />
                </div>
              </div>
              {errorMsg && <p className="text-destructive text-sm mt-3">{errorMsg}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowForm(false)
                    setFormSupplierName('')
                    setFormAmount('')
                    setFormDueDate('')
                    setErrorMsg(null)
                  }}
                  className="px-4 py-2 bg-accent text-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePayment}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                >
                  Save Payment
                </button>
              </div>
            </motion.div>
          )}

          {/* Payments List */}
          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {items.map((payment) => (
              <div
                key={payment.id}
                className="bg-card rounded-xl p-6 border border-border hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${getStatusStyles(displayStatus(payment))}`}>
                      {getStatusIcon(displayStatus(payment))}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {payment.supplier_name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(payment.due_date).toLocaleDateString()}
                        </div>
                        <div>{daysInfo(payment)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-bold mb-2">
                      ₹{Number(payment.amount ?? 0).toLocaleString()}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusStyles(displayStatus(payment))}`}>
                      {displayStatus(payment)}
                    </span>
                  </div>
                </div>

                {displayStatus(payment) !== 'Paid' && (
                  <div className="mt-4 pt-4 border-t border-current border-opacity-20 flex gap-2">
                    <button onClick={() => handlePayNow(payment.id)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm">
                      Pay Now
                    </button>
                    <button onClick={() => handleSchedule(payment.id)} className="px-4 py-2 bg-accent text-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors text-sm">
                      Schedule Payment
                    </button>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
