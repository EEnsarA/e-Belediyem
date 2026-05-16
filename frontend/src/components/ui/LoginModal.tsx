'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { X, Building2, LogIn, ShieldCheck } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  action?: string // "oy vermek", "şikayet öne çıkarmak" etc.
}

export default function LoginModal({ isOpen, onClose, action = "bu işlemi yapmak" }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="bg-white dark:bg-surface-900 rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header gradient */}
              <div className="relative bg-gradient-to-br from-primary-600 to-violet-700 p-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                  <Building2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black tracking-tight">Giriş Gerekli</h2>
                <p className="text-primary-100 text-sm mt-1">
                  {action} için e-Devlet ile giriş yapmanız gerekiyor.
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    e-Devlet girişi ile belediyenize ait içeriklerde oy verebilir, şikayet oluşturabilir ve daha fazlasını yapabilirsiniz.
                  </p>
                </div>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-gradient-to-r from-primary-600 to-violet-600 text-white font-bold rounded-2xl hover:from-primary-700 hover:to-violet-700 transition-all shadow-lg shadow-primary-500/20"
                >
                  <LogIn className="w-5 h-5" />
                  e-Devlet ile Giriş Yap
                </Link>

                <button
                  onClick={onClose}
                  className="w-full py-3 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors font-medium"
                >
                  Vazgeç, görüntülemeye devam et
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
