'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { FileText, Printer, FileBadge, ShieldCheck, Home, Building, Leaf, Loader2, CheckCircle, QrCode, Heart, Briefcase, MapPin, HandHeart, Shield, Landmark } from 'lucide-react'
import { useAuthStore } from '@/store'

const DOCUMENTS = [
  { id: 'borc', title: 'Borcu Yoktur Belgesi', desc: 'Belediyemize ait vadesi geçmiş borcunuzun bulunmadığına dair resmî e-imzalı belge.', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
  { id: 'ikametgah', title: 'İkametgah İlmühaberi', desc: 'Sistemlerimizde kayıtlı olan güncel ikamet adresinizi gösteren barkodlu belge.', icon: Home, color: 'text-blue-500', bg: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
  { id: 'rayic', title: 'Emlak Rayiç Bedel Belgesi', desc: 'Taşınmazlarınıza ait güncel emlak beyan ve rayiç bedelini gösteren onaylı belge.', icon: Building, color: 'text-amber-500', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/20' },
  { id: 'cevre', title: 'Çevre Temizlik Vergisi Belgesi', desc: 'İşyeri/meskenleriniz için ÇTV mükellefiyet ve borç durumunu gösteren belge.', icon: Leaf, color: 'text-teal-500', bg: 'bg-teal-500/10', borderColor: 'border-teal-500/20' },
  { id: 'evlenme', title: 'Evlenme Ehliyet Belgesi', desc: 'Evlilik işlemleri ve nikah başvurusu için gerekli resmi onaylı belge.', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', borderColor: 'border-rose-500/20' },
  { id: 'ruhsat', title: 'İş Yeri Açma ve Çalışma Ruhsatı', desc: 'İşletmenize ait güncel ruhsat bilgileri ve e-imzalı dijital kopyası.', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20' },
  { id: 'numarataj', title: 'Numarataj Belgesi', desc: 'Adres tespiti, su ve doğalgaz abonelikleri için gerekli resmi kapı no belgesi.', icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
  { id: 'sosyal', title: 'Sosyal Yardım Durum Belgesi', desc: 'Belediyemizden aldığınız sosyal yardımları gösteren kurumlar arası belge.', icon: HandHeart, color: 'text-pink-500', bg: 'bg-pink-500/10', borderColor: 'border-pink-500/20' },
  { id: 'askerlik', title: 'Askerlik Durum / Muafiyet Belgesi', desc: 'Yerel yönetim entegrasyonu ile alınan güncel askerlik durum belgesi.', icon: Shield, color: 'text-slate-500', bg: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
  { id: 'mezar', title: 'Mezar Yeri Sahiplik Belgesi', desc: 'Mezarlıklar Müdürlüğü onaylı, tahsis ve kullanım hakkını gösteren resmi belge.', icon: Landmark, color: 'text-violet-500', bg: 'bg-violet-500/10', borderColor: 'border-violet-500/20' },
]

export default function DocumentsPage() {
  const { user } = useAuthStore()
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<typeof DOCUMENTS[0] | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // URL parametresinden otomatik belge oluşturma tetikleyicisi
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const docId = urlParams.get('doc')
      if (docId) {
        const targetDoc = DOCUMENTS.find(d => d.id === docId)
        if (targetDoc) {
          // Toast hook render olmadan hemen çağırmayı engellemek için hafif bir gecikme
          setTimeout(() => {
            handleGenerate(targetDoc)
            window.history.replaceState({}, '', '/documents') // URL'i temizle
          }, 500)
        }
      }
    }
  }, [])

  const handleGenerate = (doc: typeof DOCUMENTS[0]) => {
    setGeneratingId(doc.id)
    toast.loading("Belediye sistemleri sorgulanıyor...", { id: "doc-gen" })
    
    // AI veya Backend simülasyonu (2 saniye)
    setTimeout(() => {
      setGeneratingId(null)
      setPreviewDoc(doc)
      toast.success("Belge başarıyla oluşturuldu!", { id: "doc-gen" })
    }, 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  // Belge önizleme açıkken sayfayı print-friendly yapmak için
  const renderPreview = () => {
    if (!previewDoc || !mounted) return null

    const today = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    const docNo = `E-BELGE-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`

    return createPortal(
      <div className="fixed inset-0 z-[99999] bg-gray-900/80 flex items-center justify-center p-4 print:p-0 print:bg-white overflow-y-auto backdrop-blur-sm print:block print:relative print:inset-auto">
        <div className="bg-white max-w-4xl w-full min-h-[297mm] print:min-h-0 print:h-auto print:m-0 rounded-xl shadow-2xl relative flex flex-col print:shadow-none print:rounded-none mt-auto mb-auto">
          
          {/* Sadece ekranda görünen işlem çubuğu */}
          <div className="bg-slate-100 p-4 border-b flex justify-between items-center rounded-t-xl print:hidden sticky top-0 z-10 shadow-sm">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileBadge className="text-emerald-600" />
              Resmî Belge Önizlemesi
            </h2>
            <div className="flex gap-3">
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 bg-white border border-slate-300 rounded-lg transition-colors font-medium">
                Kapat
              </button>
              <button onClick={handlePrint} className="px-5 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors font-medium shadow-md">
                <Printer size={18} />
                PDF Olarak Kaydet / Yazdır
              </button>
            </div>
          </div>

          {/* A4 Kağıdı İçeriği */}
          <div className="p-12 print:p-8 flex-1 bg-white relative text-slate-800">
            {/* Filigran */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none print:opacity-[0.05]">
               <img src={user?.municipality_logo_url || '/logos/default.png'} alt="Filigran" className="w-[500px] h-[500px] object-contain grayscale" />
            </div>

            {/* Antet (Header) */}
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
              <div className="flex items-center gap-4">
                <img src={user?.municipality_logo_url || '/logos/default.png'} alt="Logo" className="w-20 h-20 object-contain" />
                <div>
                  <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">T.C.</h1>
                  <h2 className="text-xl font-bold text-slate-800 uppercase">{user?.municipality_name || 'BELEDİYE BAŞKANLIĞI'}</h2>
                  <p className="text-sm text-slate-600 font-medium mt-1">Mali Hizmetler Müdürlüğü</p>
                </div>
              </div>
              <div className="text-right text-sm text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-800">Tarih:</span> {today}</p>
                <p><span className="font-semibold text-slate-800">Sayı:</span> {docNo}</p>
                <p><span className="font-semibold text-slate-800">Konu:</span> {previewDoc.title}</p>
              </div>
            </div>

            {/* İçerik */}
            <div className="min-h-[400px]">
              <h3 className="text-center text-xl font-bold underline mb-10 uppercase tracking-wider">{previewDoc.title}</h3>
              
              <div className="space-y-6 text-justify leading-relaxed text-[15px]">
                <p>
                  İlgili makama,
                </p>
                <p>
                  Belediyemiz sistemlerinde yapılan inceleme neticesinde, aşağıda bilgileri bulunan mükellefimizin/vatandaşımızın 
                  <strong> {today} </strong> tarihi itibarıyla kayıtlarımızın güncel durumu aşağıda belirtilmiştir.
                </p>
                
                <div className="bg-slate-50 p-6 rounded border border-slate-200 my-8">
                  <div className="grid grid-cols-3 gap-y-4">
                    <div className="font-semibold text-slate-600">Adı Soyadı / Ünvanı:</div>
                    <div className="col-span-2 font-bold uppercase">{user?.full_name || 'BİLİNMİYEN KİŞİ'}</div>
                    
                    <div className="font-semibold text-slate-600">TCKN / VKN:</div>
                    <div className="col-span-2">{user?.id ? `1000000${user.id}***` : '123456789**'}</div>
                    
                    <div className="font-semibold text-slate-600">Sorgulanan Belge:</div>
                    <div className="col-span-2">{previewDoc.title}</div>
                    
                    <div className="font-semibold text-slate-600">Sorgu Sonucu:</div>
                    <div className="col-span-2 font-bold text-emerald-700">
                      {previewDoc.id === 'borc' ? 'KURUMUMUZA MUACCEL BORCU BULUNMAMAKTADIR.' : 'KAYITLARIMIZLA UYGUNDUR.'}
                    </div>
                  </div>
                </div>

                <p>
                  İşbu belge, ilgilinin e-Belediye sistemi üzerinden <strong>{docNo}</strong> referans numarası ile elektronik olarak 
                  talep etmesi üzerine üretilmiş olup, 5070 sayılı Elektronik İmza Kanunu kapsamında e-imza ile imzalanarak 
                  elektronik ortamda doğruluğu teyit edilebilir durumdadır.
                </p>
              </div>
            </div>

            {/* İmza ve QR Code Footer */}
            <div className="mt-20 flex justify-between items-end">
              <div className="flex flex-col items-center border border-slate-300 p-2 bg-white">
                <QrCode size={80} className="text-slate-800" />
                <span className="text-[10px] mt-1 text-slate-500 font-mono">DOĞRULAMA KODU</span>
              </div>
              
              <div className="text-center">
                <div className="mb-8">
                  <p className="font-bold text-emerald-700 font-mono border-b border-emerald-200 inline-block px-4 py-1 bg-emerald-50 rounded">Güvenli E-İmza ile Onaylanmıştır</p>
                </div>
                <p className="font-bold text-slate-800">Mustafa YILMAZ</p>
                <p className="text-sm text-slate-600">Belediye Başkan Yardımcısı</p>
              </div>
            </div>

            <div className="absolute bottom-4 left-8 right-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
              Bu belge 5070 sayılı Elektronik İmza Kanununun 5. Maddesi gereğince güvenli elektronik imza ile imzalanmıştır. <br/>
              Belge Doğrulama Adresi: https://turkiye.gov.tr/belge-dogrulama
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <>
      {renderPreview()}
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="relative rounded-3xl overflow-hidden bg-[#0A1929] border border-white/10 p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <FileBadge size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-primary-300 text-sm font-semibold mb-4">
            <ShieldCheck size={16} /> E-Devlet Kapısı Entegreli
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Resmî Belgeleriniz <br/>
            <span className="text-primary-400">Tek Tıkla Elinizde.</span>
          </h1>
          <p className="text-lg text-slate-400">
            Belediye binasına gitmeden barkodlu ve e-imzalı resmî evraklarınızı saniyeler içinde oluşturun, 
            yazdırın veya PDF olarak kurumlarla paylaşın.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DOCUMENTS.map((doc) => {
          const Icon = doc.icon
          const isGenerating = generatingId === doc.id
          
          return (
            <div key={doc.id} className={`bg-slate-900 border ${doc.borderColor} rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50 hover:-translate-y-1 relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full pointer-events-none"></div>
              
              <div className="flex gap-5">
                <div className={`w-14 h-14 rounded-xl ${doc.bg} ${doc.color} flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{doc.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {doc.desc}
                  </p>
                  
                  <button 
                    onClick={() => handleGenerate(doc)}
                    disabled={generatingId !== null}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-primary/20 hover:text-primary-400 border border-white/10 hover:border-primary/30 text-white font-medium transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                        Belge Hazırlanıyor...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Belgeyi Oluştur
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-2xl p-6 flex items-start gap-4">
        <CheckCircle className="text-emerald-500 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-emerald-400 mb-1">Güvenli ve Geçerli</h4>
          <p className="text-emerald-100/70 text-sm">
            Buradan oluşturacağınız belgeler 5070 sayılı Elektronik İmza Kanunu kapsamında üretilmekte olup, 
            üzerindeki barkod ve doğrulama kodları ile tüm resmî kurumlarda geçerlidir.
          </p>
        </div>
      </div>

    </div>
    </>
  )
}
