'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Building2, Home, AlertCircle, Map, BarChart3, MessageSquare,
  Megaphone, User, LogOut, Sun, Moon, Globe, Menu
} from 'lucide-react';
import { useAuthStore } from '@/store';
import toast from 'react-hot-toast';

const citizenNav = [
  { href: '/',               icon: Globe,         label: 'Keşif' },
  { href: '/dashboard',      icon: Home,          label: 'Ana Sayfa' },
  { href: '/complaints',     icon: AlertCircle,   label: 'Şikayetlerim' },
  { href: '/complaints/new', icon: AlertCircle,   label: 'Şikayet Oluştur' },
  { href: '/map',            icon: Map,           label: 'Harita' },
  { href: '/polls',          icon: BarChart3,     label: 'Anketler' },
  { href: '/announcements',  icon: Megaphone,     label: 'Duyurular' },
  { href: '/chat',           icon: MessageSquare, label: 'Destek Chat' },
  { href: '/profile',        icon: User,          label: 'Profilim' },
];

interface Props { open: boolean; onToggle: () => void; }

export default function CitizenSidebar({ open, onToggle }: Props) {
  const pathname            = usePathname();
  const router              = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout }    = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Çıkış yapıldı');
    router.push('/login');
  };

  const row = `flex items-center gap-4 rounded-xl px-[14px] py-[11px] w-full transition-all duration-200 overflow-hidden`;
  const ico = `shrink-0 w-5 h-5`;

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col
                  bg-gradient-to-b from-[#0b3830] via-[#0d4a3e] to-[#152040]
                  border-r border-white/[0.06] shadow-[4px_0_24px_rgba(0,0,0,0.35)]
                  transition-[width] duration-300 ease-in-out overflow-hidden
                  ${open ? 'w-64' : 'w-[64px]'}`}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 10% 90%, rgba(16,185,129,0.06) 0%, transparent 60%)' }} />

      <div className="relative z-10 flex flex-col h-full overflow-y-auto overflow-x-hidden px-2 py-3 gap-0.5">

        {/* ☰ Hamburger */}
        <button onClick={onToggle} aria-label="Menüyü aç / kapat"
          className={`${row} text-white/50 hover:text-white hover:bg-white/[0.07]`}>
          <Menu className={ico} />
        </button>

        {/* e-Belediyem */}
        <Link href="/dashboard" title={!open ? 'Ana Sayfa' : undefined}
          className={`${row} text-white/70 hover:text-white hover:bg-white/[0.07]`}>
          <div className="w-5 h-5 rounded-lg bg-emerald-500/25 border border-emerald-400/25
                          flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          {open && (
            <span className="text-[18px] font-black tracking-tight whitespace-nowrap">
              e-<span className="text-emerald-400">Belediyem</span>
            </span>
          )}
        </Link>

        {/* Municipality badge */}
        {open && user?.municipality_name && (
          <div className="flex items-center gap-3 px-[14px] py-[8px] rounded-xl
                          bg-white/[0.05] border border-white/[0.07] mb-1">
            {user.municipality_logo_url
              ? <img src={user.municipality_logo_url} alt="" className="w-5 h-5 object-contain rounded shrink-0" />
              : <div className="w-5 h-5 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 text-emerald-400" />
                </div>
            }
            <span className="text-[13px] font-semibold text-emerald-300 truncate">{user.municipality_name}</span>
          </div>
        )}
        {!open && user?.municipality_logo_url && (
          <div className="px-[14px] py-[5px]">
            <img src={user.municipality_logo_url} alt="" title={user.municipality_name ?? ''}
              className="w-5 h-5 object-contain rounded" />
          </div>
        )}

        <div className="h-px bg-white/[0.06] my-1" />

        {/* Nav */}
        {citizenNav.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' :
            pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} title={!open ? label : undefined}
              className={`${row} relative
                ${active ? 'bg-emerald-500/20 text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.07]'}`}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-emerald-400" />}
              <Icon className={`${ico} ${active ? 'text-emerald-400' : 'text-white/50'}`} />
              {open && <span className="text-[15px] font-semibold whitespace-nowrap flex-1">{label}</span>}
            </Link>
          );
        })}

        <div className="flex-1" />
        <div className="h-px bg-white/[0.06] my-1" />

        {/* Tema */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={!open ? (theme === 'dark' ? 'Açık Tema' : 'Koyu Tema') : undefined}
          className={`${row} text-white/50 hover:text-white hover:bg-white/[0.07]`}>
          {theme === 'dark'
            ? <Sun  className={`${ico} text-amber-400`} />
            : <Moon className={`${ico} text-blue-400`} />}
          {open && <span className="text-[15px] font-semibold whitespace-nowrap">
            {theme === 'dark' ? 'Açık Tema' : 'Koyu Tema'}</span>}
        </button>

        {/* Kullanıcı */}
        <div className={`flex items-center gap-4 rounded-xl py-[11px] w-full transition-all duration-200 overflow-hidden bg-white/[0.05] border border-white/[0.07] ${open ? 'px-[14px]' : 'px-0 justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-emerald-500/25 border border-emerald-400/30
                          flex items-center justify-center text-emerald-300 font-black text-[12px] shrink-0">
            {user?.full_name?.charAt(0) ?? 'V'}
          </div>
          {open && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-white leading-tight truncate">{user?.full_name}</p>
                <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Vatandaş</p>
              </div>
              <button onClick={handleLogout} title="Çıkış yap"
                className="p-1.5 rounded-lg hover:bg-red-500/15 group transition-all shrink-0">
                <LogOut className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
