#!/usr/bin/env python3
"""
05_enriquecer_csv.py – Fase 5 do Pipeline ENEM
Enriquece os JSONs das questoes com dados oficiais do CSV de microdados do INEP:
  - co_item, co_habilidade, tri_a/b/c, item_anulado, lingua
  - numero_azul/amarelo/rosa/verde completos para todas as cores

Uso:
    python scripts/05_enriquecer_csv.py <prova_id> <caminho_csv>

Exemplo:
    python scripts/05_enriquecer_csv.py 2017_AR_D2 "C:/Users/.../ITENS_PROVA_2017.csv"
"""

import csv
import json
import sys
from pathlib import Path
from collections import defaultdict

PROCESSADO_BASE = Path(__file__).parent.parent / "processado"

# Cores que usamos nos JSONs (CSV → abreviação)
COR_CSV = {
    "AMARELA": "AMA",
    "AZUL":    "AZU",
    "ROSA":    "ROS",
    "BRANCA":  "BRA",
    "CINZA":   "CIN",
}
# Campo numero_cor por abreviação
CAMPO_NUMERO = {
    "AMA": "numero_amarela",
    "AZU": "numero_azul",
    "ROS": "numero_rosa",
    "BRA": "numero_branca",
    "CIN": "numero_cinza",
}

AREAS_D1 = {"CH", "LC"}
AREAS_D2 = {"CN", "MT"}

# D2: questoes 91–180; D1: 1–90 (offsets possiveis para cada area: 90 ou 135)
OFFSETS_D2 = [90, 135]   # area primeira (91-135) ou segunda (136-180)
OFFSETS_D1 = [0,  45]   # area primeira (1-45) ou segunda (46-90)
# LC tem 50 questoes (45 regular + 5 LE), offset 0 ou 45 para D1


# ============================================================
# CARGA E INDEXACAO DO CSV
# ============================================================

