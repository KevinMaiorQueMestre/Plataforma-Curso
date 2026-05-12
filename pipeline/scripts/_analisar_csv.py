import csv
from collections import defaultdict

CSV = r'C:\Users\Marcia Cristina\Downloads\microdados_enem_2017\DADOS\ITENS_PROVA_2017.csv'

rows = []
with open(CSV, encoding='latin-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        rows.append(row)

print(f"Total de linhas: {len(rows)}")
print(f"Areas: {sorted(set(r['SG_AREA'] for r in rows))}")
print(f"Cores: {sorted(set(r['TX_COR'] for r in rows))}")

# Provas CN AMARELA (D2 regular)
cn_ama = [r for r in rows if r['SG_AREA'] == 'CN' and r['TX_COR'] == 'AMARELA']
provas_cn = sorted(set(r['CO_PROVA'] for r in cn_ama))
print(f"\nCO_PROVA em CN AMARELA: {provas_cn}")

por_prova = defaultdict(list)
for r in cn_ama:
    por_prova[r['CO_PROVA']].append(r)

for p, itens in sorted(por_prova.items()):
    posicoes = sorted(set(int(r['CO_POSICAO']) for r in itens))
    print(f"  CO_PROVA {p}: {len(itens)} itens | posicoes {posicoes[0]}-{posicoes[-1]}")

# Mostrar primeiros 5 itens da maior prova CN AMARELA
prova_ref = max(por_prova, key=lambda p: len(por_prova[p]))
print(f"\nExemplo - CO_PROVA {prova_ref} CN AMARELA (primeiros 5 itens):")
itens_ord = sorted(por_prova[prova_ref], key=lambda r: int(r['CO_POSICAO']))
for r in itens_ord[:5]:
    pos = r['CO_POSICAO']
    item = r['CO_ITEM']
    gab = r['TX_GABARITO']
    hab = r['CO_HABILIDADE']
    a = r['NU_PARAM_A']
    b = r['NU_PARAM_B']
    c = r['NU_PARAM_C']
    aban = r['IN_ITEM_ABAN']
    lingua = r['TP_LINGUA']
    adaptado = r['IN_ITEM_ADAPTADO']
    print(f"  pos={pos} | CO_ITEM={item} | GAB={gab} | HABILIDADE={hab} | A={a} B={b} C={c} | ABAN={aban} | LINGUA={lingua} | ADAPTADO={adaptado}")

# Quantas areas x cores unicas
print("\n=== Contagem por AREA x COR ===")
comb = defaultdict(int)
for r in rows:
    comb[(r['SG_AREA'], r['TX_COR'])] += 1
for (area, cor), n in sorted(comb.items()):
    print(f"  {area} / {cor}: {n}")

# Verificar CO_HABILIDADE range
habs = sorted(set(int(r['CO_HABILIDADE']) for r in rows if r['CO_HABILIDADE']))
print(f"\nCO_HABILIDADE range: {habs[0]} a {habs[-1]} ({len(habs)} habilidades distintas)")

# Itens abandonados
aban = [r for r in rows if r['IN_ITEM_ABAN'] == '1']
print(f"Itens anulados (IN_ITEM_ABAN=1): {len(aban)}")

# Linguas
langs = sorted(set(r['TP_LINGUA'] for r in rows if r['TP_LINGUA']))
print(f"TP_LINGUA values: {langs}")
