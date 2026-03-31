# PRD - Plataforma Synapse

## 1. Visão Geral e Objetivo
A Plataforma Synapse é um ecossistema de estudos "All-in-One". O objetivo desta fase inicial é criar um **MVP Visual (Design-First)** de altíssima qualidade para apresentação a stakeholders. O foco absoluto é entregar uma interface moderna, rápida e impressionante, utilizando Mock Data (dados fictícios) para popular dashboards e calendários antes de conectar a lógica complexa de backend.

O sistema consolida o agendamento de um calendário robusto, o consumo de aulas e a análise técnica de erros e acertos em provas de alto nível.

## 2. Tech Stack e Design System
- **Frontend:** Next.js (React) ou similar.
- **Estilização:** Tailwind CSS.
- **Componentes UI:** Obrigatoriamente usar componentes inspirados no **Shadcn UI**.
- **Gráficos:** Recharts (ou similar) para visualização de dados.

### 2.1. Regras Rigorosas de UI/UX (Obrigatório)
O visual do site deve seguir um estilo "Clean Bento Grid" com toques de "Glassmorphism" sutil. Todo o CSS gerado deve seguir estas regras:
- **Paleta de Cores:**
  - *Background Global:* Branco puro (`bg-white`) ou gelo muito sutil (`bg-slate-50`).
  - *Cor Primária (Teal/Verde-Água):* Utilizar a cor `#00A896` (ou similar do Tailwind, ex: `teal-500` a `teal-600`) para elementos principais, ícones de destaque e gráficos de progresso positivo.
  - *Cor Secundária (Laranja):* Utilizar a cor `#FF9F1C` (ou similar, ex: `orange-400` a `orange-500`) para botões de "Call to Action", alertas e gráficos de atenção/erros.
  - *Textos:* Tons de cinza escuro (`text-slate-800` para títulos, `text-slate-500` para subtítulos). Nunca usar preto absoluto (`#000000`).
- **Cards e Divs (O Esqueleto):**
  - Todos os blocos de conteúdo devem ter fundos brancos.
  - *Bordas:* Arredondamento generoso. Use `rounded-2xl` ou `rounded-3xl`. Nunca use bordas retas ou `rounded-sm`.
  - *Sombras:* Sombras extremamente suaves e espalhadas. Use `shadow-sm`, `shadow-md` ou construa uma sombra customizada leve e difusa. Nunca use sombras duras ou escuras.
  - *Espaçamento (Padding):* Os cards devem "respirar". Use muito padding interno (ex: `p-6` ou `p-8`).

## 3. Funcionalidades Core (Escopo do MVP)

### A. Autenticação e Onboarding
- Tela de Login/Cadastro visualmente limpa, com formulário simples e opção de "Entrar com Google" (apenas visual por enquanto).

### B. Dashboard Central (A "Cara" do Projeto)
- Uma tela inicial de impacto.
- **Cards de Resumo:** Total de questões resolvidas, taxa de acerto global e horas de estudo na semana.
- **Gráficos Visuais:** Gráficos de barra ou linha mostrando a evolução de acertos vs. erros ao longo dos meses.

### C. Módulo KevQuest (Tracker de Questões)
- Uma interface para o aluno lançar rapidamente questões feitas.
- Inputs: Matéria, Assunto, "Acertei/Errei", e um campo para "Motivo do Erro".

### D. Central de Simulados e Provas
- Uma tabela de dados (Data Table) robusta listando os simulados já realizados.

### E. Calendário Inteligente
- Uma visão semanal/mensal para planejamento.
- Layout limpo, com eventos representados por blocos coloridos (usando a paleta Teal/Laranja) com bordas arredondadas e texto legível, sem sobrecarregar a tela.

## 4. Regras de Execução para o Agente
- **Construa o Visual Primeiro:** Ao criar páginas, não trave tentando conectar banco de dados. Crie as telas usando objetos JSON locais com dados falsos.
- **Modularidade:** Separe os componentes complexos na pasta `/execution` ou `/components`.
