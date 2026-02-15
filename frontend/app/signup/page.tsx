'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/header';
import { ElegantBackgroundShapes } from '@/components/elegant-background';
import { supabase } from '@/lib/supabase';

const businessTypes = [
  'Retail Shop',
  'Café',
  'Restaurant',
  'Service Business',
  'Manufacturing',
  'Consulting',
  'Healthcare',
  'Other',
];

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function ensureProfile(fullName: string, businessName: string, businessType: string) {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error('getUser error', authErr);
      throw authErr;
    }
    const userId = authData.user?.id;
    if (!userId) {
      console.error('No authenticated user id');
      throw new Error('No authenticated user');
    }
    const { data: existing, error: selErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (selErr) {
      console.error('Select profile error', selErr);
      throw selErr;
    }
    if (existing) {
      console.log('Profile already exists for', userId);
      return;
    }
    const { error: insErr } = await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
      business_name: businessName,
      business_type: businessType || null,
    });
    if (insErr) {
      console.error('Insert profile error', insErr);
      throw insErr;
    }
    console.log('Profile created for', userId);
  }

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: 0.2 + i * 0.1,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="bg-background text-foreground">
      <Header hideMenu={true} />

      <section className="relative min-h-screen pt-32 pb-20 px-4 md:px-6 overflow-hidden flex items-center justify-center">
        <ElegantBackgroundShapes />

        <div className="w-full max-w-md relative z-10">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">V</span>
              </div>
              <span className="font-bold text-xl">Vyapar Sathi</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Get Started</h1>
            <p className="text-muted-foreground">
              Create your account and empower your business
            </p>
          </motion.div>

          <motion.form
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setErrorMsg(null);
            // Validate
            if (!formData.name || !formData.email || !formData.password || !formData.businessName) {
              setErrorMsg('Please fill in all required fields.');
              return;
            }
            if (formData.password.length < 8) {
              setErrorMsg('Password must be at least 8 characters.');
              return;
            }
            setSubmitting(true);
            // Supabase sign up with metadata and immediate login
            const { error: signUpError } = await supabase.auth.signUp({
              email: formData.email,
              password: formData.password,
              options: {
                data: {
                  full_name: formData.name,
                  business_name: formData.businessName,
                  business_type: formData.businessType || undefined,
                },
              },
            });
            if (signUpError) {
              setErrorMsg(signUpError.message || 'Signup failed. Please try again.');
              setSubmitting(false);
              return;
            }
            // Ensure session: attempt sign-in
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email,
              password: formData.password,
            });
            if (signInError) {
              setErrorMsg(signInError.message || 'Sign in failed after signup.');
              setSubmitting(false);
              return;
            }
            try {
              await ensureProfile(formData.name, formData.businessName, formData.businessType);
            } catch (e: any) {
              setErrorMsg(e?.message || 'Profile creation failed.');
              setSubmitting(false);
              return;
            }
            router.push('/dashboard');
          }}
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium mb-2"
              >
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Your Business Name"
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>

            <div>
              <label
                htmlFor="businessType"
                className="block text-sm font-medium mb-2"
              >
                Business Type
              </label>
              <select
                id="businessType"
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Select a business type</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors mt-6"
              disabled={submitting}
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </motion.form>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mt-6 text-center text-muted-foreground"
          >
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
