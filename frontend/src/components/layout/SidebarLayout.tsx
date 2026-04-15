"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  FileCheck2,
  CalendarDays,
  CheckSquare,
  Settings,
  Menu,
  X,
  ArrowLeft,
  Trophy,
  Home,
  PenTool,
  Users,
  LogOut
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",              href: "/home",      icon: Home         },
  { label: "Diário",            href: "/diario",    icon: BookOpen      },
  { label: "Simulados",         href: "/simulados", icon: FileCheck2  },
  { label: "Redação",           href: "/redacao",   icon: PenTool     },
  { label: "KevQuest",          href: "/kevquest",  icon: Target      },
  { label: "Calendário",        href: "/calendario",icon: CalendarDays },
  { label: "Tarefas",           href: "/tarefas",   icon: CheckSquare },
  { label: "Liga",              href: "/liga",      icon: Trophy      },
];

// Itens que aparecem na Bottom Nav (os 5 mais usados)
const BOTTOM_NAV_ITEMS = [
  { label: "Home",      href: "/home",      icon: Home      },
  { label: "Diário",   href: "/diario",    icon: BookOpen  },
  { label: "Simulados", href: "/simulados", icon: FileCheck2 },
  { label: "KevQuest",  href: "/kevquest",  icon: Target    },
  { label: "Liga",      href: "/liga",      icon: Trophy    },
];

const ADMIN_NAV_ITEMS = [
  { label: "Home",              href: "/admin",            icon: LayoutDashboard },
  { label: "Gestão",            href: "/admin/alunos",     icon: Users },
  { label: "Calendário Global", href: "/admin/calendario", icon: CalendarDays },
  { label: "Redação",           href: "/admin/redacao",    icon: PenTool },
];

