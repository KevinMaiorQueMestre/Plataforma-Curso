"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Target,
  FileCheck2,
  CalendarDays,
  CheckSquare,
  Settings,
  UserCircle,
  Menu
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

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col ${isCollapsed ? 'w-20 p-4' : 'w-64 p-6'} bg-white border-r border-slate-100 fixed h-full z-10 transition-all duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.02)]`}>
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
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
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
            {!isCollapsed && <span className="text-sm">Configurações</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 ml-0 ${isCollapsed ? 'md:ml-20' : 'md:ml-64'} p-6 md:p-10 transition-all duration-300 min-h-screen relative overflow-x-hidden`}>
        {children}
      </main>
    </div>
  );
}
