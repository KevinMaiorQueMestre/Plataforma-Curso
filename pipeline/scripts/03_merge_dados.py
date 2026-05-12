#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io as _io, sys as _sys
_sys.stdout = _io.TextIOWrapper(_sys.stdout.buffer, encoding='utf-8', errors='replace')
_sys.stderr = _io.TextIOWrapper(_sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
03_merge_dados.py — Fase 3 do Pipeline ENEM
Extrai o gabarito do PDF oficial e mescla nos JSONs das questões.
Gera o master.json consolidado da prova.

Uso:
    python scripts/03_merge_dados.py <prova_id> <caminho_gabarito.pdf>

Exemplo:
    python scripts/03_merge_dados.py 2025_AR_D1 ../ENEM/GABARITOS/2025_ENEM_AR_D1_GAB_AZU.pdf
"""

import fitz  # PyMuPDF
import re
import json
import sys
from pathlib import Path
from datetime import datetime

PROCESSADO_BASE = Path(__file__).parent.parent / "processado"

# Mapeamento de abreviação de cor → campo do JSON
COR_PARA_CAMPO = {
    "AZU": "resposta_azul",
    "AMA": "resposta_amarelo",
    "ROS": "resposta_rosa",
    "VER": "resposta_verde",
    "BRA": "resposta_branco",
    "CIN": "resposta_cinza",
}

COR_PARA_NUMERO = {
    "AZU": "numero_azul",
    "AMA": "numero_amarela",
    "ROS": "numero_rosa",
    "VER": "numero_verde",
    "BRA": "numero_branca",
    "CIN": "numero_cinza",
}


# ============================================================
# EXTRAÃ‡ÃƒO DO GABARITO
# ============================================================

def extrair_texto_gabarito(pdf_path: Path) -> str:
    """Extrai todo o texto do PDF de gabarito."""
    doc = fitz.open(str(pdf_path))
    texto = "\n".join(pagina.get_text("text") for pagina in doc)
    doc.close()
    return texto


def parse_gabarito_tabela(texto: str) -> dict:
    """
    EstratÃ©gia 1 â€” formato tabela ENEM com colunas por cor.
    Detecta os cabeÃ§alhos AZU/AZUL, AMA/AMARELO, ROS/ROSA, VER/VERDE
    e extrai as respostas para cada caderno.

    Retorna: {
        "AZU": {91: "C", 92: "A", ...},
        "AMA": {91: "B", ...},
        ...
    }
    """
    resultado = {cor: {} for cor in COR_PARA_CAMPO}

    # Detecta a presenÃ§a das cores no texto (o gabarito indica qual caderno)
    # PadrÃ£o: nÃºmero de questÃ£o seguido de letra de resposta
    # Cobre formatos: "91 C", "91-C", "91. C", "91)C"
    padrao_par = re.compile(r"\b(\d{1,3})\s*[-.):]?\s*([A-E])\b")

    # Tenta detectar a cor do gabarito pelo nome do arquivo (passado no texto de contexto)
    # Por padrÃ£o, assume AZU se for D1 e AMA se for D2
    # O campo cor Ã© preenchido pela funÃ§Ã£o chamadora

    pares = padrao_par.findall(texto)
    if pares:
        # Primeiro passe: detecta qual cor estÃ¡ presente no cabeÃ§alho do PDF
        cor_detectada = detectar_cor_gabarito(texto)
        for num_str, letra in pares:
            num = int(num_str)
            if 1 <= num <= 200:  # filtra nÃºmeros plausÃ­veis de questÃµes ENEM
                resultado[cor_detectada][num] = letra.upper()

    return resultado


def detectar_cor_gabarito(texto: str) -> str:
    """
    Detecta a cor do caderno a partir do texto do gabarito.
    Retorna a abreviaÃ§Ã£o: "AZU", "AMA", "ROS" ou "VER".
    """
    texto_upper = texto.upper()
    if "AZUL"    in texto_upper: return "AZU"
    if "AMARELO" in texto_upper: return "AMA"
    if "ROSA"    in texto_upper: return "ROS"
    if "VERDE"   in texto_upper: return "VER"
    # Fallback â€” extrai do nome do arquivo se disponÃ­vel
    return "AZU"


def parse_gabarito_multiversao(texto: str) -> dict:
    """
    EstratÃ©gia 2 â€” gabarito com mÃºltiplas versÃµes em uma tabela Ãºnica.
    Detecta blocos como: "AZUL ... 91 C ... 92 A" e "AMARELO ... 91 B ..."
    Retorna o mesmo formato de parse_gabarito_tabela.
    """
    resultado = {cor: {} for cor in COR_PARA_CAMPO}

    # Divide o texto por blocos de cor
    blocos = re.split(
        r"(AZUL|AMARELO|ROSA|VERDE|CADERNO\s+AZUL|CADERNO\s+AMARELO|CADERNO\s+ROSA|CADERNO\s+VERDE)",
        texto.upper()
    )

    cor_atual = None
    mapa_nome_cor = {
        "AZUL": "AZU", "CADERNO AZUL": "AZU",
        "AMARELO": "AMA", "CADERNO AMARELO": "AMA",
        "ROSA": "ROS", "CADERNO ROSA": "ROS",
        "VERDE": "VER", "CADERNO VERDE": "VER",
    }

    padrao_par = re.compile(r"\b(\d{1,3})\s*[-.):]?\s*([A-E])\b")

    for bloco in blocos:
        bloco_strip = bloco.strip()
        if bloco_strip in mapa_nome_cor:
            cor_atual = mapa_nome_cor[bloco_strip]
        elif cor_atual:
            pares = padrao_par.findall(bloco)
            for num_str, letra in pares:
                num = int(num_str)
                if 1 <= num <= 200:
                    resultado[cor_atual][num] = letra.upper()

    return resultado


def extrair_gabarito(pdf_path: Path) -> dict:
    """
    Ponto de entrada da extraÃ§Ã£o.
    Tenta a estratÃ©gia multiversÃ£o primeiro; se nÃ£o encontrar dados suficientes,
    cai para a estratÃ©gia simples de par (nÃºmero, letra).
    """
    texto = extrair_texto_gabarito(pdf_path)

    # Tenta multiversÃ£o
    resultado = parse_gabarito_multiversao(texto)
    total_multi = sum(len(v) for v in resultado.values())

    if total_multi >= 10:
        print(f"  ðŸ“‹ Gabarito multi-versÃ£o detectado ({total_multi} respostas)")
        return resultado

    # Fallback para estratÃ©gia simples
    resultado = parse_gabarito_tabela(texto)
    total_simples = sum(len(v) for v in resultado.values())
    print(f"  ðŸ“‹ Gabarito simples detectado ({total_simples} respostas)")
    return resultado


# ============================================================
# MERGE NOS JSONs
# ============================================================

def merge_gabarito(pasta_prova: Path, gabarito: dict) -> int:
    """
    Mescla as respostas do gabarito em cada q*.json da pasta.
    Retorna o total de questÃµes atualizadas.
    """
    atualizadas = 0
    arquivos = sorted([f for f in pasta_prova.glob("q*.json")])

    for arq in arquivos:
        with open(arq, "r", encoding="utf-8") as f:
            q = json.load(f)

        alterado = False
        # Limpa os campos legados de resposta por cor (caso existam)
        for k in ["resposta_azul", "resposta_amarelo", "resposta_rosa", "resposta_verde",
                  "numero_verde", "numero_amarelo", "numero_branco"]:
            q.pop(k, None)

        # Para cada cor disponivel no gabarito
        for cor, respostas in gabarito.items():
            if cor not in COR_PARA_NUMERO:
                continue
            campo_num = COR_PARA_NUMERO[cor]
            numero = q.get(campo_num)

            if numero and numero in respostas:
                q["gabarito"] = respostas[numero]
                alterado = True

        if alterado:
            q["processado_em"] = datetime.now().isoformat()
            with open(arq, "w", encoding="utf-8") as f:
                json.dump(q, f, ensure_ascii=False, indent=2)
            atualizadas += 1

    return atualizadas


# ============================================================
# GERAÃ‡ÃƒO DO MASTER.JSON
# ============================================================

def gerar_master(pasta_prova: Path, prova_id: str) -> dict:
    """
    Consolida todos os q*.json em um Ãºnico master.json.
    """
    partes = prova_id.split("_")
    ano, aplicacao, dia = int(partes[0]), partes[1], partes[2]

    arquivos = sorted([f for f in pasta_prova.glob("q*.json")])
    questoes = []
    for arq in arquivos:
        with open(arq, "r", encoding="utf-8") as f:
            q = json.load(f)
        # Remove campo interno de debug antes de consolidar
        q.pop("_meta", None)
        questoes.append(q)

    master = {
        "prova_id"      : prova_id,
        "ano"           : ano,
        "aplicacao"     : aplicacao,
        "dia"           : dia,
        "total_questoes": len(questoes),
        "gerado_em"     : datetime.now().isoformat(),
        "questoes"      : questoes,
    }

    caminho = pasta_prova / "master.json"
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(master, f, ensure_ascii=False, indent=2)

    return master


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 3:
        print("Uso: python scripts/03_merge_dados.py <prova_id> <gabarito.pdf>")
        print("Ex : python scripts/03_merge_dados.py 2025_AR_D1 ../ENEM/GABARITOS/2025_ENEM_AR_D1_GAB_AZU.pdf")
        sys.exit(1)

    prova_id    = sys.argv[1]
    gab_path    = Path(sys.argv[2])
    pasta_prova = PROCESSADO_BASE / prova_id

    if not pasta_prova.exists():
        print(f"âŒ Pasta nÃ£o encontrada: {pasta_prova}")
        print(f"   Execute as Fases 1 e 2 primeiro.")
        sys.exit(1)

    if not gab_path.exists():
        print(f"âŒ PDF de gabarito nÃ£o encontrado: {gab_path}")
        sys.exit(1)

    print(f"\n{'='*55}")
    print(f"  Pipeline ENEM â€” Fase 3: Merge de Gabarito")
    print(f"{'='*55}")
    print(f"  Prova    : {prova_id}")
    print(f"  Gabarito : {gab_path.name}")
    print(f"{'='*55}\n")

    # Extrai gabarito
    print("  ðŸ“„ Extraindo respostas do PDF de gabarito...")
    gabarito = extrair_gabarito(gab_path)

    for cor, respostas in gabarito.items():
        if respostas:
            print(f"     {cor}: {len(respostas)} respostas encontradas")

    total_respostas = sum(len(v) for v in gabarito.values())
    if total_respostas == 0:
        print("  âŒ Nenhuma resposta extraÃ­da. Verifique o PDF de gabarito.")
        sys.exit(1)

    # Merge nos JSONs
    print(f"\n  ðŸ”€ Mesclando gabarito nos JSONs das questÃµes...")
    atualizadas = merge_gabarito(pasta_prova, gabarito)
    print(f"  âœ… {atualizadas} questÃµes atualizadas com gabarito")

    # Gera master.json
    print(f"\n  ðŸ“¦ Gerando master.json...")
    master = gerar_master(pasta_prova, prova_id)
    print(f"  âœ… master.json â†’ {pasta_prova / 'master.json'}")
    print(f"     Total de questÃµes: {master['total_questoes']}")

    # Atualiza sumÃ¡rio
    sumario_path = pasta_prova / "_sumario_fase1.json"
    if sumario_path.exists():
        with open(sumario_path, "r", encoding="utf-8") as f:
            sumario = json.load(f)
        sumario["fase_atual"] = "merge_concluido"
        sumario["questoes_com_gabarito"] = atualizadas
        with open(sumario_path, "w", encoding="utf-8") as f:
            json.dump(sumario, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*55}")
    print(f"  âœ… FASE 3 CONCLUÃDA â€” master.json gerado")
    print(f"  PrÃ³ximo: python scripts/04_upload_supabase.py {prova_id}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()