def carregar_csv(caminho: Path) -> list:
    rows = []
    with open(caminho, encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            rows.append(row)
    return rows


def indexar(rows: list) -> tuple:
    """
    por_prova  : {CO_PROVA: {CO_POSICAO(int): row}}
    por_item   : {CO_ITEM: [row, ...]}
    provas_ac  : {(SG_AREA, cor_abrev): set(CO_PROVA)}
    """
    por_prova = defaultdict(dict)
    por_item  = defaultdict(list)
    provas_ac = defaultdict(set)

    for row in rows:
        prova = row["CO_PROVA"]
        pos   = int(row["CO_POSICAO"])
        area  = row["SG_AREA"]
        cor   = COR_CSV.get(row["TX_COR"])

        por_prova[prova][pos] = row
        por_item[row["CO_ITEM"]].append(row)

        if cor:
            provas_ac[(area, cor)].add(prova)

    return por_prova, por_item, provas_ac


# ============================================================
# DETECCAO DE OFFSET (area 1ª ou 2ª no caderno)
# ============================================================

def detectar_offset(jsons: list, cor_abrev: str, area: str,
                    provas_candidatas: set, por_prova: dict, dia: str) -> tuple:
    """
    Tenta cada (CO_PROVA, offset) e verifica se os gabaritos do CSV batem
    com os gabaritos dos JSONs ja processados.

    Retorna (CO_PROVA, offset) com melhor correspondencia, ou (None, None).
    """
    campo_num = CAMPO_NUMERO[cor_abrev]
    offsets   = OFFSETS_D2 if dia == "D2" else OFFSETS_D1

    # Filtra JSONs que tem o numero desta cor e gabarito preenchido
    candidatos_json = [
        q for q in jsons
        if q.get(campo_num) is not None and q.get("gabarito")
    ]
    if not candidatos_json:
        return None, None

    melhor_prova, melhor_offset, melhor_score = None, None, -1

    for prova in provas_candidatas:
        itens_prova = por_prova.get(prova, {})
        for offset in offsets:
            acertos = 0
            tentativas = 0
            for q in candidatos_json:
                num_cor = q[campo_num]
                posicao = num_cor - offset
                if posicao < 1:
                    continue
                row = itens_prova.get(posicao)
                if row is None:
                    continue
                tentativas += 1
                if row["TX_GABARITO"] == q["gabarito"]:
                    acertos += 1

            if tentativas >= 5:  # minimo de comparacoes para confiar
                score = acertos / tentativas
                if score > melhor_score:
                    melhor_score  = score
                    melhor_prova  = prova
                    melhor_offset = offset

    if melhor_score >= 0.85:
        print(f"    [MATCH] area={area} cor={cor_abrev} prova={melhor_prova} "
              f"offset={melhor_offset} score={melhor_score:.0%}")
        return melhor_prova, melhor_offset

    print(f"    [WARN] Sem match para area={area} cor={cor_abrev} "
          f"(melhor score={melhor_score:.0%})")
    return None, None


# ============================================================
# ENRIQUECIMENTO DOS JSONs
# ============================================================

def enriquecer(pasta: Path, csv_path: Path, dia: str) -> int:
    areas = AREAS_D2 if dia == "D2" else AREAS_D1

    print(f"\n  Carregando CSV...")
    rows = carregar_csv(csv_path)
    por_prova, por_item, provas_ac = indexar(rows)

    # Carrega todos os JSONs da pasta
    arquivos = sorted(pasta.glob("q*.json"))
    jsons = []
    for arq in arquivos:
        with open(arq, encoding="utf-8") as f:
            jsons.append((arq, json.load(f)))

    print(f"  {len(jsons)} questoes encontradas\n")

    # Para cada area × cor, descobre o CO_PROVA e offset corretos
    mapeamento = {}   # {(area, cor): (CO_PROVA, offset)}

    for area in areas:
        for cor_abrev in COR_CSV.values():
            candidatas = provas_ac.get((area, cor_abrev), set())
            if not candidatas:
                continue
            todos_jsons = [q for _, q in jsons]
            prova, offset = detectar_offset(
                todos_jsons, cor_abrev, area, candidatas, por_prova, dia
            )
            if prova:
                mapeamento[(area, cor_abrev)] = (prova, offset)

    # Enriquece cada JSON
    atualizados = 0
    for arq, q in jsons:
        # Determina area da questao: precisa de pelo menos 1 cor mapeada
        area_detectada = None
        co_item_detectado = None
        row_ref = None

        # Tenta encontrar o CO_ITEM via qualquer cor que tenhamos mapeado
        for cor_abrev, campo_num in CAMPO_NUMERO.items():
            num_cor = q.get(campo_num)
            if num_cor is None:
                continue
            for area in areas:
                chave = (area, cor_abrev)
                if chave not in mapeamento:
                    continue
                prova, offset = mapeamento[chave]
                posicao = num_cor - offset
                row = por_prova.get(prova, {}).get(posicao)
                if row:
                    area_detectada   = area
                    co_item_detectado = row["CO_ITEM"]
                    row_ref = row
                    break
            if row_ref:
                break

        if row_ref is None:
            print(f"  [SKIP] {arq.name}: sem correspondencia no CSV")
            continue

        # Dados comuns a todos os itens (iguais em qualquer cor)
        q["co_item"]      = int(co_item_detectado)
        q["co_habilidade"]= int(row_ref["CO_HABILIDADE"]) if row_ref["CO_HABILIDADE"] else None
        q["tri_a"]        = float(row_ref["NU_PARAM_A"].replace(",", ".")) if row_ref["NU_PARAM_A"] else None
        q["tri_b"]        = float(row_ref["NU_PARAM_B"].replace(",", ".")) if row_ref["NU_PARAM_B"] else None
        q["tri_c"]        = float(row_ref["NU_PARAM_C"].replace(",", ".")) if row_ref["NU_PARAM_C"] else None
        q["item_anulado"] = row_ref["IN_ITEM_ABAN"] == "1"

        # Lingua estrangeira: so para LC
        if area_detectada == "LC":
            tp = row_ref.get("TP_LINGUA", "")
            if tp == "0":
                q["lingua"] = "ingles"
            elif tp == "1":
                q["lingua"] = "espanhol"
            else:
                q["lingua"] = None
        else:
            q.pop("lingua", None)   # remove campo se nao for LC

        # Preenche numero_cor para todas as cores a partir do CO_ITEM.
        # Para cores cujo offset nao foi confirmado por gabarito, deduz o offset
        # a partir do CO_POSICAO da cor-referencia ja confirmada (area_detectada).
        # Logica: offset = numero_absoluto_referencia - CO_POSICAO_referencia
        # (usando o numero_amarela ja conhecido e o CO_POSICAO do item no CSV AMA)
        offset_por_area = {}
        for row_ref2 in por_item.get(co_item_detectado, []):
            if row_ref2["SG_AREA"] != area_detectada:
                continue
            cor2 = COR_CSV.get(row_ref2["TX_COR"])
            if cor2 is None:
                continue
            chave2 = (area_detectada, cor2)
            if chave2 in mapeamento:
                _, off = mapeamento[chave2]
                offset_por_area[(area_detectada, cor2)] = off

        for row_cor in por_item.get(co_item_detectado, []):
            cor_csv_nome = row_cor["TX_COR"]
            cor_abrev    = COR_CSV.get(cor_csv_nome)
            if cor_abrev is None:
                continue
            area_row  = row_cor["SG_AREA"]
            chave     = (area_row, cor_abrev)
            posicao_cor = int(row_cor["CO_POSICAO"])

            # Tenta usar offset ja confirmado por gabarito
            if chave in mapeamento:
                _, offset_cor = mapeamento[chave]
            elif chave in offset_por_area:
                offset_cor = offset_por_area[chave]
            else:
                # Deduz offset pelo numero ja conhecido nesta cor (se disponivel)
                campo_existente = CAMPO_NUMERO.get(cor_abrev)
                num_existente   = q.get(campo_existente) if campo_existente else None
                if num_existente:
                    offset_cor = num_existente - posicao_cor
                else:
                    # Usa o offset da cor de referencia (AMA) como aproximacao
                    # valida quando a ordem das areas e a mesma no caderno
                    ref_cor = "AMA"
                    ref_chave = (area_row, ref_cor)
                    if ref_chave in mapeamento:
                        _, offset_cor = mapeamento[ref_chave]
                    else:
                        continue

            numero_abs = posicao_cor + offset_cor
            campo      = CAMPO_NUMERO[cor_abrev]
            q[campo]   = numero_abs


        with open(arq, "w", encoding="utf-8") as f:
            json.dump(q, f, ensure_ascii=False, indent=2)
        atualizados += 1

    return atualizados


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 3:
        print("Uso: python scripts/05_enriquecer_csv.py <prova_id> <csv>")
        print("Ex : python scripts/05_enriquecer_csv.py 2017_AR_D2 ITENS_PROVA_2017.csv")
        sys.exit(1)

    prova_id = sys.argv[1]          # ex: 2017_AR_D2
    csv_path = Path(sys.argv[2])
    pasta    = PROCESSADO_BASE / prova_id

    partes = prova_id.split("_")
    dia    = partes[2]   # D1 ou D2

    if not pasta.exists():
        print(f"Pasta nao encontrada: {pasta}")
        sys.exit(1)
    if not csv_path.exists():
        print(f"CSV nao encontrado: {csv_path}")
        sys.exit(1)

    print(f"\n{'='*55}")
    print(f"  Pipeline ENEM – Fase 5: Enriquecimento CSV")
    print(f"{'='*55}")
    print(f"  Prova : {prova_id}  |  Dia: {dia}")
    print(f"  CSV   : {csv_path.name}")
    print(f"{'='*55}")

    n = enriquecer(pasta, csv_path, dia)

    print(f"\n{'='*55}")
    print(f"  FASE 5 CONCLUIDA – {n} questoes enriquecidas")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
