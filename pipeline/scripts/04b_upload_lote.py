#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
04b_upload_lote.py — Upload em lote de todas as provas processadas

Itera por todas as pastas em pipeline/processado/ e executa
o script 04_upload_supabase.py para cada uma.

Uso:
    python scripts/04b_upload_lote.py [--prova 2017_AR_D2]

Sem argumento → processa todas as 48 pastas.
Com --prova   → processa apenas a prova especificada.
"""

import sys
import os
import json
import subprocess
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

import requests

PROCESSADO_BASE = Path(__file__).parent.parent / "processado"
SCRIPT_UPLOAD   = Path(__file__).parent / "04_upload_supabase.py"

# ============================================================
# CRIAR BUCKET SE NÃO EXISTIR
# ============================================================

def garantir_bucket(cfg: dict) -> bool:
    """Verifica acesso ao bucket. Bucket ja criado via SQL/Dashboard."""
    bucket = cfg["bucket"]
    # Testa acesso fazendo list do bucket
    url_test = f"{cfg['url']}/storage/v1/object/list/{bucket}"
    resp = requests.post(
        url_test,
        json={"prefix": "", "limit": 1},
        headers={
            "apikey": cfg["key"],
            "Authorization": f"Bearer {cfg['key']}",
            "Content-Type": "application/json",
        },
        timeout=10,
    )
    if resp.status_code in (200, 201):
        print(f"  [OK] Bucket '{bucket}' acessivel.")
        return True
    else:
        # Tenta mesmo assim — bucket publico permite upload mesmo sem list
        print(f"  [AVISO] List do bucket retornou {resp.status_code}. Tentando upload mesmo assim...")
        return True


def get_config() -> dict:
    url    = os.getenv("SUPABASE_URL", "").rstrip("/")
    # Tenta service_role primeiro (mais permissivo para uploads), depois anon
    key    = (
        os.getenv("SUPABASE_SERVICE_KEY") or
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY", "")
    )
    bucket = os.getenv("SUPABASE_BUCKET", "questoes-enem")

    if not url or not key:
        print("[ERRO] SUPABASE_URL e SUPABASE_ANON_KEY (ou SUPABASE_KEY) precisam estar no .env")
        sys.exit(1)

    return {"url": url, "key": key, "bucket": bucket}


# ============================================================
# MAIN
# ============================================================

def main():
    cfg = get_config()

    # Argumento opcional: --prova 2017_AR_D2
    prova_filtro = None
    if "--prova" in sys.argv:
        idx = sys.argv.index("--prova")
        if idx + 1 < len(sys.argv):
            prova_filtro = sys.argv[idx + 1]

    print("\n" + "="*60)
    print("  Pipeline ENEM - Upload em Lote (Fase 0)")
    print("="*60)

    # 1. Garantir bucket
    print("\n[>>] Verificando bucket de Storage...")
    if not garantir_bucket(cfg):
        sys.exit(1)

    # 2. Listar provas
    if prova_filtro:
        pastas = [PROCESSADO_BASE / prova_filtro]
        if not pastas[0].exists():
            print(f"[ERRO] Pasta nao encontrada: {pastas[0]}")
            sys.exit(1)
    else:
        pastas = sorted([
            p for p in PROCESSADO_BASE.iterdir()
            if p.is_dir() and (p / "master.json").exists()
        ])

    print(f"\n[INFO] {len(pastas)} prova(s) para processar\n")

    resultados = []
    for i, pasta in enumerate(pastas, 1):
        prova_id = pasta.name
        print(f"[{i:02d}/{len(pastas):02d}] {prova_id}")

        # Verifica se já foi feito upload (campo upload_concluido_em no master.json)
        master_path = pasta / "master.json"
        with open(master_path, "r", encoding="utf-8") as f:
            master = json.load(f)

        if master.get("upload_concluido_em") and master.get("questoes") and any(q.get("imagem_url") for q in master["questoes"]):
            print(f"       [SKIP] Ja processado em {master['upload_concluido_em'][:10]} -- pulando.")
            resultados.append({"prova": prova_id, "status": "pulado"})
            continue

        # Executa o script de upload para esta prova
        proc = subprocess.run(
            [sys.executable, str(SCRIPT_UPLOAD), prova_id],
            capture_output=False,
            text=True,
        )

        if proc.returncode == 0:
            resultados.append({"prova": prova_id, "status": "ok"})
        else:
            resultados.append({"prova": prova_id, "status": "erro"})

    # Relatório final
    ok      = [r for r in resultados if r["status"] == "ok"]
    pulados = [r for r in resultados if r["status"] == "pulado"]
    erros   = [r for r in resultados if r["status"] == "erro"]

    print("\n" + "="*60)
    print(f"  [CONCLUIDO] LOTE FINALIZADO")
    print(f"  Processados : {len(ok)}")
    print(f"  Ja feitos   : {len(pulados)}")
    print(f"  Com erro    : {len(erros)}")
    if erros:
        print(f"  Erros       : {[e['prova'] for e in erros]}")
    print("="*60 + "\n", flush=True)


if __name__ == "__main__":
    main()
