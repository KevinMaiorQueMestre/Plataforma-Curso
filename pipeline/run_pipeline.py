#!/usr/bin/env python3
"""
run_pipeline.py — Processamento em Lote
Executa as fases do pipeline para uma ou varias provas de uma vez.

Uso:
    python pipeline/run_pipeline.py                    # processa todas as provas
    python pipeline/run_pipeline.py --prova 2017_AR_D2 # processa uma prova
    python pipeline/run_pipeline.py --fases 1-3        # executa fases 1 a 3
    python pipeline/run_pipeline.py --fases 5 --csv ITENS_PROVA_2017.csv

Fases:
    1 = Recorte PDF       (01_recortar_pdf.py)
    2 = Classificacao IA  (02_classificar_ia.py)
    3 = Merge Gabarito    (03_merge_dados.py)
    4 = Upload Supabase   (04_upload_supabase.py)
    5 = Enriquecimento CSV (05_enriquecer_csv.py)  [requer --csv]
"""

import subprocess
import sys
import json
from pathlib import Path

RAIZ         = Path(__file__).parent.parent
SCRIPTS      = Path(__file__).parent / "scripts"
PROVAS_DIR   = RAIZ / "ENEM" / "PROVAS"
GABARITOS_DIR= RAIZ / "ENEM" / "GABARITOS"
PROCESSADO   = Path(__file__).parent / "processado"
LEGADO       = Path(__file__).parent / "legado"
PYTHON       = sys.executable

# Mapeamento de provas já classificadas no legado (pula IA)
LEGADO_MAP = {
    "2025_AR_D1" : "final_output.json",
    "2025_AR_D2" : "final_output.json",
    "2025_2A_D1" : "final_output_ppl.json",
    "2025_2A_D2" : "final_output_ppl.json",
    "2017_AR_D2" : "final_output_2017.json",
}


def listar_provas_disponiveis() -> list[dict]:
    """Varre ENEM/PROVAS e retorna todas as provas disponíveis."""
    provas = []
    for pdf in sorted(PROVAS_DIR.glob("*.pdf")):
        partes = pdf.stem.split("_")
        if len(partes) < 6:
            continue
        ano, aplicacao, dia, cor = partes[0], partes[2], partes[3], partes[5]
        prova_id = f"{ano}_{aplicacao}_{dia}"
        gab_nome = pdf.name.replace("PROVA", "GAB")
        gab_path = GABARITOS_DIR / gab_nome
        provas.append({
            "prova_id"  : prova_id,
            "pdf_prova" : pdf,
            "pdf_gab"   : gab_path if gab_path.exists() else None,
            "cor"       : cor,
        })
    return provas


def rodar(cmd: list, descricao: str) -> bool:
    """Executa um subprocesso e retorna True se saiu com código 0."""
    print(f"\n  >> {descricao}")
    resultado = subprocess.run(cmd, capture_output=False, text=True)
    return resultado.returncode == 0


def fase1(prova: dict) -> bool:
    return rodar(
        [PYTHON, str(SCRIPTS / "01_recortar_pdf.py"), str(prova["pdf_prova"])],
        f"Fase 1 — Recorte: {prova['prova_id']}"
    )


def fase2(prova: dict) -> bool:
    prova_id = prova["prova_id"]
    legado   = LEGADO_MAP.get(prova_id)
    cmd = [PYTHON, str(SCRIPTS / "02_classificar_ia.py"), prova_id]
    if legado:
        cmd += ["--legado", legado]
    return rodar(cmd, f"Fase 2 — Classificacao IA: {prova_id}")


def fase3(prova: dict) -> bool:
    if not prova.get("pdf_gab"):
        print(f"  [WARN] Gabarito nao encontrado para {prova['prova_id']} — pulando Fase 3")
        return False
    return rodar(
        [PYTHON, str(SCRIPTS / "03_merge_dados.py"), prova["prova_id"], str(prova["pdf_gab"])],
        f"Fase 3 — Merge Gabarito: {prova['prova_id']}"
    )


