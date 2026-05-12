#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import io as _io, sys as _sys
_sys.stdout = _io.TextIOWrapper(_sys.stdout.buffer, encoding='utf-8', errors='replace')
_sys.stderr = _io.TextIOWrapper(_sys.stderr.buffer, encoding='utf-8', errors='replace')
"""
04_upload_supabase.py â€” Fase 4 do Pipeline ENEM
Faz upload das imagens para o Supabase Storage e insere
os metadados na tabela questoes_enem via REST API.

Usa requests (jÃ¡ instalado) diretamente na API REST do Supabase,
sem precisar do pacote supabase-py.

Uso:
    python scripts/04_upload_supabase.py <prova_id>

Exemplo:
    python scripts/04_upload_supabase.py 2025_AR_D1

PrÃ©-requisitos no .env da raiz:
    SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
    SUPABASE_KEY=eyJ...  (anon key ou service_role key)
    SUPABASE_BUCKET=questoes-enem
"""

import json
import sys
import os
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent.parent / ".env")
except ImportError:
    pass

PROCESSADO_BASE = Path(__file__).parent.parent / "processado"

# ============================================================
# CONFIGURAÃ‡ÃƒO SUPABASE
# ============================================================

def get_config() -> dict:
    """LÃª as variÃ¡veis de ambiente necessÃ¡rias."""
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = (
        os.getenv("SUPABASE_SERVICE_KEY") or
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY", "")
    )
    bucket = os.getenv("SUPABASE_BUCKET", "questoes-enem")

    if not url or not key:
        print("âŒ SUPABASE_URL e SUPABASE_KEY precisam estar no arquivo .env")
        sys.exit(1)

    return {"url": url, "key": key, "bucket": bucket}


def headers(cfg: dict, content_type: str = "application/json") -> dict:
    """Monta os headers padrÃ£o para as chamadas Ã  API do Supabase."""
    return {
        "apikey"       : cfg["key"],
        "Authorization": f"Bearer {cfg['key']}",
        "Content-Type" : content_type,
    }


# ============================================================
# UPLOAD DE IMAGEM â†’ SUPABASE STORAGE
# ============================================================

def upload_imagem(cfg: dict, pasta: Path, nome_img: str, prova_id: str) -> str | None:
    """
    Faz upload de uma imagem PNG para o Supabase Storage.
    Retorna a URL pÃºblica ou None em caso de erro.
    Caminho no bucket: {prova_id}/{nome_img}
    """
    caminho_local = pasta / nome_img
    if not caminho_local.exists():
        print(f"    âš ï¸  Imagem nÃ£o encontrada: {caminho_local}")
        return None

    storage_path = f"{prova_id}/{nome_img}"
    url = f"{cfg['url']}/storage/v1/object/{cfg['bucket']}/{storage_path}"

    with open(caminho_local, "rb") as f:
        dados = f.read()

    resp = requests.post(
        url,
        data=dados,
        headers={
            "apikey"        : cfg["key"],
            "Authorization" : f"Bearer {cfg['key']}",
            "Content-Type"  : "image/png",
            "x-upsert"      : "true",    # sobrescreve se jÃ¡ existir
        },
        timeout=30,
    )

    if resp.status_code in (200, 201):
        url_publica = f"{cfg['url']}/storage/v1/object/public/{cfg['bucket']}/{storage_path}"
        return url_publica
    else:
        print(f"    âŒ Erro no upload: {resp.status_code} â€” {resp.text[:200]}")
        return None


# ============================================================
# UPSERT DE METADADOS â†’ TABELA questoes_enem
# ============================================================

