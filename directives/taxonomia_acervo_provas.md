# 📚 Taxonomia do Acervo de Provas — MetAuto All-in-one

**Versão:** 2.0  
**Última atualização:** Maio/2026  
**Responsável:** Engenharia de Dados MetAuto

---

## ⚠️ Diagnóstico dos Arquivos Reais (Análise do Acervo Existente)

Antes de definir as regras, foi feita uma análise dos 96 arquivos já presentes na pasta `/ENEM`. A análise revelou **três divergências críticas** em relação à taxonomia inicial proposta:

| Padrão Proposto | Realidade Encontrada nos Arquivos | Problema |
|---|---|---|
| `[FASE]` = `TU` (Turno Único) | Arquivos usam `AR`, `2A`, `AB` | O campo não representa "fase", mas sim **aplicação/edição** |
| `[DOCUMENTO]` = `PROVA` / `GABARITO` | Gabaritos usam `GAB` (abreviado) | Inconsistência: `GABARITO` vs `GAB` |
| Estrutura proposta não contemplava aplicações especiais | ENEM PPL (Privados de Liberdade), Digital, etc. | Lacuna grave para escalabilidade |

**Conclusão:** A taxonomia foi **reformulada** para refletir a realidade dos dados e suportar crescimento futuro.

---

## 🏗️ Estrutura Padrão Definitiva (v2.0)

```
[ANO]_[INSTITUICAO]_[APLICACAO]_[DIA]_[DOCUMENTO]_[COR].pdf
```

> **Mudanças em relação à v1.0:**
> - `[FASE]` foi renomeado para `[APLICACAO]` (mais preciso semanticamente)
> - `[DIA/TEMA]` foi renomeado para `[DIA]` (mais limpo)
> - `[COR]` foi adicionado como **6º campo obrigatório** para provas com cadernos coloridos

---

## 🧩 Dicionário de Variáveis (v2.0)

### 1. `[ANO]`
- **Definição:** Ano de aplicação do exame (4 dígitos numéricos).  
- **Tipo:** Integer  
- **Exemplos:** `2023`, `2024`, `2025`

---

### 2. `[INSTITUICAO]`
- **Definição:** Sigla padronizada da banca ou universidade (somente letras maiúsculas, sem acentos).
- **Tipo:** String (VARCHAR 10)
- **Valores permitidos:**

| Sigla | Instituição |
|---|---|
| `ENEM` | Exame Nacional do Ensino Médio |
| `FUVEST` | Fundação Universitária para o Vestibular (USP) |
| `IMAT` | International Medical Admissions Test |
| `UNICAMP` | Universidade Estadual de Campinas |
| `UNESP` | Universidade Estadual Paulista |
| `ESPCEX` | Escola Preparatória de Cadetes do Exército |

> Novos vestibulares devem ser adicionados nesta tabela antes de ingerir arquivos.

---

### 3. `[APLICACAO]`
**⚠️ Campo renomeado de `[FASE]` para `[APLICACAO]`**

- **Definição:** Identifica **qual edição ou turma** recebeu aquela versão da prova. Para exames como o ENEM, existem múltiplas aplicações por ano (regular, reaplicação, PPL, digital). Para vestibulares tradicionais, indica a fase.
- **Tipo:** String (VARCHAR 5)
- **Valores permitidos:**

| Código | Significado | Instituições | Observação |
|---|---|---|---|
| `AR` | Aplicação Regular (1ª aplicação do ano) | ENEM | Aplicação principal, ocorre todo ano |
| `2A` | Segunda Aplicação / Reaplicação | ENEM | Para candidatos que não puderam fazer na data original |
| `AB` | **Aplicação Belém** | ENEM | ⚠️ Edição especial ocorrida **somente em 2025**, em Belém do Pará, em função da COP-30 |
| `PPL` | Aplicação para Privados de Liberdade | ENEM | Aplicação em unidades prisionais |
| `DIG` | Aplicação Digital | ENEM | Formato digital (futuro) |
| `F1` | Primeira Fase | FUVEST, UNICAMP, UNESP | — |
| `F2` | Segunda Fase | FUVEST, UNICAMP, UNESP | — |
| `TU` | Turno Único (prova de fase única) | IMAT, ESPCEX | — |

> **Nota histórica:** Os arquivos do acervo ENEM 2025 contêm a sigla `AB` referente à **Aplicação Belém** — uma edição especial criada pelo INEP para atender candidatos da região norte do país durante a realização da **COP-30** em Belém/PA. Esta sigla é exclusiva do ano de 2025 e não deve ser reaproveitada para outros contextos.

---

### 4. `[DIA]`
- **Definição:** Identificador do dia de aplicação ou área de conhecimento.
- **Tipo:** String (VARCHAR 5)
- **Valores permitidos:**

| Código | Significado |
|---|---|
| `D1` | Dia 1 (ex: Linguagens, Ciências Humanas e Redação no ENEM) |
| `D2` | Dia 2 (ex: Ciências da Natureza e Matemática no ENEM) |
| `DU` | Dia Único (toda a prova em um único dia) |

