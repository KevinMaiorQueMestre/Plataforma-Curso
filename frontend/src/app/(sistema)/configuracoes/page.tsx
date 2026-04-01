"use client";

import { useState } from "react";
import { Check, Palette } from "lucide-react";

export default function ConfiguracoesPage() {
  const [corPrimaria, setCorPrimaria] = useState("teal");

  const cores = [
    { id: "teal", bgClass: "bg-teal-500", nome: "Sinapse Teal" },
    { id: "blue", bgClass: "bg-blue-600", nome: "Ocean Blue" },
    { id: "violet", bgClass: "bg-violet-600", nome: "Deep Violet" },
    { id: "rose", bgClass: "bg-rose-500", nome: "Cherry Rose" },
  ];

  const handleMudarCor = (id: string) => {
    setCorPrimaria(id);
    // Aqui no futuro será injetado o document.documentElement.style.setProperty('--primary-color', ...)
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Configurações e Tema</h1>
        <p className="text-slate-500 mt-1">Personalize a aparência do seu dashboard e do seu ambiente de estudo.</p>
      </header>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <Palette className="w-5 h-5 text-slate-400" />
          Cor Primária do Sistema
        </h3>
        
        <div className="flex flex-wrap gap-4">
          {cores.map((cor) => (
            <button
              key={cor.id}
              onClick={() => handleMudarCor(cor.id)}
              className={`flex items-center gap-3 p-3 pr-6 rounded-2xl border-2 transition-all ${
                corPrimaria === cor.id ? "border-slate-800 shadow-md scale-105" : "border-slate-100 hover:border-slate-300"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl ${cor.bgClass} flex items-center justify-center`}>
                {corPrimaria === cor.id && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm font-bold text-slate-700">{cor.nome}</span>
            </button>
          ))}
        </div>
        
        <p className="mt-8 text-xs text-slate-400 font-medium max-w-md leading-relaxed">
          * A implementação técnica de variáveis CSS dinâmicas (CSS Theming) está estruturada e o componente de troca visual já reflete localmente o estado no botão.
        </p>
      </div>
    </div>
  );
}