const ADMIN_BOTTOM_NAV_ITEMS = [
  { label: "Home",       href: "/admin",            icon: LayoutDashboard },
  { label: "Gestão",     href: "/admin/alunos",     icon: Users },
  { label: "Calendário", href: "/admin/calendario", icon: CalendarDays },
  { label: "Redação",    href: "/admin/redacao",    icon: PenTool },
];

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fecha no mobile ao trocar de rota (clicar num link do menu)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Lê a role diretamente do Supabase — nunca do localStorage (segurança)
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') setIsAdmin(true);
    };
    fetchRole();
  }, []);

  const displayedItems = isAdmin ? ADMIN_NAV_ITEMS : NAV_ITEMS;
  const bottomNavItems = isAdmin ? ADMIN_BOTTOM_NAV_ITEMS : BOTTOM_NAV_ITEMS;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Toggle Button & Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-10 text-teal-600 dark:text-teal-400`}>
        {!isCollapsed && (
          <Link href={isAdmin ? "/admin" : "/home"} className="flex flex-col hover:opacity-80 transition-opacity">
            <h1 className="text-3xl font-serif text-teal-600 dark:text-teal-400 tracking-wide leading-none px-2">{isAdmin ? "PAINEL" : "METAUTO"}</h1>
            <p className="text-[10px] uppercase font-semibold text-teal-500 tracking-[0.15em] px-2 mt-1">{isAdmin ? "ADMINISTRADOR" : "ALL-IN-ONE"}</p>
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden md:block"
        >
          <Menu className="w-6 h-6 text-slate-500 dark:text-[#A1A1AA]" />
        </button>
      </div>

      {/* Links Principais */}
      <nav className="flex-1 space-y-2">
        {displayedItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group ${isActive
                  ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium shadow-sm"
                  : "text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] hover:text-slate-800 dark:hover:text-[#FFFFFF]"
                }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
                  }`}
              />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area (Voltar ao Hub & Configurações) */}
      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-[#2C2C2E] space-y-2">
        {!isAdmin && (
          <Link
            href="/hub"
            title={isCollapsed ? "Voltar ao Hub" : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] hover:text-slate-800 dark:text-[#FFFFFF] dark:hover:text-slate-200`}
          >
            <ArrowLeft
              className="w-5 h-5 transition-transform group-hover:-translate-x-1"
            />
            {!isCollapsed && <span className="text-sm font-medium">Voltar ao Hub</span>}
          </Link>
        )}
        <Link
          href={isAdmin ? "/admin/configuracoes" : "/configuracoes"}
          title={isCollapsed ? "Configurações" : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group ${(pathname === "/configuracoes" || pathname === "/admin/configuracoes")
              ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium shadow-sm"
              : "text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#2C2C2E] hover:text-slate-800 dark:text-[#FFFFFF] dark:hover:text-slate-200"
            }`}
        >
          <Settings
            className={`w-5 h-5 transition-transform group-hover:scale-110 ${(pathname === "/configuracoes" || pathname === "/admin/configuracoes") ? "text-teal-600 dark:text-teal-400" : "text-slate-400 dark:text-[#71717A]"
              }`}
          />
          {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={isCollapsed ? "Sair da Conta" : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group text-slate-500 dark:text-[#A1A1AA] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400`}
        >
          <LogOut
            className="w-5 h-5 transition-transform group-hover:scale-110 group-hover:text-red-600"
          />
          {!isCollapsed && <span className="text-sm font-medium">Sair da Conta</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#121212] transition-colors duration-300 font-sans">
      
      {/* Top Bar Fixa (Somente Mobile) */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-white dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-[#2C2C2E] flex items-center px-4 z-40 shadow-sm gap-3 transition-colors duration-300">
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="p-2 -ml-2 text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href={isAdmin ? "/admin" : "/home"} className="flex flex-col hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-serif text-teal-600 dark:text-teal-400 tracking-wide leading-none transition-colors">{isAdmin ? "PAINEL" : "METAUTO"}</h1>
          <p className="text-[8px] uppercase font-semibold text-teal-500 tracking-[0.2em] transition-colors">{isAdmin ? "ADMINISTRADOR" : "ALL-IN-ONE"}</p>
        </Link>
      </div>

      {/* Fundo Escuro do Mobile Drawer */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 dark:bg-black/60 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile (Off-canvas Drawer) */}
      <aside 
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-[#1C1C1E] border-r border-slate-200 dark:border-[#2C2C2E] z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } p-6 flex flex-col shadow-2xl overflow-y-auto scrollbar-hide`}
      >
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 dark:text-[#71717A] hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-[#2C2C2E] rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop (Original intacto) */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20 p-4' : 'w-64 p-6'} bg-white dark:bg-[#1C1C1E] border-r border-slate-100 dark:border-[#2C2C2E] fixed h-full z-10 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto scrollbar-hide`}>
        <SidebarContent />
      </aside>

      {/* Área Principal — pb-28 em mobile para não ficar atrás da bottom nav */}
      <main className={`flex-1 w-full pt-20 md:pt-6 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} px-4 pb-28 md:pb-10 md:px-10 transition-all duration-300 min-h-screen relative overflow-x-hidden text-slate-800 dark:text-[#F4F4F5]`}>
        {children}
      </main>

      {/* ─── BOTTOM NAVIGATION BAR (Somente Mobile) ─────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-slate-200 dark:border-[#2C2C2E] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch h-16 px-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-slate-400 dark:text-[#71717A]"
                }`}
              >
                <div className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-teal-50 dark:bg-teal-900/30"
                    : ""
                }`}>
                  <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? "scale-110" : ""}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-500" />
                  )}
                </div>
                <span className={`text-[9px] font-bold tracking-wide transition-all duration-200 leading-none ${
                  isActive ? "text-teal-600 dark:text-teal-400" : "text-slate-400"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Botão "Mais" para abrir o drawer com todos os itens */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 active:scale-95 text-slate-400 dark:text-[#71717A]"
          >
            <div className="flex items-center justify-center w-10 h-7 rounded-xl">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold tracking-wide leading-none text-slate-400">Mais</span>
          </button>
        </div>

        {/* Safe area para iPhone com home indicator */}
        <div className="h-safe-area-inset-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
    </div>
  );
}
