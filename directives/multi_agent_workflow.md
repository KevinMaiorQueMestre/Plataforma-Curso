# Diretiva de Colaboração Multi-Agente (Dashboard)

## Objetivo
Esta diretiva estabelece as regras para que múltiplas IAs (Agentes) operem de forma concorrente no mesmo projeto de Frontend (Next.js) sem gerar conflitos de merge, perda de dados ou regressões visuais.

## Estratégia de Isolamento: "Componentização Estrita"
A página principal do Dashboard (`frontend/src/app/(dashboard)/page.tsx` ou similar) é apenas uma **casca de composição**. Ela agrupa componentes, mas NENHUMA lógica de negócio ou estilização pesada deve viver nela.

Para evitar que IAs subscrevam códigos, o trabalho foi dividido em 4 "Territórios Isolados" (Slots).

### Territórios de Atuação (Slots)
Ao receber uma tarefa, o Agente **obrigatoriamente** deve identificar qual o seu arquivo designado e trabalhar EXCLUSIVAMENTE nele:

1. **`components/dashboard/SummaryCards.tsx`**
   - Responsável pelos Cartões de Resumo (Horas de Estudo, Taxa de Acerto).
   - *Regra Extra:* Sempre manter os Cards consistentes e alinhados horizontalmente (Flexbox/Grid).
2. **`components/dashboard/EvolutionCharts.tsx`**
   - Responsável pelos Gráficos Recharts.
   - *Regra Extra:* O container deve ser responsivo. Use mock data extenso para validar o visual.
3. **`components/dashboard/KevQuestWidget.tsx`**
   - Responsável pelo mini-formulário de lançamento rápido de questões.
   - *Regra Extra:* Não adicionar ações reais de banco de dados ainda. Todo form submission deve ser evitado preventivamente via `e.preventDefault()`.
4. **`components/dashboard/CalendarWidget.tsx`**
   - Responsável pela renderização de blocos do calendário.
   - *Regra Extra:* Respeitar as cores do `PRD.md` (Laranja e Teal) rigorosamente.

## Regras Operacionais para as IAs
1. **Regra de Toque Único (Single Touch):** Sob DE NENHUMA HIPÓTESE o Agente designado para o Território 2 pode modificar o código do Território 4. Se a funcionalidade exigir interação global de estado, utilize Props puras (Dumb Components) ou Context API de modo isolado no seu slot.
2. **Restrição de Roteamento:** O arquivo raiz `page.tsx` não deve ser modificado após a sua "wire-up" (conexão) inicial. A não ser se a tarefa principal ditar que novos slots foram incluídos pela equipe de arquitetura.
3. **Consultas Sistemáticas:** Todo Agente deve sempre ler o `PRD.md` para resgatar os valores exatos da paleta "Teal/Laranja", arredondamento de bordas e padding antes de escrever CSS Tailwind no seu slot.
