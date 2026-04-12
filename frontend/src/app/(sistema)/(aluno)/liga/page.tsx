"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { Trophy, Flame, Clock, Target, Star, Loader2 } from "lucide-react";
import { getTopRanking, getMeuRanking } from "@/lib/db/liga";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Liga = "bronze" | "prata" | "ouro" | "diamante";

interface Aluno {
  nome: string;
  avatar: string;
  questoes: number;
  diasAtivos: number;
  horas: number;
  liga: Liga;
  pontos: number;
  rank: number;
}

// ─── Configurações de Liga ────────────────────────────────────────────────────

const LIGA_CONFIG: Record<Liga, { label: string; cor: string; bg: string; border: string; icon: string; min: number; max: number | null }> = {
  bronze:   { label: "Bronze",   cor: "text-amber-700",   bg: "bg-amber-50 dark:bg-amber-900/20",   border: "border-amber-300 dark:border-amber-700",   icon: "🥉", min: 0,    max: 999  },
  prata:    { label: "Prata",    cor: "text-slate-500",   bg: "bg-slate-100 dark:bg-slate-700/30",  border: "border-slate-300 dark:border-slate-600",   icon: "🥈", min: 1000, max: 2499 },
  ouro:     { label: "Ouro",     cor: "text-yellow-600",  bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-300 dark:border-yellow-600",  icon: "🥇", min: 2500, max: 4999 },
  diamante: { label: "Diamante", cor: "text-cyan-500",    bg: "bg-cyan-50 dark:bg-cyan-900/20",     border: "border-cyan-300 dark:border-cyan-600",      icon: "💎", min: 5000, max: null },
};

const COR_BARRA: Record<Liga, string> = {
  bronze:   "#B45309",
  prata:    "#94A3B8",
  ouro:     "#CA8A04",
  diamante: "#06B6D4",
};

// ─── Utilitários ─────────────────────────────────────────────────────────────

function formatarHoras(h: number) { return `${h}h`; }
function formatarMinutos(v: number) { return `${v}h`; }

// ─── Badge de Liga ────────────────────────────────────────────────────────────

function LigaBadge({ liga, size = "sm" }: { liga: Liga; size?: "sm" | "lg" }) {
  const cfg = LIGA_CONFIG[liga];
  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border
      ${cfg.bg} ${cfg.cor} ${cfg.border}
      ${size === "lg" ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs"}`}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Tooltip customizado dos rankings ────────────────────────────────────────

function TooltipRanking({ active, payload, label, unidade }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-[#2C2C2E] rounded-2xl px-4 py-3 shadow-xl">
      <p className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-800 dark:text-white">
        {payload[0].value}{unidade}
      </p>
    </div>
  );
}

// ─── Card de Ranking ──────────────────────────────────────────────────────────

type RankItemType = { nome: string; valor: number; liga: Liga };

function RankingCard({
  titulo,
  icone,
  dados,
  unidade,
  corIcone,
  bgIcone,
  labelEixo,
}: {
  titulo: string;
  icone: React.ReactNode;
  dados: RankItemType[];
  unidade: string;
  corIcone: string;
  bgIcone: string;
  labelEixo?: (v: number) => string;
}) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-2xl ${bgIcone}`}>{icone}</div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">{titulo}</h3>
          <p className="text-xs text-slate-400 dark:text-[#A1A1AA]">Top 10 da plataforma</p>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={dados}
            margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3" horizontal={false} stroke="#E2E8F040" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94A3B8", fontSize: 11 }}
              tickFormatter={labelEixo ?? ((v) => `${v}${unidade}`)}
            />
            <YAxis
              type="category"
              dataKey="nome"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12, fontWeight: 600 }}
              width={80}
            />
            <Tooltip
              content={<TooltipRanking unidade={unidade} />}
              cursor={{ fill: "rgba(148,163,184,0.08)" }}
            />
            <Bar dataKey="valor" radius={[0, 6, 6, 0]} maxBarSize={22}>
              {dados.map((entry, index) => (
                <Cell
                  key={index}
                  fill={COR_BARRA[entry.liga]}
                  opacity={entry.nome === "Você" ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-[#2C2C2E]">
        {(Object.keys(LIGA_CONFIG) as Liga[]).map((l) => (
          <LigaBadge key={l} liga={l} />
        ))}
      </div>
    </div>
  );
}

// ─── Card de Liga do Usuário ──────────────────────────────────────────────────

function MeuCartaoLiga({ aluno }: { aluno: Aluno }) {
  const cfg = LIGA_CONFIG[aluno.liga];
  const proximaLiga = aluno.liga === "ouro" ? LIGA_CONFIG["diamante"] : null;
  const pontosProxima = proximaLiga ? proximaLiga.min : null;
  const progresso = pontosProxima
    ? Math.min(100, Math.round(((aluno.pontos - cfg.min) / (pontosProxima - cfg.min)) * 100))
    : 100;

  return (
    <div className={`rounded-3xl p-6 border-2 ${cfg.border} ${cfg.bg} relative overflow-hidden`}>
      <div className="absolute -top-8 -right-8 text-[120px] opacity-10 select-none pointer-events-none">
        {cfg.icon}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black ${cfg.bg} border-2 ${cfg.border} shadow-md`}>
            {cfg.icon}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider mb-1">Sua Liga</p>
            <h2 className={`text-2xl font-black ${cfg.cor}`}>{cfg.label}</h2>
            <p className="text-sm text-slate-500 dark:text-[#A1A1AA] mt-0.5">
              {Math.floor(aluno.pontos).toLocaleString("pt-BR")} pts · <span className="font-bold text-slate-700 dark:text-white">#{aluno.rank}° lugar</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Questões", valor: aluno.questoes.toLocaleString("pt-BR"), icon: <Target className="w-4 h-4" /> },
            { label: "Dias Ativos", valor: aluno.diasAtivos, icon: <Flame className="w-4 h-4" /> },
            { label: "Horas", valor: formatarHoras(aluno.horas), icon: <Clock className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/60 dark:bg-black/20 rounded-2xl px-3 py-3">
              <div className={`flex justify-center mb-1 ${cfg.cor}`}>{stat.icon}</div>
              <p className="text-lg font-black text-slate-800 dark:text-white">{stat.valor}</p>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {pontosProxima && (
        <div className="mt-6 relative z-10">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-2">
            <span>{cfg.icon} {cfg.label}</span>
            <span>{Math.floor(aluno.pontos).toLocaleString("pt-BR")} / {pontosProxima.toLocaleString("pt-BR")} pts</span>
            <span>💎 Diamante</span>
          </div>
          <div className="w-full h-2.5 bg-white/40 dark:bg-black/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${cfg.cor.replace("text-", "bg-")}`}
              style={{ width: `${progresso}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-1.5 text-right">
            Faltam <span className="font-bold">{Math.floor(pontosProxima - aluno.pontos).toLocaleString("pt-BR")} pts</span> para Diamante
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Escada de Ligas ──────────────────────────────────────────────────────────

function EscadaLigas({ minhaLiga }: { minhaLiga: Liga }) {
  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-[#2C2C2E]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-2xl bg-yellow-50 dark:bg-yellow-500/10">
          <Star className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Sistema de Ligas</h3>
          <p className="text-xs text-slate-400 dark:text-[#A1A1AA]">Acumule pontos e suba de divisão</p>
        </div>
      </div>
      <div className="space-y-3">
        {(Object.entries(LIGA_CONFIG) as [Liga, typeof LIGA_CONFIG[Liga]][]).reverse().map(([key, cfg]) => (
          <div
            key={key}
            className={`flex items-center justify-between p-4 rounded-2xl border ${cfg.bg} ${cfg.border}
              ${key === minhaLiga ? "ring-2 ring-offset-2 ring-yellow-400 dark:ring-offset-[#1C1C1E]" : ""}
            `}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cfg.icon}</span>
              <div>
                <p className={`font-bold ${cfg.cor}`}>{cfg.label}</p>
                <p className="text-xs text-slate-500 dark:text-[#A1A1AA]">
                  {cfg.max
                    ? `${cfg.min.toLocaleString("pt-BR")} – ${cfg.max.toLocaleString("pt-BR")} pts`
                    : `${cfg.min.toLocaleString("pt-BR")}+ pts`}
                </p>
              </div>
            </div>
            {key === minhaLiga && (
              <span className="text-xs font-black bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full">
                Você está aqui
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

type RankTab = "questoes" | "dias" | "horas";

export default function LigaPage() {
  const [activeTab, setActiveTab] = useState<RankTab>("questoes");
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [usuarioAtual, setUsuarioAtual] = useState<Aluno | null>(null);
  const [topQuestoes, setTopQuestoes] = useState<RankItemType[]>([]);
  const [topDias, setTopDias] = useState<RankItemType[]>([]);
  const [topHoras, setTopHoras] = useState<RankItemType[]>([]);

  useEffect(() => {
    async function carregarDados() {
      const [meu, qt, dias, horas] = await Promise.all([
        getMeuRanking(),
        getTopRanking("total_questoes"),
        getTopRanking("dias_ativos"),
        getTopRanking("duracao_segundos")
      ]);

      if (meu) {
        setUsuarioAtual({
          nome: meu.nome,
          avatar: meu.avatar_url || "V",
          questoes: meu.total_questoes,
          diasAtivos: meu.dias_ativos,
          horas: Math.floor(meu.duracao_segundos / 3600),
          liga: meu.liga,
          pontos: meu.pontos,
          rank: meu.rank
        });
      }

      setTopQuestoes(qt.map(x => ({ nome: x.nome, valor: x.total_questoes, liga: x.liga })));
      setTopDias(dias.map(x => ({ nome: x.nome, valor: x.dias_ativos, liga: x.liga })));
      setTopHoras(horas.map(x => ({ nome: x.nome, valor: Math.floor(x.duracao_segundos / 3600), liga: x.liga })));

      setIsLoaded(true);
    }
    carregarDados();
  }, []);

  const TABS: { key: RankTab; label: string; icon: React.ReactNode }[] = [
    { key: "questoes", label: "Mais Questões",    icon: <Target className="w-4 h-4" /> },
    { key: "dias",     label: "Dias em Sequência",icon: <Flame  className="w-4 h-4" /> },
    { key: "horas",    label: "Mais Horas",       icon: <Clock  className="w-4 h-4" /> },
  ];

  if (!isLoaded || !usuarioAtual) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  const RANKING_DATA: Record<RankTab, { dados: RankItemType[]; titulo: string; unidade: string; icone: React.ReactNode; corIcone: string; bgIcone: string; labelEixo?: (v: number) => string }> = {
    questoes: {
      dados: topQuestoes,
      titulo: "Mais Questões Lançadas",
      unidade: " q",
      icone: <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      corIcone: "text-teal-600",
      bgIcone: "bg-teal-50 dark:bg-teal-500/10",
    },
    dias: {
      dados: topDias,
      titulo: "Mais Dias Ativos Seguidos",
      unidade: " dias",
      icone: <Flame className="w-5 h-5 text-orange-500" />,
      corIcone: "text-orange-500",
      bgIcone: "bg-orange-50 dark:bg-orange-500/10",
    },
    horas: {
      dados: topHoras,
      titulo: "Mais Horas Contabilizadas",
      unidade: "h",
      icone: <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
      corIcone: "text-indigo-500",
      bgIcone: "bg-indigo-50 dark:bg-indigo-500/10",
      labelEixo: formatarMinutos,
    },
  };

  const tab = RANKING_DATA[activeTab];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Liga</h1>
          </div>
          <p className="text-slate-500 dark:text-[#A1A1AA]">
            Dispute com outros alunos e suba de divisão.
          </p>
        </div>
        <LigaBadge liga={usuarioAtual.liga} size="lg" />
      </header>

      <MeuCartaoLiga aluno={usuarioAtual} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <EscadaLigas minhaLiga={usuarioAtual.liga} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex gap-2 bg-white dark:bg-[#1C1C1E] p-1.5 rounded-2xl border border-slate-100 dark:border-[#2C2C2E] shadow-sm">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200
                  ${activeTab === t.key
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-500 dark:text-[#A1A1AA] hover:text-slate-700 dark:hover:text-white"
                  }`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <RankingCard
            titulo={tab.titulo}
            icone={tab.icone}
            dados={tab.dados}
            unidade={tab.unidade}
            corIcone={tab.corIcone}
            bgIcone={tab.bgIcone}
            labelEixo={tab.labelEixo}
          />
        </div>
      </div>
    </div>
  );
}
