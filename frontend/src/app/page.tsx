"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, BookOpen, Target, Sparkles, LayoutDashboard, BrainCircuit, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const CAROUSEL_DATA = [
  {
    name: "João Silva",
    course: "Medicina USP",
    quote: "A metodologia da Sinapse foi essencial para a minha aprovação em tempo recorde. O diário de estudos mudou meu jogo.",
  },
  {
    name: "Mariana Costa",
    course: "Engenharia de Computação",
    quote: "Os simulados direcionados me deram a confiança que eu precisava no dia da prova. Recomendo de olhos fechados!",
  },
  {
    name: "Pedro Nunes",
    course: "Direito UnB",
    quote: "Ver meu progresso nos dashboards visuais me impediu de desistir. O sistema é simplesmente sensacional.",
  }
];

function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_DATA.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + CAROUSEL_DATA.length) % CAROUSEL_DATA.length);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % CAROUSEL_DATA.length);

  const current = CAROUSEL_DATA[currentIndex];

  return (
    <div className="relative w-full h-[90vh] min-h-[600px] bg-[#0E172A] text-white flex items-center justify-center overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center gap-12 z-10 pt-16">
        
        {/* Left: Text */}
        <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 fade-in duration-700" key={`text-${currentIndex}`}>
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-teal-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            Aprovados Sinapse
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] font-sans">
            <span className="block text-slate-100">{current.course}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 font-serif italic pr-2">
              {current.name}
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-xl font-light leading-relaxed">
            "{current.quote}"
          </p>
          
          <div className="pt-4">
            <Link 
              href="/login"
              className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-transparent border-2 border-slate-600 hover:border-teal-500 text-slate-200 hover:text-white px-8 py-3.5 text-base font-bold transition-all duration-300"
            >
              Saiba mais
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right: Image / Visual */}
        <div className="flex-1 w-full flex justify-center md:justify-end animate-in slide-in-from-right-8 fade-in duration-700" key={`img-${currentIndex}`}>
           <div className="relative w-72 h-72 md:w-[400px] md:h-[400px] rounded-[3rem] bg-gradient-to-tr from-slate-800 to-slate-700 border-4 border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden group rotate-3 hover:rotate-0 transition-all duration-500">
              <div className="absolute inset-0 bg-slate-900/40 group-hover:scale-105 transition-transform duration-700"></div>
              <Target className="w-24 h-24 text-teal-500/30 group-hover:text-teal-400/50 transition-colors duration-500" />
           </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button onClick={handlePrev} className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm z-20">
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button onClick={handleNext} className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm z-20">
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {CAROUSEL_DATA.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${currentIndex === idx ? 'w-8 h-2.5 bg-teal-400' : 'w-2.5 h-2.5 bg-slate-600 hover:bg-slate-400'}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-200 selection:text-teal-900 overflow-hidden">
      
      {/* Navbar (Glassmorphism) */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/50 support-[backdrop-filter]:bg-white/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer group">
            <h1 className="text-2xl font-serif text-teal-700 tracking-wide leading-none font-bold group-hover:text-teal-600 transition-colors">
              SINAPSE
            </h1>
            <p className="text-[9px] uppercase font-bold text-teal-500 tracking-[0.2em] mt-0.5 group-hover:text-teal-400 transition-colors">
              Mentoria
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/login"
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              <span>Acesse o sistema</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full">
        <HeroCarousel />
      </main>

      {/* 1. Logo Banner (Infinite Scroll) */}
      <section className="w-full bg-white py-10 border-b border-slate-100 overflow-hidden relative flex flex-col items-center justify-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Nossos alunos são aprovados em</p>
        <div className="w-full max-w-7xl mx-auto overflow-hidden relative flex">
          {/* Gradient masks for smooth fade on edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-marquee whitespace-nowrap items-center hover:[animation-play-state:paused] w-max">
            {/* Array is repeated to ensure fluid infinite scroll */}
            {[...Array(2)].fill(0).map((_, i) => (
              <div key={i} className="flex gap-16 md:gap-28 items-center pl-16 md:pl-28">
                <span className="text-3xl font-black text-slate-300">USP</span>
                <span className="text-3xl font-black text-slate-300">Unicamp</span>
                <span className="text-3xl font-black text-slate-300">UnB</span>
                <span className="text-3xl font-black text-slate-300">UFRJ</span>
                <span className="text-3xl font-black text-slate-300">UFMG</span>
                <span className="text-3xl font-black text-slate-300">Unesp</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Metodologia Sinapse (ZigZag) */}
      <section className="w-full bg-slate-50 py-24 border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight font-serif mb-4">Como funciona o método?</h2>
            <p className="text-lg text-slate-500">Desenvolvemos uma engenharia de aprovação em pilares fundamentais.</p>
          </motion.div>

          <div className="space-y-24">
            {/* Passo 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="flex flex-col md:flex-row items-center gap-12 group"
            >
              <div className="flex-1 space-y-4">
                <span className="text-teal-600 font-bold text-xs uppercase tracking-widest block bg-teal-100 w-max px-3 py-1 rounded-full">Passo 1</span>
                <h3 className="text-2xl md:text-4xl font-bold text-slate-800">Diagnóstico Cirúrgico</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Use nossos simulados com métricas espelhadas na prova real (KevQuest) para entender com exatidão onde você está perdendo pontos valiosos.</p>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-gradient-to-br from-indigo-50 to-teal-50 flex items-center justify-center border border-slate-200 shadow-xl group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                   <Target className="w-24 h-24 text-teal-600 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
                </div>
              </div>
            </motion.div>

            {/* Passo 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="flex flex-col md:flex-row-reverse items-center gap-12 group"
            >
              <div className="flex-1 space-y-4">
                <span className="text-indigo-600 font-bold text-xs uppercase tracking-widest block bg-indigo-100 w-max px-3 py-1 rounded-full">Passo 2</span>
                <h3 className="text-2xl md:text-4xl font-bold text-slate-800">Execução e Retenção</h3>
                <p className="text-slate-600 leading-relaxed text-lg">Pare de acumular resumos inúteis. Lance seu volume de exercícios diário no nosso sistema e crie um rastro numérico de consistência real na sua jornada rumo à faculdade dos sonhos.</p>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-gradient-to-br from-orange-50 to-indigo-50 flex items-center justify-center border border-slate-200 shadow-xl group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                   <BookOpen className="w-24 h-24 text-indigo-600 relative z-10 group-hover:-rotate-12 transition-transform duration-500" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3. Features em Cards (Bento Grid) */}
      <section className="w-full bg-white py-24 relative z-10 border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight font-serif mb-4">Tudo incluso no sistema</h2>
            <p className="text-lg text-slate-500">Ferramentas que cortam o "achismo" da sua rotina.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative bg-slate-50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Diário de Estudos</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Acompanhe o volume de questões feitas, taxa de acerto e visualize facilmente onde seu foco deve morar nas próximas semanas.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative bg-slate-50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Simulados Dirigidos</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Estructure provas e simulados completos usando inteligência e estatísticas de provas reais (KevQuest). 
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative bg-slate-50 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Dashboards Visuais</h3>
              <p className="text-slate-500 leading-relaxed text-sm">
                Gráficos potentes de radar, linhas e mapas de calor para ter uma visão do seu avanço sem se perder em planilhas chatas.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Chamada Final CTA */}
      <section className="w-full bg-[#0E172A] py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-600/30 blur-[150px] rounded-full pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
        >
           <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 font-serif">Sua aprovação é uma questão de matemática, não de sorte.</h2>
           <p className="text-xl text-slate-400 mb-10 font-light max-w-2xl mx-auto">As vagas pertencem aos alunos que controlam seus números. Pare de apostar no escuro e acesse a plataforma agora.</p>
           <Link 
              href="/login"
              className="group relative inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-400 text-slate-900 px-10 py-5 text-lg font-bold shadow-xl shadow-teal-500/20 transition-all duration-300 hover:scale-105 hover:shadow-teal-500/40"
            >
              Quero Acessar o Sistema
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
            </Link>
        </motion.div>
      </section>

      {/* Footer Minimalista */}
      <footer className="border-t border-slate-200/60 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-2">
           <BrainCircuit className="w-6 h-6 text-slate-300" />
           <p className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} Sinapse Mentoria. Preparando sua mente.</p>
        </div>
      </footer>
    </div>
  );
}