def fase4(prova: dict) -> bool:
    return rodar(
        [PYTHON, str(SCRIPTS / "04_upload_supabase.py"), prova["prova_id"]],
        f"Fase 4 — Upload Supabase: {prova['prova_id']}"
    )


def fase5(prova: dict, csv_path: str = None) -> bool:
    if not csv_path:
        print("  [WARN] Fase 5 requer --csv <caminho_csv> — pulando")
        return False
    partes   = prova["prova_id"].split("_")
    dia      = partes[2] if len(partes) >= 3 else ""
    if dia not in ("D1", "D2"):
        print(f"  [WARN] Dia invalido para {prova['prova_id']} — pulando Fase 5")
        return False
    return rodar(
        [PYTHON, str(SCRIPTS / "05_enriquecer_csv.py"), prova["prova_id"], csv_path],
        f"Fase 5 — Enriquecimento CSV: {prova['prova_id']}"
    )

def processar_prova(prova: dict, fase_inicio: int = 1, fase_fim: int = 4,
                    csv_path: str = None) -> dict:
    """Processa uma prova do inicio ao fim (ou fases selecionadas)."""
    prova_id = prova["prova_id"]
    resultados = {}

    print(f"\n{'='*60}")
    print(f"  PROCESSANDO: {prova_id}  ({prova['cor']})")
    print(f"{'='*60}")

    fases = {
        1: lambda p: fase1(p),
        2: lambda p: fase2(p),
        3: lambda p: fase3(p),
        4: lambda p: fase4(p),
        5: lambda p: fase5(p, csv_path),
    }
    for num, fn in fases.items():
        if fase_inicio <= num <= fase_fim:
            ok = fn(prova)
            resultados[f"fase{num}"] = "ok" if ok else "erro"
            if not ok and num < fase_fim:
                print(f"  [ERR] Fase {num} falhou — abortando {prova_id}")
                break

    return resultados


def main():
    args = sys.argv[1:]
    prova_alvo  = None
    fase_inicio = 1
    fase_fim    = 4
    csv_path    = None

    if "--prova" in args:
        idx = args.index("--prova")
        prova_alvo = args[idx + 1] if idx + 1 < len(args) else None

    if "--fase" in args:
        idx = args.index("--fase")
        fase_inicio = fase_fim = int(args[idx + 1])

    if "--fases" in args:
        idx = args.index("--fases")
        partes = args[idx + 1].split("-")
        fase_inicio, fase_fim = int(partes[0]), int(partes[-1])

    if "--csv" in args:
        idx = args.index("--csv")
        csv_path = args[idx + 1] if idx + 1 < len(args) else None

    provas = listar_provas_disponiveis()

    if prova_alvo:
        provas = [p for p in provas if p["prova_id"] == prova_alvo]
        if not provas:
            print(f"[ERR] Prova '{prova_alvo}' nao encontrada em ENEM/PROVAS/")
            sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  Pipeline ENEM — Processamento em Lote")
    print(f"{'='*60}")
    print(f"  Provas encontradas : {len(provas)}")
    print(f"  Fases a executar   : {fase_inicio} a {fase_fim}")
    print(f"{'='*60}")

    relatorio = {}
    for prova in provas:
        resultado = processar_prova(prova, fase_inicio, fase_fim, csv_path)
        relatorio[prova["prova_id"]] = resultado

    # Salva relatório de execução
    rel_path = Path(__file__).parent / "_relatorio_lote.json"
    with open(rel_path, "w", encoding="utf-8") as f:
        json.dump(relatorio, f, ensure_ascii=False, indent=2)

    # Resumo final
    print(f"\n{'='*60}")
    print(f"  RELATORIO FINAL")
    print(f"{'='*60}")
    ok_total  = sum(1 for r in relatorio.values() if all(v == "ok" for v in r.values()))
    err_total = len(relatorio) - ok_total
    print(f"  Provas OK    : {ok_total}")
    print(f"  Provas Erro  : {err_total}")
    print(f"  Relatorio    : {rel_path}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
