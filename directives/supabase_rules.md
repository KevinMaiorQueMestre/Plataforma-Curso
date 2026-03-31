# Directive: Integração com Supabase (Banco de Dados)

## Objetivo
Este documento dita as regras rigorosas de como o agente e os scripts devem interagir com o Supabase.

## Regras de Execução e Orquestração
1. **Segurança de Credenciais:** Nunca exponha a `SUPABASE_URL` ou a `SUPABASE_ANON_KEY` diretamente no código de frontend se não for estritamente necessário. Sempre extraia essas chaves do arquivo `.env`.
2. **Manipulação de Dados:** Sempre que precisar ler ou gravar dados no banco (como registrar uma denúncia cidadã, cadastrar um aluno ou puxar métricas de um dashboard), priorize a criação de funções isoladas e testáveis na pasta `/execution`.
3. **Tipagem:** Se o projeto utilizar TypeScript, gere e mantenha os tipos do banco de dados atualizados para garantir que o código seja determinístico e livre de erros de leitura de tabelas.
