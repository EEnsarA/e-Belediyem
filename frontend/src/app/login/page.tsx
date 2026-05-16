'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Building2, Shield, Eye, EyeOff, Loader2, ChevronRight, Lock, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store'

const loginSchema = z.object({
  tckn: z.string().length(11, 'TCKN 11 haneli olmalıdır').regex(/^\d+$/, 'Sadece rakam giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
})

type LoginForm = z.infer<typeof loginSchema>

const DEMO_ACCOUNTS = [
  { label: 'Vatandaş (Kadıköy)', tckn: '12345678901', role: 'citizen' },
  { label: 'Admin (Kadıköy)', tckn: '11111111111', role: 'admin' },
  { label: 'Vatandaş (Çankaya)', tckn: '34567890123', role: 'citizen' },
  { label: 'Admin (Çankaya)', tckn: '22222222222', role: 'admin' },
  { label: 'Vatandaş (Konak)', tckn: '56789012345', role: 'citizen' },
  { label: 'Admin (Konak)', tckn: '33333333333', role: 'admin' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.tckn, data.password)
      const { user } = useAuthStore.getState()
      toast.success(`Hoş geldiniz, ${user?.full_name}!`)
      router.push(user?.is_admin ? '/admin/dashboard' : '/')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Giriş başarısız. Bilgilerinizi kontrol edin.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (tckn: string) => {
    setValue('tckn', tckn)
    setValue('password', 'demo123')
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Sol panel - dekoratif */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-violet-900" />
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-32 right-16 w-48 h-48 bg-violet-500/20 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 5, repeat: Infinity }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-4xl font-display font-bold">e-Belediyem</span>
            </div>

            <h1 className="text-5xl font-display font-bold leading-tight mb-6">
              Belediyenize
              <br />
              <span className="bg-gradient-to-r from-blue-300 to-violet-300 bg-clip-text text-transparent">
                Dijital Köprü
              </span>
            </h1>
            <p className="text-xl text-white/70 mb-12 leading-relaxed">
              Şikayet bildirin, anketlere katılın, AI destekli destek alın. e-Devlet hesabınızla güvenle giriş yapın.
            </p>

            <div className="space-y-4">
              {[
                { icon: Shield, text: 'e-Devlet ile güvenli kimlik doğrulama' },
                { icon: Building2, text: 'Belediyenize otomatik bağlanma' },
                { icon: Lock, text: 'KVKK uyumlu, verileriniz güvende' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sağ panel - login formu */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-display font-bold text-surface-50">Akıllı Belediye</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-surface-50 mb-2">Giriş Yap</h2>
          <p className="text-surface-400 mb-8">e-Devlet bilgilerinizle sisteme erişin</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* TCKN */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                T.C. Kimlik No
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('tckn')}
                  id="tckn"
                  type="text"
                  maxLength={11}
                  placeholder="12345678901"
                  className="input-field pl-10"
                />
              </div>
              {errors.tckn && (
                <p className="mt-1 text-xs text-red-400">{errors.tckn.message}</p>
              )}
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">
                e-Devlet Şifresi
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Giriş yapılıyor...</>
              ) : (
                <><Shield className="w-4 h-4" /> e-Devlet ile Giriş Yap <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Demo hesaplar */}
          <div className="mt-8">
            <p className="text-xs text-surface-500 text-center mb-3">— Demo Hesaplar (Şifre: herhangi) —</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.tckn}
                  onClick={() => fillDemo(acc.tckn)}
                  className="text-left p-2.5 rounded-xl border border-surface-700 hover:border-primary-500
                             text-xs text-surface-400 hover:text-surface-200 transition-all duration-200
                             hover:bg-surface-800"
                >
                  <span className={`block font-medium ${acc.role === 'admin' ? 'text-primary-400' : 'text-surface-300'}`}>
                    {acc.label}
                  </span>
                  <span className="font-mono opacity-60">{acc.tckn}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-surface-600 mt-6">
            Bu sistem demo amaçlıdır. Gerçek TCKN kullanmayın.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
