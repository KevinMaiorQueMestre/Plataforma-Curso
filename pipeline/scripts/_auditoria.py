#!/usr/bin/env python3
"""Auditoria completa do schema e dados de todos os JSONs processados."""
import json
from pathlib import Path
from collections import defaultdict

PROCESSADO = Path(__file__).parent.parent / "processado"

CAMPOS_OBRIGATORIOS = [
    "questao_id", "imagem", "ano", "aplicacao", "dia",
    "numero_azul", "numero_amarela", "numero_rosa", "numero_branca", "numero_cinza",
    "disciplina", "conteudo", "gabarito",
    "tri_a", "tri_b", "tri_c",
    "fonte_classificacao", "texto_extraido", "processado_em", "_meta",
]
ORDEM_NUMEROS = ["numero_azul", "numero_amarela", "numero_rosa", "numero_branca", "numero_cinza"]
CAMPOS_LEGADOS = ["numero_verde", "numero_amarelo", "numero_branco",
                  "resposta_azul", "resposta_amarelo", "resposta_rosa", "resposta_verde"]

erros = defaultdict(list)
stats = defaultdict(lambda: defaultdict(int))

for arq in sorted(PROCESSADO.glob("*/q*.json")):
    prova = arq.parent.name
    try:
        q = json.load(open(arq, encoding="utf-8"))
    except Exception as e:
        erros[prova].append(f"{arq.name}: JSON invalido ({e})")
        continue

    stats[prova]["total"] += 1

    # Campos obrigatorios ausentes
    for campo in CAMPOS_OBRIGATORIOS:
        if campo not in q:
            erros[prova].append(f"{arq.name}: campo ausente [{campo}]")

    # Campos legados nao deveriam existir
    for legado in CAMPOS_LEGADOS:
        if legado in q:
            erros[prova].append(f"{arq.name}: campo legado [{legado}]")

    # Ordem dos numero_*
    chaves = list(q.keys())
    indices = []
    for campo in ORDEM_NUMEROS:
        try:
            indices.append(chaves.index(campo))
        except ValueError:
            indices.append(-1)
    if indices != sorted(indices):
        erros[prova].append(f"{arq.name}: ordem errada dos numero_*")

    # Cobertura
    if q.get("gabarito"):
        stats[prova]["com_gabarito"] += 1
    if q.get("co_item"):
        stats[prova]["com_co_item"] += 1
    if q.get("tri_a"):
        stats[prova]["com_tri"] += 1
    if q.get("disciplina"):
        stats[prova]["com_disciplina"] += 1

# Resultado
total_provas = len(stats)
total_q = sum(s["total"] for s in stats.values())

print(f"\n{'='*65}")
print(f"  AUDITORIA DE SCHEMA — Pipeline ENEM")
print(f"{'='*65}")
print(f"  Provas analisadas : {total_provas}")
print(f"  Questoes totais   : {total_q}")

if erros:
    print(f"\n  === PROBLEMAS ENCONTRADOS ({len(erros)} provas) ===")
    for prova in sorted(erros.keys()):
        msgs = erros[prova]
        print(f"  {prova}: {len(msgs)} erro(s)")
        for m in msgs[:3]:
            print(f"    - {m}")
        if len(msgs) > 3:
            print(f"    ... +{len(msgs)-3} mais")
else:
    print(f"\n  [OK] SCHEMA PERFEITO — nenhum erro encontrado!")

print(f"\n  {'Prova':<18} {'Total':>5} {'Gab%':>6} {'Item%':>6} {'TRI%':>5} {'IA%':>5}")
print(f"  {'-'*50}")
for prova in sorted(stats.keys()):
    s = stats[prova]
    t = s["total"]
    def pct(n):
        return f"{n/t*100:.0f}%" if t else "  0%"
    print(f"  {prova:<18} {t:>5} {pct(s['com_gabarito']):>6} {pct(s['com_co_item']):>6} {pct(s['com_tri']):>5} {pct(s['com_disciplina']):>5}")

print(f"\n{'='*65}\n")