---

### 5. `[DOCUMENTO]`
- **Definição:** Tipo de conteúdo dentro do arquivo.
- **Tipo:** String (VARCHAR 15)
- **Valores permitidos:**

| Código | Significado | Observação |
|---|---|---|
| `PROVA` | Caderno completo de questões | Padrão principal |
| `GAB` | Gabarito oficial de respostas | **Abreviação adotada** (retrocompatível com acervo existente) |
| `GABARITO` | Gabarito (forma longa) | Aceito, mas `GAB` é preferido |
| `REDACAO` | Tema/Proposta de redação | Sem `[COR]` obrigatório |
| `ESPELHO` | Espelho de correção da redação | Sem `[COR]` obrigatório |

---

### 6. `[COR]` ⭐ **CAMPO NOVO — OBRIGATÓRIO PARA PROVAS**
- **Definição:** Cor do caderno de provas. O ENEM e outros vestibulares distribuem diferentes versões da prova com gabaritos distintos para evitar cola. A cor identifica unicamente qual versão do gabarito corresponde àquele caderno.
- **Tipo:** String (VARCHAR 10)
- **Obrigatoriedade:** 
  - ✅ **Obrigatório** quando `[DOCUMENTO]` = `PROVA`
  - ✅ **Obrigatório** quando `[DOCUMENTO]` = `GAB` ou `GABARITO`
  - ⬜ **Omitir** quando `[DOCUMENTO]` = `REDACAO` ou `ESPELHO`
- **Valores permitidos:**

| Código | Cor | Uso mais comum |
|---|---|---|
| `AZU` | Azul | Caderno Azul (ENEM, FUVEST) |
| `AMA` | Amarelo | Caderno Amarelo (ENEM, FUVEST) |
| `BRA` | Branco | Caderno Branco (ENEM, FUVEST) |
| `ROS` | Rosa | Caderno Rosa (ENEM) |
| `VER` | Verde | Caderno Verde (ENEM) |
| `CIN` | Cinza | Acessibilidade / Libras |
| `TOD` | Todos | Gabarito unificado |

> **Regra especial:** Quando o gabarito oficial publicado não discrimina por cor (arquivo único com todas as respostas), use `TOD`.

---

## 🎯 Estrutura Final e Exemplos

### Formato completo para PROVA:
```
[ANO]_[INSTITUICAO]_[APLICACAO]_[DIA]_PROVA_[COR].pdf
```

### Formato para GABARITO com cor:
```
[ANO]_[INSTITUICAO]_[APLICACAO]_[DIA]_GAB_[COR].pdf
```

### Formato para GABARITO unificado:
```
[ANO]_[INSTITUICAO]_[APLICACAO]_[DIA]_GAB_TOD.pdf
```

### Formato para REDAÇÃO (sem cor):
```
[ANO]_[INSTITUICAO]_[APLICACAO]_[DIA]_REDACAO.pdf
```

---

### Tabela de Exemplos Completos

| Arquivo | Significado |
|---|---|
| `2024_ENEM_AR_D1_PROVA_AZU.pdf` | ENEM 2024, Aplicação Regular, Dia 1, Prova, Caderno Azul |
| `2024_ENEM_AR_D1_GAB_TOD.pdf` | ENEM 2024, Aplicação Regular, Dia 1, Gabarito Unificado |
| `2024_ENEM_2A_D2_PROVA_ROS.pdf` | ENEM 2024, 2ª Aplicação, Dia 2, Prova, Caderno Rosa |
| `2024_FUVEST_F1_DU_PROVA_AMA.pdf` | FUVEST 2024, 1ª Fase, Dia Único, Prova, Caderno Amarelo |
| `2025_IMAT_TU_DU_PROVA_TOD.pdf` | IMAT 2025, Turno Único, Dia Único, Prova (sem distinção de cor) |
| `2023_ENEM_AR_D1_REDACAO.pdf` | ENEM 2023, Aplicação Regular, Dia 1, Tema de Redação |

---

## ⚙️ Instrução de Processamento — Parser de Metadados

### Regra de Split
O sistema realiza `split("_")` sobre o `filename` (sem a extensão `.pdf`) e retorna um objeto JSON.

### Lógica de Parsing

```python
def parse_filename(filename: str) -> dict:
    """
    Recebe o nome do arquivo PDF e retorna os metadados estruturados.
    """
    name = filename.replace(".pdf", "")
    parts = name.split("_")
    
    # Validação básica
    if len(parts) not in [5, 6]:
        raise ValueError(f"Arquivo com nome inválido: {filename}. Esperado 5 ou 6 segmentos.")
    
    metadata = {
        "ano": int(parts[0]),
        "instituicao": parts[1],
        "aplicacao": parts[2],
        "dia": parts[3],
        "documento": parts[4],
        "cor": parts[5] if len(parts) == 6 else None
    }
    
    return metadata
```

