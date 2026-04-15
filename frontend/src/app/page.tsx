"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, BookOpen, Target, Sparkles, LayoutDashboard, BrainCircuit, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { motion } from "framer-motion";

const CAROUSEL_DATA = [
  {
    name: "João Silva",
    course: "Medicina USP",
    quote: "A metodologia do MetAuto foi essencial para a minha aprovação em tempo recorde. O diário de estudos mudou meu jogo.",
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
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-600/20 blur-[80px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[80px] rounded-full pointer-events-none"></div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center gap-12 z-10 pt-16">
        
        {/* Left: Text */}
        <div className="flex-1 space-y-8 animate-in slide-in-from-left-8 fade-in duration-700" key={`text-${currentIndex}`}>
          <div className="inline-block px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-teal-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            Aprovados MetAuto
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
      <button onClick={handlePrev} className="absolute left-4 md:left-8 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm z-20">
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button onClick={handleNext} className="absolute right-4 md:right-8 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 hover:text-white transition-all backdrop-blur-sm z-20">
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

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import Image from "next/image";

export default function LandingPage() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: -320, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    if (carouselRef.current) carouselRef.current.scrollBy({ left: 320, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex flex-col font-sans selection:bg-teal-200 selection:text-teal-900 dark:selection:bg-teal-800 dark:selection:text-teal-100 overflow-hidden transition-colors duration-300">
      
      {/* Navbar (Floating & Glassmorphism) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-7xl z-50 bg-white dark:bg-[#121212]/80 dark:bg-[#121212]/80 backdrop-blur-md border border-white/50 dark:border-[#2C2C2E] shadow-lg rounded-full transition-colors duration-300">
        <div className="px-6 md:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="flex flex-col items-start cursor-pointer group hover:opacity-80 transition-opacity text-left bg-transparent border-none p-0 focus:outline-none"
          >
            <h1 className="text-xl md:text-2xl font-serif text-slate-800 dark:text-slate-100 tracking-wide leading-none font-bold group-hover:text-slate-600 dark:text-[#A1A1AA] dark:group-hover:text-teal-400 transition-colors">
              METAUTO
            </h1>
            <p className="text-[8px] md:text-[9px] uppercase font-bold text-slate-600 dark:text-[#A1A1AA] tracking-[0.2em] mt-0.5 group-hover:text-slate-500 dark:text-[#A1A1AA] dark:group-hover:text-teal-500 transition-colors">
              ALL-IN-ONE
            </p>
          </button>
          
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeSwitcher />
            <Link 
              href="/login"
              className="group relative inline-flex items-center justify-center rounded-full px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            >
              <span>Login</span>
            </Link>
            <a 
              href="#matricula"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#matricula')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 md:px-5 py-2 text-xs md:text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-slate-800 hover:scale-105 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 cursor-pointer"
            >
              <span>Matricule-se</span>
              <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="w-full">
        <HeroCarousel />
      </main>

      {/* 1. Logo Banner (Infinite Scroll) */}
      <section className="w-full bg-white dark:bg-[#121212] py-5 border-b border-slate-100 dark:border-[#2C2C2E] overflow-hidden relative flex flex-col items-center justify-center">
        <div className="w-full max-w-7xl mx-auto overflow-hidden relative flex">
          {/* Gradient masks for smooth fade on edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-[#121212] to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-[#121212] to-transparent z-10 pointer-events-none"></div>
          
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

      {/* 2. Metodologia MetAuto (ZigZag) */}
      <section className="w-full bg-slate-50 dark:bg-[#1C1C1E] py-24 border-b border-slate-100 dark:border-[#2C2C2E] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-20"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-serif mb-4">Como funciona o método?</h2>
            <p className="text-lg text-slate-500 dark:text-[#A1A1AA]">Desenvolvemos uma engenharia de aprovação em pilares fundamentais.</p>
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
                <span className="text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-widest block bg-teal-100 dark:bg-teal-500/10 w-max px-3 py-1 rounded-full">Passo 1</span>
                <h3 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-[#FFFFFF]">Diagnóstico Cirúrgico</h3>
                <p className="text-slate-600 dark:text-[#A1A1AA] leading-relaxed text-lg">Use nossos simulados com métricas espelhadas na prova real (KevQuest) para entender com exatidão onde você está perdendo pontos valiosos.</p>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-gradient-to-br from-indigo-50 to-teal-50 flex items-center justify-center border border-slate-200 dark:border-[#2C2C2E] shadow-xl group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                   <Target className="w-24 h-24 text-teal-600 dark:text-teal-400 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
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
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest block bg-indigo-100 dark:bg-indigo-500/10 w-max px-3 py-1 rounded-full">Passo 2</span>
                <h3 className="text-2xl md:text-4xl font-bold text-slate-800 dark:text-[#FFFFFF]">Execução e Retenção</h3>
                <p className="text-slate-600 dark:text-[#A1A1AA] leading-relaxed text-lg">Pare de acumular resumos inúteis. Lance seu volume de exercícios diário no nosso sistema e crie um rastro numérico de consistência real na sua jornada rumo à faculdade dos sonhos.</p>
              </div>
              <div className="flex-1 w-full flex justify-center">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-gradient-to-br from-orange-50 to-indigo-50 flex items-center justify-center border border-slate-200 dark:border-[#2C2C2E] shadow-xl group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
                   <BookOpen className="w-24 h-24 text-indigo-600 dark:text-indigo-400 relative z-10 group-hover:-rotate-12 transition-transform duration-500" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 1.5. Aprovados Medicina (Carrossel Restaurado - Espaço para Fotos) */}
      <section className="w-full bg-slate-900 py-10 border-b border-slate-800 overflow-hidden relative flex flex-col items-center justify-center">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"></div>
        <p className="text-sm font-bold text-teal-400 uppercase tracking-[0.2em] mb-6 text-center px-4">Eles usaram o método e passaram em Medicina</p>
        
        <div className="w-full overflow-hidden relative flex">
          {/* Gradient masks */}
          <div className="absolute inset-y-0 left-0 w-24 md:w-64 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-24 md:w-64 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-marquee whitespace-nowrap items-center w-max" style={{ animationDuration: '40s' }}>
            {/* Repeated array for infinite scroll */}
            {[...Array(2)].fill(0).map((_, arrayIndex) => (
              <div key={arrayIndex} className="flex gap-4 md:gap-6 items-center pl-4 md:pl-6 text-white font-bold text-xl uppercase tracking-widest bg-teal-500/10">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="group relative w-36 h-36 md:w-52 md:h-52 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.1)] border border-slate-800 shrink-0 transform transition-transform duration-500">
                    {/* Placeholder Background since images were removed */}
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                        <Target className="w-12 h-12 text-teal-500/20 group-hover:text-teal-400/40 transition-colors" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-4 z-20 pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-slate-900 border-2 border-slate-900 -mb-2 shadow-lg inline-flex">
                           <Target className="w-4 h-4" />
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 3. Features em Cards (Bento Grid) */}
      <section className="w-full bg-white dark:bg-[#121212] py-24 relative z-10 border-b border-slate-100 dark:border-[#2C2C2E] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-serif mb-4">Tudo incluso no sistema</h2>
            <p className="text-lg text-slate-500 dark:text-[#A1A1AA]">Ferramentas que cortam o "achismo" da sua rotina.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative bg-slate-50 dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#2C2C2E] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                <BookOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] mb-3">Diário de Estudos</h3>
              <p className="text-slate-500 dark:text-[#A1A1AA] leading-relaxed text-sm">
                Acompanhe o volume de questões feitas, taxa de acerto e visualize facilmente onde seu foco deve morar nas próximas semanas.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative bg-slate-50 dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#2C2C2E] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-teal-100 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] mb-3">Simulados Dirigidos</h3>
              <p className="text-slate-500 dark:text-[#A1A1AA] leading-relaxed text-sm">
                Estructure provas e simulados completos usando inteligência e estatísticas de provas reais (KevQuest). 
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative bg-slate-50 dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#2C2C2E] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] mb-3">Dashboards Visuais</h3>
              <p className="text-slate-500 dark:text-[#A1A1AA] leading-relaxed text-sm">
                Gráficos potentes de radar, linhas e mapas de calor para ter uma visão do seu avanço sem se perder em planilhas chatas.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. Planos */}
      <section className="w-full bg-slate-50 dark:bg-[#1C1C1E] py-24 border-b border-slate-100 dark:border-[#2C2C2E] relative" id="planos">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-serif mb-4">Escolha o seu plano</h2>
            <p className="text-lg text-slate-500 dark:text-[#A1A1AA]">Invista no seu futuro com o método que mais aprova.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch border border-slate-200 dark:border-[#2C2C2E] rounded-[2.5rem] bg-white dark:bg-[#121212] lg:p-4 shadow-xl shadow-slate-200/50 dark:shadow-none">
            {/* Plano Essencial */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-transparent rounded-3xl p-8 flex flex-col group relative"
            >
              <h3 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] mb-2">Essencial</h3>
              <p className="text-slate-500 dark:text-[#A1A1AA] text-sm mb-6 h-10">Para quem quer começar a organizar os estudos.</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">R$ 49</span>
                <span className="text-slate-500 dark:text-[#A1A1AA] font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Diário de estudos básico",
                  "Até 50 questões diárias",
                  "Dashboards simples"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-500 shrink-0" />
                    <span className="text-slate-600 dark:text-[#A1A1AA] text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/login"
                className="w-full py-3.5 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] text-slate-700 dark:text-[#F4F4F5] font-bold text-center hover:border-teal-500 hover:text-teal-600 dark:text-teal-400 transition-colors"
                >
                Assinar Essencial
              </Link>
            </motion.div>

            {/* Plano Aprovado (Highlighted) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl shadow-teal-900/20 flex flex-col relative transform md:-translate-y-8"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-teal-400 to-teal-500 text-slate-900 text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                Recomendado
              </div>
              <h3 className="text-xl font-bold text-white mb-2 mt-4">Aprovado</h3>
              <p className="text-slate-400 text-sm mb-6 h-10">O sistema completo para quem não quer perder tempo.</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R$ 97</span>
                <span className="text-slate-400 font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Tudo do plano Essencial",
                  "Acesso ao KevQuest",
                  "Simulados dirigidos ilimitados",
                  "Dashboards de radar e heatmap",
                  "Métricas espelhadas de provas"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-400 shrink-0" />
                    <span className="text-slate-300 text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/login"
                className="w-full py-3.5 rounded-xl bg-teal-500 text-slate-900 font-black text-center hover:bg-teal-400 transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] hover:scale-105"
                >
                Assinar Aprovado
              </Link>
            </motion.div>

            {/* Plano VIP */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-transparent rounded-3xl p-8 flex flex-col group"
            >
              <h3 className="text-xl font-bold text-slate-800 dark:text-[#FFFFFF] mb-2">Mentoria VIP</h3>
              <p className="text-slate-500 dark:text-[#A1A1AA] text-sm mb-6 h-10">Acompanhamento de perto até a sua aprovação.</p>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900 dark:text-white">R$ 297</span>
                <span className="text-slate-500 dark:text-[#A1A1AA] font-medium">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {[
                  "Tudo do plano Aprovado",
                  "Encontros quinzenais via Zoom",
                  "Estratégia de prova individualizada",
                  "Grupo exclusivo no WhatsApp"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-500 shrink-0" />
                    <span className="text-slate-600 dark:text-[#A1A1AA] text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link 
                href="/login"
                className="w-full py-3.5 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] text-slate-700 dark:text-[#F4F4F5] font-bold text-center hover:border-teal-500 hover:text-teal-600 dark:text-teal-400 transition-colors"
                >
                Falar com consultor
              </Link>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 3.5. Depoimentos em Vídeo (Aparecem ao Hover) */}
      <section className="w-full bg-slate-50 dark:bg-[#1C1C1E] py-24 border-b border-slate-100 dark:border-[#2C2C2E] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-serif mb-4">Veja quem já validou o método</h2>
            <p className="text-lg text-slate-500 dark:text-[#A1A1AA]">Passe o mouse por cima e ouça histórias reais de aprovação.</p>
          </motion.div>

          <div className="relative group/carousel">
            {/* Setinha Esquerda */}
            <button 
              onClick={scrollLeft}
              className="absolute -left-3 md:-left-14 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-[#121212] rounded-full shadow-xl border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-center text-slate-500 dark:text-[#A1A1AA] hover:text-teal-600 dark:text-teal-400 hover:scale-110 z-20 transition-all opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0 focus:opacity-100"
              aria-label="Rolar para esquerda"
            >
              <ChevronLeft className="w-6 h-6 mr-0.5" />
            </button>

            {/* Setinha Direita */}
            <button 
              onClick={scrollRight}
              className="absolute -right-3 md:-right-14 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-[#121212] rounded-full shadow-xl border border-slate-100 dark:border-[#2C2C2E] flex items-center justify-center text-slate-500 dark:text-[#A1A1AA] hover:text-teal-600 dark:text-teal-400 hover:scale-110 z-20 transition-all opacity-0 group-hover/carousel:opacity-100 focus:opacity-100"
              aria-label="Rolar para direita"
            >
              <ChevronRight className="w-6 h-6 ml-0.5" />
            </button>

            {/* Container do Carrossel */}
            <div 
              ref={carouselRef}
              className="flex gap-6 overflow-x-auto pb-10 snap-x snap-mandatory pt-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {[
              {
                id: 1,
                name: "Lucas Silva",
                role: "Aprovado UFMG",
                text: "A clareza dos dashboards foi o divisor de águas para minha estratégia de aprovação.",
                poster: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=700&fit=crop",
                video: "https://www.w3schools.com/html/mov_bbb.mp4",
              },
              {
                id: 2,
                name: "Carolina Mendes",
                role: "Aprovada USP",
                text: "Parei de focar no que não caía e direcionei meus estudos para os pontos fracos.",
                poster: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=700&fit=crop",
                video: "https://www.w3schools.com/html/mov_bbb.mp4",
              },
              {
                id: 3,
                name: "Ricardo Alves",
                role: "Aprovado Unicamp",
                text: "A consistência visual do Diário de Estudos me impediu de desistir na reta final.",
                poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=700&fit=crop",
                video: "https://www.w3schools.com/html/mov_bbb.mp4",
              },
              {
                id: 4,
                name: "Marina Souza",
                role: "Aprovada UnB",
                text: "Estatísticas reais que transformam incerteza numa matemática precisa.",
                poster: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=700&fit=crop",
                video: "https://www.w3schools.com/html/mov_bbb.mp4",
              }
            ].map((item) => (
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: item.id * 0.1 }}
                key={item.id}
                className="relative min-w-[280px] md:min-w-[320px] aspect-[4/5] bg-slate-900 rounded-[2.5rem] overflow-hidden snap-center group shadow-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer"
                onMouseEnter={(e) => {
                  const video = e.currentTarget.querySelector('video');
                  if(video) video.play().catch(()=>{});
                }}
                onMouseLeave={(e) => {
                  const video = e.currentTarget.querySelector('video');
                  if(video) {
                    video.pause();
                    video.currentTime = 0;
                  }
                }}
              >
                {/* Imagem Padrão */}
                <Image 
                  src={item.poster} 
                  alt={item.name}
                  fill
                  className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                  sizes="(max-width: 768px) 280px, 320px"
                />
                
                {/* Vídeo Escondido Exibido ao Hover — preload=none evita download ao carregar a página */}
                <video 
                  src={item.video}
                  loop
                  muted
                  playsInline
                  preload="none"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                />

                {/* Overlay Degradê Inferior para Texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent"></div>

                {/* Botão de Play Estilizado Flutuante (Some ao Hover) */}
                <div className="absolute inset-0 top-1/3 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-all duration-300 transform group-hover:scale-90">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-[#121212]/20 backdrop-blur-md flex items-center justify-center border border-white/30 dark:border-[#2C2C2E] text-white shadow-xl">
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>

                {/* Indicador de Somente Play ativo (Opcional) */}
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/20 dark:border-[#2C2C2E] text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 10v4a2 2 0 002 2h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 001.707-.707V5a1 1 0 00-1.707-.707L10.293 7.707A1 1 0 019.586 8H7a2 2 0 00-2 2z"></path></svg>
                  </div>
                </div>

                {/* Conteúdo Textual Inferior */}
                <div className="absolute bottom-0 inset-x-0 p-8 flex flex-col justify-end transform transition-transform duration-500">
                  <h3 className="text-white font-bold text-2xl">{item.name}</h3>
                  <p className="text-teal-400 font-bold text-sm mb-4 tracking-wider uppercase">{item.role}</p>
                  <p className="text-slate-200 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-500 relative z-10">
                    "{item.text}"
                  </p>
                </div>
              </motion.div>
            ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Formulário de Matrícula */}
      <section className="w-full bg-white dark:bg-[#121212] py-16 border-b border-slate-100 dark:border-[#2C2C2E] relative scroll-mt-28" id="matricula">
        <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-between">
          
          {/* Esquerda: Texto */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-lg lg:max-w-xl"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-serif mb-6 leading-tight">Chegou a hora de decidir o seu futuro.</h2>
            <p className="text-base md:text-lg text-slate-500 dark:text-[#A1A1AA] mb-8 leading-relaxed">Nossa equipe de especialistas está pronta para te orientar sobre a metodologia e encontrar o plano perfeito para você. O primeiro passo é o mais importante.</p>
            
            <ul className="space-y-4">
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors text-teal-600 dark:text-teal-400">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-slate-700 dark:text-[#F4F4F5] font-medium text-lg group-hover:text-slate-900 transition-colors">Atendimento personalizado</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors text-teal-600 dark:text-teal-400">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-slate-700 dark:text-[#F4F4F5] font-medium text-lg group-hover:text-slate-900 transition-colors">Conheça nossas duas unidades</span>
              </li>
              <li className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-100 flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:text-white transition-colors text-teal-600 dark:text-teal-400">
                  <Check className="w-5 h-5" />
                </div>
                <span className="text-slate-700 dark:text-[#F4F4F5] font-medium text-lg group-hover:text-slate-900 transition-colors">Acesso imediato ao MetAuto</span>
              </li>
            </ul>
          </motion.div>

          {/* Direita: Formulário Compacto */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-lg bg-slate-50 dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden"
          >
            {/* Decoração sutil no card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-bl-full pointer-events-none"></div>

            <h3 className="text-2xl font-bold text-slate-800 dark:text-[#FFFFFF] mb-6">Garanta sua vaga</h3>
            
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* Unidade Radios */}
              <div className="space-y-2.5">
                 <label className="block text-sm font-bold text-slate-700 dark:text-[#F4F4F5]">Escolha a unidade:</label>
                 <div className="flex gap-3">
                    <label className="flex-1 relative cursor-pointer group">
                      <input type="radio" name="unidade" value="Asa sul" className="peer sr-only" defaultChecked />
                      <div className="p-3 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] peer-checked:border-teal-500 peer-checked:bg-teal-50 dark:bg-teal-500/10/50 hover:bg-slate-100 dark:bg-[#2C2C2E] transition-all text-center">
                         <span className="font-bold text-slate-700 dark:text-[#F4F4F5] text-sm">Asa Sul</span>
                      </div>
                    </label>
                    <label className="flex-1 relative cursor-pointer group">
                      <input type="radio" name="unidade" value="Taguatinga" className="peer sr-only" />
                      <div className="p-3 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] peer-checked:border-teal-500 peer-checked:bg-teal-50 dark:bg-teal-500/10/50 hover:bg-slate-100 dark:bg-[#2C2C2E] transition-all text-center">
                         <span className="font-bold text-slate-700 dark:text-[#F4F4F5] text-sm">Taguatinga</span>
                      </div>
                    </label>
                 </div>
              </div>

              {/* Nome */}
              <div>
                <input type="text" required placeholder="Seu nome completo" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400 bg-white dark:bg-[#121212] text-slate-800 dark:text-[#FFFFFF] text-sm" />
              </div>

              {/* Email & Telefone */}
              <div className="grid grid-cols-2 gap-3">
                 <div>
                   <input type="email" required placeholder="Seu e-mail" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400 bg-white dark:bg-[#121212] text-slate-800 dark:text-[#FFFFFF] text-sm" />
                 </div>
                 <div>
                   <input type="tel" required placeholder="Telefone / WhatsApp" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400 bg-white dark:bg-[#121212] text-slate-800 dark:text-[#FFFFFF] text-sm" />
                 </div>
              </div>

              {/* Assunto */}
               <div>
                <input type="text" required placeholder="Assunto (Opcional)" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-[#2C2C2E] focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all placeholder:text-slate-400 bg-white dark:bg-[#121212] text-slate-800 dark:text-[#FFFFFF] text-sm" />
              </div>

              {/* Button */}
              <button type="submit" className="w-full py-3.5 mt-2 rounded-xl bg-slate-900 text-white font-bold tracking-wide hover:bg-slate-800 hover:scale-[1.02] shadow-xl shadow-slate-900/10 transition-all active:scale-[0.98] text-sm flex justify-center items-center gap-2">
                Enviar Solicitação
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* 5. Chamada Final CTA */}
      <section className="w-full bg-[#0E172A] py-32 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-teal-600/30 blur-[100px] rounded-full pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto px-6 text-center relative z-10"
        >
           <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 font-serif">Sua aprovação é uma questão de matemática, não de sorte.</h2>
           <p className="text-xl text-slate-400 mb-10 font-light max-w-2xl mx-auto">As vagas pertencem aos alunos que controlam seus números. Pare de apostar no escuro e acesse o MetAuto agora.</p>
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
      <footer className="border-t border-slate-200 dark:border-[#2C2C2E]/60 bg-white dark:bg-[#121212] py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-2">
           <BrainCircuit className="w-6 h-6 text-slate-300" />
           <p className="text-sm font-medium text-slate-400" suppressHydrationWarning>© {new Date().getFullYear()} MetAuto All-in-one. Preparando sua mente.</p>
        </div>
      </footer>
    </div>
  );
}
