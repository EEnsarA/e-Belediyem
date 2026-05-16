'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { AlertCircle, Camera, MapPin, Send, X, Loader2, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api/client'
import { PageHeader } from '@/components/ui'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/map/MapPicker'), { ssr: false })

const CATEGORIES = [
  'Yol ve Kaldırım', 'Park ve Yeşil Alan', 'Su ve Kanalizasyon',
  'Elektrik ve Aydınlatma', 'Çöp ve Temizlik', 'Gürültü',
  'İmar ve Ruhsat', 'Çevre', 'Ulaşım', 'Sosyal Hizmetler', 'Diğer'
]

const schema = z.object({
  description: z.string().min(10, 'En az 10 karakter yazın').max(2000),
  category: z.string().optional(),
  address_text: z.string().optional(),
  is_public: z.boolean().default(false),
})
type FormData = z.infer<typeof schema>

export default function NewComplaintPage() {
  const router = useRouter()
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_public: false }
  })

  const descriptionLength = watch('description')?.length || 0
  const isPublic = watch('is_public')

  const onDrop = useCallback((files: File[]) => {
    const file = files[0]
    if (file) {
      setPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('description', data.description)
      if (data.category) formData.append('category', data.category)
      if (data.address_text) formData.append('address_text', data.address_text)
      formData.append('is_public', String(data.is_public))
      if (coords) {
        formData.append('latitude', String(coords.lat))
        formData.append('longitude', String(coords.lng))
      }
      if (photo) formData.append('photo', photo)

      const complaint = await api.createComplaint(formData)
      toast.success('Şikayetiniz başarıyla oluşturuldu!')
      router.push(`/complaints/${complaint.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Yeni Şikayet"
        description="Sorununuzu bildirin, belediyeniz en kısa sürede ilgilenecek."
        breadcrumb={[{ label: 'Şikayetlerim', href: '/complaints' }, { label: 'Yeni Şikayet' }]}
      />

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Sol: Açıklama ve Kategori */}
        <div className="lg:col-span-2 space-y-5">
          {/* Açıklama */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-surface-900 dark:text-surface-50 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 text-primary-500" />
                Şikayet Açıklaması *
              </label>
              
              {/* Public Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" {...register('is_public')} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isPublic ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isPublic ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-600 dark:text-surface-300">
                  <Globe className="w-3.5 h-3.5" />
                  Herkese Açık Yap
                </div>
              </label>
            </div>
            
            {isPublic && (
              <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-xl text-xs text-primary-700 dark:text-primary-300 flex items-start gap-2">
                <Globe className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Şikayetiniz <b>Keşif</b> sayfasında herkese açık olarak yayınlanacak. Diğer vatandaşlar şikayetinizi görüp <b>"Öne Çıkart"</b> oyu verebilecek.</p>
              </div>
            )}

            <textarea
              {...register('description')}
              rows={5}
              placeholder="Sorununuzu detaylı olarak açıklayın. Konum, zaman ve durumu belirtin..."
              className="input-field resize-none"
            />
            <div className="flex justify-between mt-2">
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
              <span className="text-xs text-surface-400 ml-auto">{descriptionLength}/2000</span>
            </div>
          </div>

          {/* Kategori */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">Kategori</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" value={cat} {...register('category')} className="accent-primary-600" />
                  <span className="text-xs text-surface-600 dark:text-surface-400 group-hover:text-surface-900 dark:group-hover:text-surface-50">
                    {cat}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-3">
              * Kategori seçmezseniz AI otomatik olarak belirleyecek
            </p>
          </div>

          {/* Fotoğraf */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">
              <Camera className="inline w-4 h-4 mr-1.5 text-primary-500" />
              Fotoğraf (İsteğe Bağlı)
            </label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Önizleme" className="w-full h-48 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    🤖 AI bu fotoğrafı analiz edecek ve şikayeti otomatik sınıflandıracak
                  </p>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-surface-300 dark:border-surface-700 hover:border-primary-400'
                }`}
              >
                <input {...getInputProps()} />
                <Camera className="w-10 h-10 text-surface-400 mx-auto mb-3" />
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {isDragActive ? 'Dosyayı bırakın' : 'Fotoğraf sürükleyin veya tıklayın'}
                </p>
                <p className="text-xs text-surface-400 mt-1">JPG, PNG, WEBP · Maks 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Sağ: Konum ve Gönder */}
        <div className="space-y-5">
          {/* Adres */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">
              <MapPin className="inline w-4 h-4 mr-1.5 text-primary-500" />
              Adres
            </label>
            <input
              {...register('address_text')}
              placeholder="Mahalle, cadde veya sokak adı..."
              className="input-field mb-3"
            />
          </div>

          {/* Harita */}
          <div className="card p-6">
            <label className="block text-sm font-semibold text-surface-900 dark:text-surface-50 mb-3">
              Haritadan Konum Seç
            </label>
            <div className="h-52 rounded-xl overflow-hidden">
              <MapPicker onLocationSelect={setCoords} />
            </div>
            {coords && (
              <p className="text-xs text-green-500 mt-2">
                ✓ Konum seçildi: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </p>
            )}
          </div>

          {/* AI Bilgisi */}
          <div className="card p-5 bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 border-primary-100 dark:border-primary-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-800 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-sm">🤖</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary-800 dark:text-primary-200 mb-1">AI Analizi</p>
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  Şikayetiniz gönderildikten sonra AI otomatik olarak kategori belirleyecek, aciliyet skoru hesaplayacak ve spam kontrolü yapacak.
                </p>
              </div>
            </div>
          </div>

          {/* Gönder */}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3.5">
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
            ) : (
              <><Send className="w-4 h-4" /> Şikayeti Gönder</>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  )
}