def upsert_questao(cfg: dict, questao: dict) -> bool:
    """
    Insere ou atualiza uma questÃ£o na tabela questoes_enem.
    Usa upsert (on conflict â†’ update) pelo campo questao_id.
    """
    url = f"{cfg['url']}/rest/v1/questoes_enem"

    # Campos aceitos pela tabela questoes_enem
    CAMPOS_TABELA = {
        "questao_id", "imagem_url", "ano", "aplicacao", "dia",
        "numero_azul", "numero_amarela", "numero_rosa", "numero_cinza", "numero_branca",
        "disciplina", "conteudo", "gabarito",
        "tri_a", "tri_b", "tri_c",
        "co_item", "co_habilidade", "item_anulado",
    }

    # Remove campos internos e filtra apenas campos conhecidos
    payload = {k: v for k, v in questao.items()
               if not k.startswith("_") and k in CAMPOS_TABELA}

    # imagem_url pode ter sido setada antes via upload; garantir que existe no payload
    if "imagem_url" not in payload:
        payload["imagem_url"] = questao.get("imagem_url")

    # Usa upsert baseado na coluna questao_id
    url = f"{cfg['url']}/rest/v1/questoes_enem?on_conflict=questao_id"
    
    resp = requests.post(
        url,
        json=payload,
        headers={
            **headers(cfg),
            "Prefer": "resolution=merge-duplicates",  # upsert
        },
        timeout=15,
    )

    if resp.status_code not in (200, 201):
        print(f"\n    [DETALHE ERRO DB] {resp.status_code}: {resp.text[:200]}", flush=True)

    return resp.status_code in (200, 201)


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/04_upload_supabase.py <prova_id>")
        print("Ex : python scripts/04_upload_supabase.py 2025_AR_D1")
        sys.exit(1)

    prova_id    = sys.argv[1]
    pasta_prova = PROCESSADO_BASE / prova_id
    master_path = pasta_prova / "master.json"

    if not master_path.exists():
        print(f"âŒ master.json nÃ£o encontrado em {pasta_prova}")
        print(f"   Execute as Fases 1, 2 e 3 primeiro.")
        sys.exit(1)

    cfg = get_config()

    print(f"\n{'='*55}")
    print(f"  Pipeline ENEM â€” Fase 4: Upload Supabase")
    print(f"{'='*55}")
    print(f"  Prova  : {prova_id}")
    print(f"  Bucket : {cfg['bucket']}")
    print(f"  URL    : {cfg['url']}")
    print(f"{'='*55}\n")

    # Carrega master.json
    with open(master_path, "r", encoding="utf-8") as f:
        master = json.load(f)

    questoes = master["questoes"]
    print(f"  ðŸ“‹ {len(questoes)} questÃµes para fazer upload\n")

    ok_img  = 0
    ok_db   = 0
    erros   = 0

    for q in questoes:
        questao_id = q.get("questao_id", "?")
        nome_img   = q.get("imagem")

        print(f"  â¬†ï¸  {questao_id}...", end=" ", flush=True)

        # 1. Upload da imagem
        url_publica = None
        if nome_img:
            url_publica = upload_imagem(cfg, pasta_prova, nome_img, prova_id)
            if url_publica:
                q["imagem_url"] = url_publica
                ok_img += 1

        # 2. Upsert dos metadados
        sucesso = upsert_questao(cfg, q)
        if sucesso:
            ok_db += 1
            print(f"âœ… img+db")
        else:
            erros += 1
            print(f"âš ï¸  db falhou")

    # Atualiza master.json com as URLs pÃºblicas
    master["questoes"] = questoes
    master["upload_concluido_em"] = __import__("datetime").datetime.now().isoformat()
    with open(master_path, "w", encoding="utf-8") as f:
        json.dump(master, f, ensure_ascii=False, indent=2)

    # Atualiza sumÃ¡rio
    sumario_path = pasta_prova / "_sumario_fase1.json"
    if sumario_path.exists():
        with open(sumario_path, "r", encoding="utf-8") as f:
            sumario = json.load(f)
        sumario["fase_atual"]     = "upload_concluido"
        sumario["imagens_ok"]     = ok_img
        sumario["db_ok"]          = ok_db
        sumario["erros_upload"]   = erros
        with open(sumario_path, "w", encoding="utf-8") as f:
            json.dump(sumario, f, ensure_ascii=False, indent=2)

    print(f"\n{'='*55}")
    print(f"  âœ… FASE 4 CONCLUÃDA")
    print(f"  Imagens: {ok_img}/{len(questoes)} | Banco: {ok_db}/{len(questoes)} | Erros: {erros}")
    print(f"{'='*55}\n")

    if erros > 0:
        print("  âš ï¸  HÃ¡ erros. Verifique:")
        print("     1. SUPABASE_URL e SUPABASE_KEY no .env")
        print("     2. Se a tabela 'questoes_enem' existe no Supabase")
        print(f"     3. Se o bucket '{cfg['bucket']}' existe e Ã© pÃºblico")


if __name__ == "__main__":
    main()

