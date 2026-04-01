"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  FileCheck2,
  CalendarDays,
  CheckSquare,
  Settings,
  UserCircle,
  Menu,
  X
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Diário de Estudos", href: "/diario", icon: BookOpen },
  { label: "Evolução", href: "/dashboard", icon: LayoutDashboard },
  { label: "Simulados", href: "/simulados", icon: FileCheck2 },
  { label: "KevQuest", href: "/kevquest", icon: Target },
  { label: "Calendário", href: "/calendario", icon: CalendarDays },
  { label: "Tarefas", href: "/tarefas", icon: CheckSquare },
  { label: "Perfil", href: "/perfil", icon: UserCircle },
];

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fecha no mobile ao trocar de rota (clicar num link do menu)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const SidebarContent = () => (
    <>
      {/* Toggle Button & Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-10 text-teal-600`}>
        {!isCollapsed && (
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif text-teal-600 tracking-wide leading-none px-2">SINAPSE</h1>
            <p className="text-[10px] uppercase font-semibold text-teal-500 tracking-[0.15em] px-2 mt-1">MENTORIA</p>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden md:block"
        >
          <Menu className="w-6 h-6 text-slate-500" />
        </button>
      </div>

      {/* Links Principais */}
      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group ${isActive
                  ? "bg-teal-50 text-teal-700 font-medium shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-teal-600" : "text-slate-400"
                  }`}
              />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Configurações (Afixado no Bottom) */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        <Link
          href="/configuracoes"
          title={isCollapsed ? "Configurações" : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-200 group ${pathname === "/configuracoes"
              ? "bg-teal-50 text-teal-700 font-medium shadow-sm"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
        >
          <Settings
            className={`w-5 h-5 transition-transform group-hover:scale-110 ${pathname === "/configuracoes" ? "text-teal-600" : "text-slate-400"
              }`}
          />
          {!isCollapsed && <span className="text-sm font-medium">Configurações</span>}
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      
      {/* Top Bar Fixa (Somente Mobile) */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-white border-b border-slate-200 flex items-center px-4 z-40 shadow-sm gap-3">
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-xl font-serif text-teal-600 tracking-wide leading-none">SINAPSE</h1>
          <p className="text-[8px] uppercase font-semibold text-teal-500 tracking-[0.15em] mt-0.5">MENTORIA</p>
        </div>
      </div>

      {/* Fundo Escuro do Mobile Drawer */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Mobile (Off-canvas Drawer) */}
      <aside 
        className={`md:hidden fixed top-0 bottom-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } p-6 flex flex-col shadow-2xl`}
      >
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* Sidebar Desktop (Original intacto) */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20 p-4' : 'w-64 p-6'} bg-white border-r border-slate-100 fixed h-full z-10 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
        <SidebarContent />
      </aside>

      {/* Área Principal (Alinhada verticalmente com o p-6 da Sidebar no Desktop) */}
      <main className={`flex-1 w-full pt-20 md:pt-6 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} px-4 pb-4 md:px-10 md:pb-10 transition-all duration-300 min-h-screen relative overflow-x-hidden`}>
        {children}
      </main>
    </div>
  );
}
