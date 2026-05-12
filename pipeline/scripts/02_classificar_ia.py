#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io as _io, sys as _sys
_sys.stdout = _io.TextIOWrapper(_sys.stdout.buffer, encoding='utf-8', errors='replace')
_sys.stderr = _io.TextIOWrapper(_sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
02_classificar_ia.py — Fase 2 do Pipeline ENEM
Classifica cada questão com IA (disciplina e conteúdo).
Aceita JSON legado para evitar chamadas desnecessárias à API.

Uso:
    python scripts/02_classificar_ia.py <prova_id>
    python scripts/02_classificar_ia.py <prova_id> --legado <arquivo.json>

Exemplos:
    python scripts/02_classificar_ia.py 2025_AR_D1
    python scripts/02_classificar_ia.py 2025_AR_D1 --legado final_output.json
"""

import json
import sys
import os
import time
from pathlib import Path
from datetime import datetime

# Carrega .env da raiz do projeto
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

PROCESSADO_BASE = Path(__file__).parent.parent / "processado"
LEGADO_BASE     = Path(__file__).parent.parent / "legado"

# ============================================================
# DISCIPLINAS VÃLIDAS â€” restringe alucinaÃ§Ãµes da IA
# ============================================================
DISCIPLINAS_VALIDAS = [
    "Linguagens (PortuguÃªs)",
    "LÃ­ngua Estrangeira",
    "Literatura",
    "Artes",
    "EducaÃ§Ã£o FÃ­sica",
    "HistÃ³ria",
    "Geografia",
    "Filosofia",
    "Sociologia",
    "FÃ­sica",
    "QuÃ­mica",
    "Biologia",
    "MatemÃ¡tica",
]

PROMPT = """VocÃª Ã© um especialista no ENEM (Exame Nacional do Ensino MÃ©dio do Brasil).

Analise o texto da questÃ£o abaixo e retorne EXATAMENTE um JSON com dois campos:
- "disciplina": a disciplina principal (use APENAS uma das opÃ§Ãµes listadas)
- "conteudo": o tÃ³pico/assunto especÃ­fico cobrado (ex: "Termologia", "GenÃ©tica", "FunÃ§Ãµes")

DISCIPLINAS VÃLIDAS:
{disciplinas}

Texto da questÃ£o:
---
{texto}
---

Responda APENAS com o JSON, sem explicaÃ§Ãµes ou markdown.
Exemplo de resposta: {{"disciplina": "FÃ­sica", "conteudo": "Termologia"}}"""


# ============================================================
# FUNÃ‡Ã•ES
# ============================================================

def carregar_legado(caminho: Path) -> dict:
    """
    Carrega um JSON legado (ex: final_output.json) e retorna dict
    indexado por numero_questao (string) para consulta rÃ¡pida.
    """
    with open(caminho, "r", encoding="utf-8") as f:
        dados = json.load(f)
    return {str(item["numero_questao"]): item for item in dados}


def numero_da_questao(questao: dict) -> str:
    """Retorna o nÃºmero da questÃ£o (de qualquer caderno disponÃ­vel) como string."""
    for campo in ["numero_azul", "numero_amarela", "numero_rosa", "numero_branca", "numero_cinza"]:
        if questao.get(campo) is not None:
            return str(questao[campo])
    return None


def classificar_gemini(texto: str) -> dict:
    """
    Envia texto para o Gemini Flash e retorna {"disciplina": ..., "conteudo": ...}.
    Retorna None nos campos em caso de erro.
    """
    try:
        import google.generativeai as genai

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY nÃ£o encontrada no .env")

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        prompt = PROMPT.format(
            disciplinas="\n".join(f"- {d}" for d in DISCIPLINAS_VALIDAS),
            texto=texto[:3000],  # limita tokens
        )

        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Remove blocos markdown se presentes
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        resultado = json.loads(raw.strip())

        # Valida â€” garante que a disciplina Ã© uma das aceitas
        if resultado.get("disciplina") not in DISCIPLINAS_VALIDAS:
            print(f"    âš ï¸  Disciplina invÃ¡lida recebida: '{resultado.get('disciplina')}' â€” usando fallback")
            resultado["disciplina"] = None

        return resultado

    except Exception as e:
        print(f"    âŒ Erro na IA: {e}")
        return {"disciplina": None, "conteudo": None}


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/02_classificar_ia.py <prova_id> [--legado <arquivo.json>]")
        sys.exit(1)

    prova_id    = sys.argv[1]
    pasta_prova = PROCESSADO_BASE / prova_id

    if not pasta_prova.exists():
        print(f"âŒ Pasta nÃ£o encontrada: {pasta_prova}")
        print(f"   Execute primeiro: python scripts/01_recortar_pdf.py <pdf>")
        sys.exit(1)

    # Verifica se foi passado um JSON legado
    legado_data = {}
    if "--legado" in sys.argv:
        idx = sys.argv.index("--legado") + 1
        if idx < len(sys.argv):
            caminho_legado = LEGADO_BASE / sys.argv[idx]
            if caminho_legado.exists():
                legado_data = carregar_legado(caminho_legado)
                print(f"  ðŸ“¦ Legado: {len(legado_data)} questÃµes de '{caminho_legado.name}'")
            else:
                print(f"  âš ï¸  Arquivo legado nÃ£o encontrado: {caminho_legado}")

    modo = "Legado" if legado_data else "Gemini Flash"

    print(f"\n{'='*55}")
    print(f"  Pipeline ENEM â€” Fase 2: ClassificaÃ§Ã£o IA")
    print(f"{'='*55}")
    print(f"  Prova : {prova_id}")
    print(f"  Modo  : {modo}")
    print(f"{'='*55}\n")

    # Lista arquivos de questÃµes (q*.json, ignora _sumario*.json)
    arquivos = sorted([f for f in pasta_prova.glob("q*.json")])

    if not arquivos:
        print("âŒ Nenhum arquivo q*.json encontrado. Execute a Fase 1 primeiro.")
        sys.exit(1)

    print(f"  ðŸ“‹ {len(arquivos)} questÃµes para classificar\n")

    classificadas = 0
    via_legado    = 0
    via_ia        = 0
    ja_prontas    = 0
    erros         = 0

    for arq in arquivos:
        with open(arq, "r", encoding="utf-8") as f:
            q = json.load(f)

        numero     = numero_da_questao(q)
        questao_id = q.get("questao_id", arq.stem)

        print(f"  ðŸ” {questao_id}...", end=" ", flush=True)

        # JÃ¡ classificada anteriormente â†’ pula
        if q.get("disciplina") is not None:
            print("â­ï¸  jÃ¡ classificada")
            ja_prontas += 1
            continue

        # Tenta dados do legado
        if legado_data and numero and numero in legado_data:
            item = legado_data[numero]
            q["disciplina"]         = item.get("disciplina")
            q["conteudo"]           = item.get("conteudo")
            q["fonte_classificacao"] = "legado"
            print(f"âœ… legado â†’ {q['disciplina']} / {q['conteudo']}")
            via_legado += 1

        else:
            # Classifica via IA
            texto = q.get("texto_extraido", "").strip()
            if not texto:
                print("âš ï¸  sem texto extraÃ­do")
                erros += 1
                continue

            resultado = classificar_gemini(texto)
            q["disciplina"]          = resultado.get("disciplina")
            q["conteudo"]            = resultado.get("conteudo")
            q["fonte_classificacao"] = "ia"
            print(f"âœ… ia â†’ {q['disciplina']} / {q['conteudo']}")
            via_ia += 1

            # Delay para respeitar rate limit da API (2 req/s)
            time.sleep(0.5)

        # Atualiza timestamp
        q["processado_em"] = datetime.now().isoformat()

        # Salva JSON atualizado
        with open(arq, "w", encoding="utf-8") as f:
            json.dump(q, f, ensure_ascii=False, indent=2)

        classificadas += 1

    # Atualiza sumÃ¡rio
    sumario_path = pasta_prova / "_sumario_fase1.json"
    if sumario_path.exists():
        with open(sumario_path, "r", encoding="utf-8") as f:
            sumario = json.load(f)
        sumario["fase_atual"]          = "classificacao_concluida"
        sumario["classificadas_legado"] = via_legado
        sumario["classificadas_ia"]     = via_ia
        sumario["ja_prontas"]           = ja_prontas
        sumario["erros_classificacao"]  = erros
        with open(sumario_path, "w", encoding="utf-8") as f:
            json.dump(sumario, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*55}")
    print(f"  âœ… FASE 2 CONCLUÃDA")
    print(f"  {via_legado} via legado | {via_ia} via IA | {ja_prontas} jÃ¡ prontas | {erros} erros")
    print(f"  PrÃ³ximo: python scripts/03_merge_dados.py {prova_id} <gabarito.pdf>")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()

