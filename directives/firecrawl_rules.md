# Firecrawl Data Extraction Rules

> **SOP (Standard Operating Procedure)** para extração de dados usando o MCP do Firecrawl.
> Este arquivo dita como a inteligência artificial (agentes) e scripts devem utilizar a ferramenta Firecrawl neste projeto.

## 1. Visão Geral da Ferramenta
O **Firecrawl MCP** é a nossa ferramenta oficial de automação para extração de dados da web (Web Scraping, Crawling e Discovery). 
Sendo um servidor MCP, ele expõe ferramentas nativas para varrer e processar conteúdo de sites para formatos amigáveis a LLMs, extraindo Markdown ou dados estruturados em JSON.

## 2. Pré-requisitos e Autenticação
Antes de iniciar qualquer extração:
1. É fundamental ter uma variável de ambiente `FIRECRAWL_API_KEY` configurada.
2. O servidor MCP deve ser invocado via: `npx -y firecrawl-mcp`.
   - *Nota (Windows):* Em ambientes Windows, utilize o Command Prompt (`cmd /c "npx -y firecrawl-mcp"`) ou configure a extensão do Cursor para usar a variável corretamente caso o PowerShell bloqueie scripts.
3. Se estiver chamando ferramentas do Firecrawl do Cursor/Windsurf, a chave é lida da opção `"FIRECRAWL_API_KEY": "${input:apiKey}"` configurada em `.vscode/mcp.json`.

## 3. Diretrizes de Uso para Agentes

Ao extrair dados, siga as seguintes regras rígidas para maximizar a precisão e evitar erros:

*   **Identifique o Objetivo do Scraping:** Determine se você precisa visitar uma única página (*scrape*), procurar sub-links num site inteiro (*crawl*) ou buscar algo na internet via busca antes. Use as ferramentas corretas expostas pelo MCP.
*   **Gestão de Estado Intermediário (`.tmp/`):** 
    Nunca salve diretamente os dados não-tratados em pastas finais de repositório. Utilize a pasta `.tmp/` para despejar o output bruto em JSON ou Markdown. Exemplo: `.tmp/scraped_data_site-x.json`.
*   **Limites de Requisição (Rate Limits) e Retentativas:** 
    O Firecrawl cuida de rate limiting via backoff exponencial. Não mande múltiplas requisições paralelas pesadas seguidas sem necessidade. O limite padrão é: `FIRECRAWL_RETRY_MAX_ATTEMPTS=3`. Caso receba uma falha de `timeout` ou limite, aguarde.

## 4. Ordem e Fluxo de Execução Recomendado (Self-Annealing Loop)

1. **Preparação**: Garantir API key válida.
2. **Extração Bruta**: Requisitar os dados e salvar na pasta `.tmp/` para logs internos do agente (se for um volume grande).
3. **Limpeza e Estruturação**: Ler os dados do `/tmp`, realizar tratamento (limpar Markdown desnecessário, links quebrados) utilizando Python puro na pasta `execution/` ou nativamente na memória do agente (se for pequeno).
4. **Verificação de Limite de Créditos**: Fique atento a erros relativos a `FIRECRAWL_CREDIT_CRITICAL_THRESHOLD` (configurável). Se o script relatar falta de créditos na saída, avise o usuário imediatamente e **pare a extração**.

---
*Este é um documento vivo ("living document"). Caso detectemos mudanças no comportamento da API do Firecrawl ou novas restrições de domínios, atualize as diretrizes acima.*
