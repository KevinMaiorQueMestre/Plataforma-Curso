# 🗂️ Pipeline de Processamento de Provas ENEM

Este diretório centraliza **todo o fluxo de processamento** de provas do ENEM para a plataforma MetAuto: do PDF bruto até o upload das questões (imagem + metadados) no Supabase.

---

## 📁 Estrutura de Pastas

```
pipeline/
├── scripts/              ← Os 4 scripts Python do pipeline
│   ├── 01_recortar_pdf.py       # Fase 1: recorte das questões em PNG
│   ├── 02_classificar_ia.py     # Fase 2: classificação IA (disciplina/conteúdo)
│   ├── 03_merge_dados.py        # Fase 3: merge do gabarito + geração do master.json
│   └── 04_upload_supabase.py    # Fase 4: upload de imagens e metadados ao Supabase
│
├── processado/           ← Output: uma pasta por prova processada
│   └── {ANO}_{APLICAÇÃO}_{DIA}/
│       ├── q001.png
│       ├── q001.json
│       ├── ...
│       └── master.json
│
├── legado/               ← Scripts e JSONs antigos (tools/pdf_extractor) — preservados
│   ├── final_output.json         # 2025 AR — 180 questões prontas ✅
│   ├── final_output_ppl.json     # 2025 PPL — 180 questões prontas ✅
│   ├── final_output_2017.json    # 2017 AR D2 — ~90 questões prontas ✅
│   └── ...
│
└── README.md             ← Este arquivo
```

---

## 🔄 As 4 Fases do Pipeline

```
PDF da Prova (ENEM/PROVAS/)
        │
        ▼
 [FASE 1] 01_recortar_pdf.py
 Detecta âncoras "QUESTÃO \d+" e recorta cada questão
 em PNG de alta resolução (3x scale ≈ 216 DPI).
 Saída: q001.png, q002.png, ...
        │
        ▼
 [FASE 2] 02_classificar_ia.py
 Lê o texto de cada questão e envia para a IA.
 Retorna disciplina e conteúdo estruturados.
 Saída: q001.json, q002.json, ... (sem gabarito ainda)
        │
        ▼
 [FASE 3] 03_merge_dados.py
 Lê o PDF de gabarito, extrai respostas e
 mescla em cada JSON. Gera o master.json da prova.
 Saída: q001.json (completo), master.json
        │
        ▼
 [FASE 4] 04_upload_supabase.py
 Faz upload das imagens para Supabase Storage e
 insere os metadados na tabela questoes_enem.
```

---

## 📐 Convenção de Nomenclatura

### Pasta de prova processada
```
{ANO}_{APLICAÇÃO}_{DIA}
```
| Exemplo | Significado |
|---|---|
| `2025_AR_D1` | ENEM 2025, Regular, 1º Dia |
| `2025_2A_D2` | ENEM 2025, PPL, 2º Dia |
| `2025_AB_D1` | ENEM 2025, Reaplicação, 1º Dia |

### Arquivos por questão
```
q{NNN}.png   ← imagem (NNN = sequência de aparição, ex: q001, q091)
q{NNN}.json  ← metadados completos
```

---

## 🧩 Schema do JSON por Questão

```json
{
  "questao_id": "2025_AR_D1_q001",
  "imagem": "q001.png",
  "ano": 2025,
  "aplicacao": "AR",
  "dia": "D1",

  "numero_azul": 91,
  "numero_amarela": null,
  "numero_rosa": null,
  "numero_branca": null,
  "numero_cinza": null,

  "disciplina": "Física",
  "conteudo": "Termologia",
  "gabarito": "C",

  "tri_a": null,
  "tri_b": null,
  "tri_c": null,

  "co_item": null,
  "co_habilidade": null,
  "item_anulado": false,

  "fonte_classificacao": "ia",
  "processado_em": "2026-05-08T14:00:00Z"
}
```

> **Por que 5 números?** O ENEM usa cadernos de cores diferentes dependendo do dia:
> - **D1 (CH + LC):** Azul, Amarela, Rosa, Branca
> - **D2 (CN + MT):** Azul, Amarela, Rosa, Cinza
> As mesmas questões aparecem em ordem diferente em cada caderno. Os campos `numero_*` mapeiam onde cada questão aparece em cada um deles.

---

## ♻️ Reaproveitamento de Dados Legados

As provas abaixo **já estão classificadas** em `legado/`. O script `03_merge_dados.py` aceita esses JSONs como entrada, pulando a chamada à IA:

| JSON | Prova |
|---|---|
| `legado/final_output.json` | ENEM 2025 AR (D1 + D2) |
| `legado/final_output_ppl.json` | ENEM 2025 PPL (D1 + D2) |
| `legado/final_output_2017.json` | ENEM 2017 AR (D2) |

---

## ⚙️ Instalação

```bash
pip install PyMuPDF google-generativeai supabase python-dotenv
```

Variáveis de ambiente necessárias no `.env` da raiz:
```
SUPABASE_URL=...
SUPABASE_KEY=...
GEMINI_API_KEY=...
```

---

## 📊 Status do Processamento

| Prova | Recorte | IA | Gabarito | Upload |
|---|---|---|---|---|
| 2025 AR D1 | ⬜ | ✅ legado | ⬜ | ⬜ |
| 2025 AR D2 | ⬜ | ✅ legado | ⬜ | ⬜ |
| 2025 2A D1 | ⬜ | ✅ legado | ⬜ | ⬜ |
| 2025 2A D2 | ⬜ | ✅ legado | ⬜ | ⬜ |
| 2017 AR D2 | ⬜ | ✅ legado | ⬜ | ⬜ |
| Demais provas (43) | ⬜ | ⬜ | ⬜ | ⬜ |
