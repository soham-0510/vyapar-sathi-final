'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/header';
import { SterlingGateNavigation } from '@/components/ui/sterling-gate-navigation';
import { ElegantBackgroundShapes } from '@/components/elegant-background';
import { AlertCircle, TrendingUp, Package, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useState } from 'react';
import { getDashboardData } from '@/lib/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { loading, user } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<{
    stats: { totalProducts: number; totalStaff: number; totalSuppliers: number };
    healthScore: number;
    alerts: Array<{ id: string; type: string; title: string; description: string }>;
    aiSummary: string[];
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.1 + i * 0.05,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  useEffect(() => {
    const run = async () => {
      if (!user) return
      setDataLoading(true)
      setDataError(null)
      const result = await getDashboardData(user.id)
      setDashboard(result)
      setDataLoading(false)
    }
    run()
  }, [user])

  const statsCards = useMemo(() => {
    const totals = dashboard?.stats
    return [
      { label: 'Total Revenue', value: '-', icon: TrendingUp, color: 'text-primary' },
      { label: 'Active Products', value: String(totals?.totalProducts ?? 0), icon: Package, color: 'text-secondary' },
      { label: 'Team Members', value: String(totals?.totalStaff ?? 0), icon: Users, color: 'text-primary' },
      { label: 'Suppliers', value: String(totals?.totalSuppliers ?? 0), icon: AlertCircle, color: 'text-secondary' },
    ]
  }, [dashboard])

  const alertCards = useMemo(() => {
    const items = dashboard?.alerts ?? []
    const paint = (type: string) => {
      if (type === 'payment_due') return { color: 'bg-red-50 dark:bg-red-950', textColor: 'text-red-700 dark:text-red-200' }
      if (type === 'dead_stock' || type === 'low_stock' || type === 'low-stock') return { color: 'bg-orange-50 dark:bg-orange-950', textColor: 'text-orange-700 dark:text-orange-200' }
      return { color: 'bg-gray-50 dark:bg-gray-950', textColor: 'text-gray-700 dark:text-gray-200' }
    }
    return items.map(a => ({
      id: a.id,
      title: a.title,
      item: a.title,
      description: a.description ?? '',
      ...paint(a.type),
      buttons: [
        { label: 'View', action: 'view' },
        { label: 'Dismiss', action: 'dismiss' },
      ],
    }))
  }, [dashboard])

  if (loading) {
    return (
      <main className="bg-background text-foreground min-h-screen relative flex items-center justify-center">
        <p className="text-muted-foreground">Checking authentication...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="bg-background text-foreground min-h-screen relative flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </main>
    );
  }

  if (dataLoading) {
    return (
      <main className="bg-background text-foreground min-h-screen relative flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </main>
    );
  }

  if (dataError) {
    return (
      <main className="bg-background text-foreground min-h-screen relative flex items-center justify-center">
        <p className="text-muted-foreground">{dataError}</p>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen relative">
      <SterlingGateNavigation />
      <Header isLoggedIn={true} />
      <ElegantBackgroundShapes />

      <div className="pt-24 pb-12 px-4 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace('/login');
              }}
            >
              Logout
            </button>
          </div>
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              Welcome to Your Dashboard
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your business today
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  custom={index + 1}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            custom={5}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <div className="md:col-span-1 bg-card rounded-xl p-8 border border-border">
              <h3 className="text-lg font-semibold mb-4">Business Health Score</h3>
              <div className="relative flex items-center justify-center mb-4">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20" />
                <div className="absolute text-center">
                  <p className="text-4xl font-bold text-primary">{dashboard?.healthScore ?? 0}</p>
                  <p className="text-sm text-muted-foreground">/ 100</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Your business is performing well. Keep up the good work!
              </p>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-8 border border-primary/20">
              <h3 className="text-lg font-semibold mb-4">Daily AI Summary</h3>
              <ul className="space-y-3 text-sm">
                {(dashboard?.aiSummary ?? []).map((line, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <div className="mb-8">
            <motion.h3
              custom={6}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-2xl font-bold mb-6"
            >
              Active Alerts
            </motion.h3>

            <div className="grid md:grid-cols-2 gap-6">
              {alertCards.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  custom={7 + index}
                  variants={fadeUpVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${alert.color} rounded-xl p-6 border border-current border-opacity-20 hover:shadow-lg transition-all group cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className={`${alert.textColor} font-semibold text-sm mb-1`}>
                        {alert.title}
                      </p>
                      <p className={`${alert.textColor} font-bold text-lg`}>
                        {alert.item}
                      </p>
                    </div>
                    <AlertCircle
                      className={`w-6 h-6 ${alert.textColor} opacity-60`}
                    />
                  </div>
                  <p
                    className={`${alert.textColor} text-sm opacity-75 mb-4`}
                  >
                    {alert.description}
                  </p>
                  <div className="flex gap-3 pt-2">
                    {alert.buttons.map((btn) => (
                      <button
                        key={btn.action}
                        className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-medium flex-1"
                      >
                        {btn.label}
                      </button>
                    ))}
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
