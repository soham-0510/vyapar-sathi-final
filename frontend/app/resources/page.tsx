'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { SterlingGateNavigation } from '@/components/ui/sterling-gate-navigation';
import { ElegantBackgroundShapes } from '@/components/elegant-background';
import { Plus, Edit, Repeat2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, getStockStatus, type InventoryItem } from '@/lib/inventory';
import { supabase } from '@/lib/supabase';
import { getSuppliers } from '@/lib/suppliers';

type FormState = {
  name: string
  quantity: string
  reorderLevel: string
  supplier: string
}

export default function ResourcesPage() {
  const { user, loading } = useAuth()
  const [sortBy, setSortBy] = useState('name');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResource, setNewResource] = useState<FormState>({ name: '', quantity: '', reorderLevel: '', supplier: '' });
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [editing, setEditing] = useState<InventoryItem | null>(null)

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200';
      case 'Low Stock':
        return 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-200';
      case 'Critical':
        return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200';
      default:
        return '';
    }
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
        const data = await getInventoryItems(user.id)
        setItems(data)
        const supplierData = await getSuppliers(user.id)
        setSuppliers(supplierData)
      } catch (e: any) {
        setErrorMsg(e?.message || 'Failed to load inventory')
      } finally {
        setDataLoading(false)
      }
    }
    run()
  }, [])

  const displayed = useMemo(() => {
    const enriched = items.map(i => ({
      id: i.id,
      name: i.item_name,
      stock: i.quantity,
      reorderLevel: 0,
      status: getStockStatus(i.quantity, null),
    }))
    if (sortBy === 'name') return enriched.sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'stock') return enriched.sort((a, b) => b.stock - a.stock)
    if (sortBy === 'status') return enriched.sort((a, b) => a.status.localeCompare(b.status))
    return enriched
  }, [items, sortBy])

  async function handleSaveNew() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        item_name: newResource.name.trim(),
        quantity: Number(newResource.quantity) || 0,
        cost_price: 0,
        selling_price: 0,
        category: newResource.supplier || null,
      }
      const newItem = await addInventoryItem(user.id, payload)
      setItems(prev => [newItem, ...prev])
      setShowAddForm(false)
      setNewResource({ name: '', quantity: '', reorderLevel: '', supplier: '' })
    } catch (e: any) {
      console.error('Add resource error:', e?.message ?? e)
      setErrorMsg(e?.message || 'Failed to add item')
    }
  }

  async function handleUpdate() {
    if (!editing) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        item_name: editing.item_name,
        quantity: editing.quantity,
        cost_price: editing.cost_price ?? 0,
        selling_price: editing.selling_price ?? 0,
      }
      const updatedItem = await updateInventoryItem(user.id, editing.id, payload)
      setItems(prev => prev.map(i => (i.id === editing.id ? updatedItem : i)))
      setEditing(null)
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to update item')
    }
  }

  async function handleDelete(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await deleteInventoryItem(user.id, id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to delete item')
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
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-4xl font-bold mb-2">Resources</h1>
              <p className="text-muted-foreground">
                Manage your inventory and stock levels
              </p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              Add Resource
            </button>
          </motion.div>

          {/* Add Resource Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-lg border border-border p-6 mb-6"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Resource</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Resource name"
                  value={newResource.name}
                  onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newResource.quantity}
                  onChange={(e) => setNewResource({ ...newResource, quantity: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                  placeholder="Reorder level"
                  value={newResource.reorderLevel}
                  onChange={(e) => setNewResource({ ...newResource, reorderLevel: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <select
                  value={newResource.supplier}
                  onChange={(e) => setNewResource({ ...newResource, supplier: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewResource({ name: '', quantity: '', reorderLevel: '', supplier: '' });
                  }}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNew}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Save Resource
                </button>
              </div>
            </motion.div>
          )}

          {editing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-lg border border-border p-6 mb-6"
            >
              <h3 className="text-lg font-semibold mb-4">Edit Resource</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Resource name"
                  value={editing.item_name}
                  onChange={(e) => setEditing({ ...editing, item_name: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                   placeholder="Quantity"
                  value={editing.quantity}
                  onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="number"
                  placeholder="Reorder level"
                  value={0}
                  onChange={() => {}}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <select
                  value={''}
                  onChange={() => {}}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Supplier</option>
                  <option value="ABC Suppliers">ABC Suppliers</option>
                  <option value="XYZ Trade">XYZ Trade</option>
                  <option value="Global Imports">Global Imports</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-lg border border-border p-4 mb-6"
          >
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="text-sm font-medium mr-2">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="name">Name</option>
                  <option value="stock">Stock Level</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Resources Table */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="bg-card rounded-lg border border-border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Stock Level
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Reorder Level
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((resource) => (
                    <tr
                      key={resource.id}
                      className="border-b border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium">{resource.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{resource.stock} units</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-muted-foreground">{resource.reorderLevel} units</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            resource.status
                          )}`}
                        >
                          {resource.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors" onClick={() => {
                            const item = items.find(i => i.id === resource.id)
                            if (item) setEditing(item)
                          }}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                            <Repeat2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-accent rounded-lg transition-colors" onClick={() => handleDelete(resource.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
