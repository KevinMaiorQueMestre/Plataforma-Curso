'use client';

import { useState, useRef, useEffect } from 'react';
import { ListFilter, ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// FilterColumn é APENAS para filtro. Colunas com filtro NÃO têm sort.
// Para colunas só com sort, use o botão toggleSort diretamente (Seção 16 da skill).
interface FilterColumnProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  dropdownWidth?: string;
  align?: 'left' | 'center';
}

export function FilterColumn({
  label,
  value,
  onChange,
  options,
  dropdownWidth = 'min-w-[150px]',
  align = 'left',
}: FilterColumnProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isFiltered = value !== 'all' && value !== '';
  const activeLabel = options.find(o => o.value === value)?.label;

  // Fecha ao clicar fora
  useEffect(() => {
    if (!filterOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-1.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}
    >
      {/* Label da coluna (sem sort) */}
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </span>

      {/* Ícone de funil */}
      <button
        onClick={() => setFilterOpen(prev => !prev)}
        title={isFiltered ? `Filtro ativo: ${activeLabel}` : 'Filtrar'}
        className={`p-1 rounded-md transition-all flex-shrink-0 ${
          isFiltered
            ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
            : 'text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400'
        }`}
      >
        <ListFilter className="w-3.5 h-3.5" />
      </button>

      {/* Ponto indicador de filtro ativo */}
      {isFiltered && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"
          title={activeLabel}
        />
      )}

      {/* Dropdown de filtro */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 mt-1.5 z-50 bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl shadow-xl overflow-hidden ${dropdownWidth}`}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setFilterOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-sm font-bold transition-all ${
                  value === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