### Output JSON — Exemplos

**Input:** `2024_ENEM_AR_D1_PROVA_AZU.pdf`
```json
{
  "ano": 2024,
  "instituicao": "ENEM",
  "aplicacao": "AR",
  "dia": "D1",
  "documento": "PROVA",
  "cor": "AZU"
}
```

**Input:** `2024_ENEM_AR_D1_GAB_TOD.pdf`
```json
{
  "ano": 2024,
  "instituicao": "ENEM",
  "aplicacao": "AR",
  "dia": "D1",
  "documento": "GAB",
  "cor": "TOD"
}
```

**Input:** `2023_ENEM_AR_D1_REDACAO.pdf`
```json
{
  "ano": 2023,
  "instituicao": "ENEM",
  "aplicacao": "AR",
  "dia": "D1",
  "documento": "REDACAO",
  "cor": null
}
```

---

## 🗄️ Schema Supabase — Tabela `acervo_provas`

```sql
CREATE TABLE acervo_provas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename    TEXT NOT NULL UNIQUE,          -- Nome original do arquivo
  ano         INTEGER NOT NULL,
  instituicao TEXT NOT NULL,
  aplicacao   TEXT NOT NULL,
  dia         TEXT NOT NULL,
  documento   TEXT NOT NULL,
  cor         TEXT,                          -- NULL para REDACAO e ESPELHO
  storage_url TEXT,                          -- URL do arquivo no Supabase Storage
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance de consulta
CREATE INDEX idx_acervo_ano ON acervo_provas(ano);
CREATE INDEX idx_acervo_instituicao ON acervo_provas(instituicao);
CREATE INDEX idx_acervo_aplicacao ON acervo_provas(aplicacao);
CREATE INDEX idx_acervo_documento ON acervo_provas(documento);

-- Índice composto para filtros comuns (ex: "todas as provas do ENEM 2024")
CREATE INDEX idx_acervo_busca ON acervo_provas(instituicao, ano, aplicacao, dia);
```

---

## 🔄 Retrocompatibilidade com o Acervo Existente

Os 96 arquivos já presentes no acervo (`/ENEM/PROVAS` e `/ENEM/GABARITOS`) **não precisam ser renomeados** agora. O parser deve aceitar arquivos com **5 segmentos** (sem o campo `[COR]`) e preencher `cor = null` no banco de dados. A adição da cor pode ser feita manualmente via painel administrativo após a ingestão inicial.

### Mapeamento dos arquivos existentes:

| Arquivo atual | `aplicacao` | Significado completo | `documento` | `cor` (banco) |
|---|---|---|---|---|
| `2024_ENEM_AR_D1_PROVA.pdf` | `AR` | Aplicação Regular | `PROVA` | `null` (a preencher) |
| `2024_ENEM_AR_D1_GAB.pdf` | `AR` | Aplicação Regular | `GAB` | `null` (a preencher) |
| `2025_ENEM_2A_D1_PROVA.pdf` | `2A` | Segunda Aplicação | `PROVA` | `null` (a preencher) |
| `2025_ENEM_AB_D1_PROVA.pdf` | `AB` | **Aplicação Belém** *(exclusivo 2025)* | `PROVA` | `null` (a preencher) |

---

## 📋 Checklist de Validação (pré-ingestão)

Antes de ingerir qualquer arquivo, o sistema deve validar:

- [ ] O nome contém exatamente **5 ou 6 segmentos** separados por `_`
- [ ] O campo `[ANO]` é um inteiro de 4 dígitos (entre 2000 e 2030)
- [ ] O campo `[INSTITUICAO]` está na lista de siglas homologadas
- [ ] O campo `[APLICACAO]` está na lista de valores permitidos
- [ ] O campo `[DIA]` está na lista de valores permitidos
- [ ] O campo `[DOCUMENTO]` está na lista de valores permitidos
- [ ] Se `[DOCUMENTO]` = `PROVA` ou `GAB`, o campo `[COR]` **deve estar presente**
- [ ] Não existe outro arquivo com o mesmo nome no banco (`UNIQUE` constraint)

---

## 🚀 Roteiro de Implementação

```
Fase 1 — Ingestão do acervo existente (96 arquivos ENEM)
  └── Rodar parser em modo retrocompat (5 segmentos, cor = null)
  └── Inserir registros na tabela acervo_provas
  └── Fazer upload dos PDFs para o Supabase Storage

Fase 2 — Enriquecimento de metadados
  └── Criar painel admin para preencher o campo [COR] manualmente
  └── Ou processar via OCR/leitura de capa dos PDFs (automatizado)

Fase 3 — Expansão para outras bancas
  └── Criar subpastas: /FUVEST, /IMAT, /UNICAMP
  └── Aplicar mesma estrutura de taxonomia
  └── Adicionar novas siglas na tabela de instituições homologadas
```
