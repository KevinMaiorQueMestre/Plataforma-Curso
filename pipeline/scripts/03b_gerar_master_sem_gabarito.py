#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io as _io, sys as _sys
_sys.stdout = _io.TextIOWrapper(_sys.stdout.buffer, encoding='utf-8', errors='replace')
_sys.stderr = _io.TextIOWrapper(_sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
03b_gerar_master_sem_gabarito.py
Gera o master.json para todas as provas que ainda nao o possuem,
consolidando os q*.json existentes (sem precisar do PDF de gabarito).
Util para habilitar o upload ao Supabase das provas ja recortadas.

Uso:
    python scripts/03b_gerar_master_sem_gabarito.py
"""
import json
from pathlib import Path
from datetime import datetime

PROCESSADO_BASE = Path(__file__).parent.parent / "processado"


def gerar_master(pasta_prova: Path, prova_id: str) -> dict:
    partes = prova_id.split("_")
    ano, aplicacao, dia = int(partes[0]), partes[1], partes[2]

    arquivos = sorted(pasta_prova.glob("q*.json"))
    questoes = []
    for arq in arquivos:
        with open(arq, "r", encoding="utf-8") as f:
            q = json.load(f)
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


def main():
    pastas = sorted([
        p for p in PROCESSADO_BASE.iterdir()
        if p.is_dir() and not (p / "master.json").exists()
        and any(p.glob("q*.json"))
    ])

    print(f"\n[INFO] {len(pastas)} provas sem master.json encontradas\n")

    ok = 0
    for i, pasta in enumerate(pastas, 1):
        prova_id = pasta.name
        master = gerar_master(pasta, prova_id)
        print(f"[{i:02d}/{len(pastas):02d}] {prova_id} -> {master['total_questoes']} questoes")
        ok += 1

    print(f"\n[CONCLUIDO] {ok} master.json gerados.\n")


if __name__ == "__main__":
    main()
