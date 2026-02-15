'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { SterlingGateNavigation } from '@/components/ui/sterling-gate-navigation';
import { ElegantBackgroundShapes } from '@/components/elegant-background';
import { Plus, MessageCircle, Send, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getStaff, addStaff, deleteStaff, type Staff } from '@/lib/staff';

const staffAvatar = '👤';

const nearbyStaff = [
  {
    id: 101,
    name: 'Vikram Singh',
    role: 'Counter Staff',
    distance: '2.5 km',
    availability: 'Available now',
    avatar: '👨‍💼',
  },
  {
    id: 102,
    name: 'Anjali Verma',
    role: 'Barista',
    distance: '1.8 km',
    availability: 'Available in 30 mins',
    avatar: '👩‍💼',
  },
  {
    id: 103,
    name: 'Rohan Gupta',
    role: 'Delivery Executive',
    distance: '3.2 km',
    availability: 'Available from 6 PM',
    avatar: '👨‍💼',
  },
];

export default function StaffPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    phone: '',
    status: '',
  });
  const [staffItems, setStaffItems] = useState<Staff[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

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
        const data = await getStaff(user.id)
        setStaffItems(data)
      } catch (e: any) {
        setErrorMsg(e?.message || 'Failed to load staff')
      } finally {
        setDataLoading(false)
      }
    }
    run()
  }, [])

  async function handleAddStaff() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        name: newStaff.name.trim(),
        role: newStaff.role.trim(),
        phone: newStaff.phone || null,
        status: newStaff.status || 'Active',
      }
      const created = await addStaff(user.id, payload)
      setStaffItems(prev => [created, ...prev])
      setShowAddForm(false)
      setNewStaff({ name: '', role: '', phone: '', status: '' })
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to add staff')
    }
  }

  async function handleDeleteStaff(id: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await deleteStaff(user.id, id)
      setStaffItems(prev => prev.filter(s => s.id !== id))
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to delete staff')
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
              <h1 className="text-4xl font-bold mb-2">Staff</h1>
              <p className="text-muted-foreground">
                Manage your team members and their roles
              </p>
            </div>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              <Plus className="w-5 h-5" />
              Add Staff
            </button>
          </motion.div>

          {/* Add Staff Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card rounded-lg border border-border p-6 mb-8"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Staff Member</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Staff name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <select
                  value={newStaff.status}
                  onChange={(e) => setNewStaff({ ...newStaff, status: e.target.value })}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select Status</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewStaff({ name: '', role: '', phone: '', status: '' });
                  }}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Save Staff Member
                </button>
              </div>
            </motion.div>
          )}

          {/* Staff Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Current Staff</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffItems.map((staff, index) => (
              <motion.div
                key={staff.id}
                custom={index + 1}
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
                className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all group"
              >
                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-5xl">{staffAvatar}</div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staff.status === 'Active'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-200'
                          : 'bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-1">{staff.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{staff.role}</p>

                  <div className="text-xs text-muted-foreground mb-6">
                    Joined {new Date(staff.created_at).toLocaleDateString()}
                  </div>

                  {/* Hover Actions */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm">
                      <Send className="w-4 h-4" />
                      Request
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors text-sm">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium hover:bg-destructive/90 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            </div>
          </div>

          {/* Nearby Available Staff Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Nearby Available Staff</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyStaff.map((staff, index) => (
                <motion.div
                  key={staff.id}
                  custom={index + 1}
                  variants={fadeUpVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all group"
                >
                  {/* Card Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-5xl">{staff.avatar}</div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Near
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-1">{staff.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{staff.role}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-muted-foreground">📍 {staff.distance}</span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ {staff.availability}
                      </span>
                    </div>

                    {/* Hover Actions */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm">
                        <Send className="w-4 h-4" />
                        Request
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent text-foreground rounded-lg font-medium hover:bg-accent/80 transition-colors text-sm">
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
