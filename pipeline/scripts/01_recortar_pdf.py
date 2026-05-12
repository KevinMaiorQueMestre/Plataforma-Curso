#!/usr/bin/env python3
"""
01_recortar_pdf.py - Fase 1 do Pipeline ENEM
Recorta cada questao do PDF como PNG em alta resolucao.
Detecta a linha vertical impressa que divide as colunas para recortes precisos.

Uso:
    python scripts/01_recortar_pdf.py <caminho_do_pdf>
    python scripts/01_recortar_pdf.py <caminho_do_pdf> --questoes 91,92,93,94

Exemplos:
    python scripts/01_recortar_pdf.py ../ENEM/PROVAS/2025_ENEM_AR_D1_PROVA_AZU.pdf
    python scripts/01_recortar_pdf.py ../ENEM/PROVAS/2017_ENEM_AR_D2_PROVA_AMA.pdf --questoes 91,92,93,94
"""

import fitz  # PyMuPDF
import re
import json
import sys
import struct
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIGURACOES
# ============================================================
SCALE            = 3.0   # 3x upscale ~ 216 DPI
HEADER_HEIGHT_PT = 55    # fallback cabecalho (pts)
FOOTER_HEIGHT_PT = 45    # fallback rodape (pts)
COLUMN_PADDING   = 4     # margem lateral (borda externa da pagina)
LINE_PADDING     = 2     # margem em relacao a linha divisoria central
PADDING_TOP      = 2     # espaco acima do texto QUESTAO
PADDING_BOT      = 6     # espaco entre questoes

OUTPUT_BASE = Path(__file__).parent.parent / "processado"
ANCORA_RE   = re.compile(r"QUEST[AÃÀ]O\s+(\d+)", re.IGNORECASE)
# Regex para alternativas: A, B, C, D ou E no início da linha ou bloco
# Aceita formatos: "A ", "A.", "A-", "A)", "(A)", "● A"
ALT_RE = re.compile(r"^([A-E])[\s\t.)-]", re.IGNORECASE)


# ============================================================
# FUNCOES
# ============================================================

def parse_nome_pdf(caminho: Path) -> dict:
    """Extrai metadados do nome do arquivo: ANO_ENEM_APLICACAO_DIA_PROVA_COR.pdf"""
    p = caminho.stem.split("_")
    return {"ano": int(p[0]), "aplicacao": p[2], "dia": p[3], "cor": p[5]}


def margens_pagina(pagina: fitz.Page) -> tuple:
    """
    Detecta dinamicamente y_header_bottom e y_footer_top.
    Usa fallback de constantes se a deteccao falhar.
    """
    h = pagina.rect.height
    blocos = pagina.get_text("blocks")
    ys = sorted([b[1] for b in blocos]) if blocos else []

    y_header = HEADER_HEIGHT_PT
    y_footer = h - FOOTER_HEIGHT_PT

    if ys:
        # Cabecalho: cluster de blocos no topo 20% da pagina
        primeiro = ys[0]
        if primeiro < h * 0.20:
            fim_cluster = primeiro
            for y in ys:
                if y - primeiro < 30:
                    fim_cluster = y
                else:
                    break
            y_header = max(y_header, fim_cluster + 5)

        # Rodape: ultimo bloco abaixo de 80% da pagina
        ys_inv = sorted([b[3] for b in blocos], reverse=True)
        ultimo = ys_inv[0]
        if ultimo > h * 0.80:
            y_footer = min(y_footer, ultimo - 5)

    return y_header, y_footer


# Cache da linha divisoria por id de pagina (evita chamar get_drawings multiplas vezes)
_cache_linha: dict = {}


def detectar_linha_divisoria(pagina: fitz.Page) -> float | None:
    """
    Detecta a linha vertical IMPRESSA que divide as duas colunas do ENEM.
    Usa page.get_drawings() para encontrar linhas verticais proximas ao centro.

    Criterios:
      - Largura do desenho < 4 pt  (e uma linha, nao uma area)
      - Altura >= 30% da pagina    (linha longa, atravessa o conteudo)
      - X central a <= 25% do meio (proxima ao centro horizontal)

    Retorna o x central da linha, ou None se nao encontrada (usa meio como fallback).
    """
    chave = pagina.number
    if chave in _cache_linha:
        return _cache_linha[chave]

    meio   = pagina.rect.width / 2
    altura = pagina.rect.height
    candidatos = []

    for d in pagina.get_drawings():
        rect = d["rect"]
        x_c  = (rect.x0 + rect.x1) / 2
        
        # Flexibiliza critérios para detectar a linha central:
        # 1. Muito fina (linha pura)
        # 2. Um pouco mais larga (retângulo estreito usado como linha)
        # 3. Altura mínima reduzida para 25% para pegar linhas segmentadas
        espirra_meio = abs(x_c - meio) < pagina.rect.width * 0.25
        if espirra_meio:
            if (rect.width < 8 and rect.height >= altura * 0.25):
                candidatos.append(x_c)

    resultado = min(candidatos, key=lambda x: abs(x - meio)) if candidatos else None
    _cache_linha[chave] = resultado
    # Marcar se foi detectado ou nao para o log final
    if not hasattr(detectar_linha_divisoria, "foi_detectada"):
        detectar_linha_divisoria.foi_detectada = False
    if resultado is not None:
        detectar_linha_divisoria.foi_detectada = True
    return resultado


def detectar_fim_alternativas(pagina: fitz.Page, x_esq: float, x_dir: float, y_min: float, y_max_lim: float) -> float | None:
    """
    Busca as alternativas (A-E) dentro de uma coluna e retorna o Y inferior da alternativa E.
    """
    rect_coluna = fitz.Rect(x_esq, y_min, x_dir, y_max_lim)
    palavras = pagina.get_text("words", clip=rect_coluna)
    
    y_fim_e = None
    
    # Procura especificamente pela letra 'E' ou '(E)' no início de uma linha/bloco
    # Ordenamos palavras por y e depois x
    palavras.sort(key=lambda w: (w[1], w[0]))
    
    for w in palavras:
        x0, y0, x1, y1, texto, block_no, line_no, word_no = w
        # Se o texto for 'E', '(E)', 'E.', 'E-', 'E)'
        clean_text = texto.strip().upper()
        if clean_text in ("E", "(E)", "E.", "E-", "E)"):
            # Verificamos se está no início de uma linha (word_no == 0) 
            # ou se é a primeira palavra significativa detectada
            y_fim_e = y1
            
    return y_fim_e


ALTERNATIVAS_SET = {"A", "B", "C", "D", "E"}

def contar_alternativas(pagina: fitz.Page, crop_rect: fitz.Rect) -> set:
    """
    Conta quais das alternativas A-E estão presentes numa área do PDF.
    Retorna um set com as letras encontradas, ex: {'A', 'B', 'C', 'D', 'E'}.
    """
    palavras = pagina.get_text("words", clip=crop_rect)
    encontradas = set()
    for w in palavras:
        x0, y0, x1, y1, texto, *_ = w
        clean = texto.strip().upper().strip("().:-●")
        if clean in ALTERNATIVAS_SET:
            encontradas.add(clean)
    return encontradas


def buscar_continuacao_coluna(ancoras: list, indice: int, doc: fitz.Document) -> dict | None:
    """
    Quando uma questão é incompleta (sem todas as alternativas A-E no crop),
    busca o trecho de continuação no topo da PRÓXIMA COLUNA (ou topo da próxima
    página, se a questão estava na coluna direita ou em coluna inteira).

    Retorna um dict com {pagina_idx, crop_rect} da área de continuação, ou None.
    """
    if indice >= len(ancoras):
        return None

    questao  = ancoras[indice]
    pag_idx  = questao["pagina"]       # índice 0-based
    coluna   = questao["coluna"]
    linha_x  = questao["linha_x"]
    pagina   = doc[pag_idx]
    y_hdr, y_ftr = detectar_limites_pagina(pagina)
    x_esq_crop, x_dir_crop, _ = detectar_margens_texto(pagina, linha_x)

    # Próxima âncora (qualquer questão posterior no acervo)
    proxima = ancoras[indice + 1] if indice + 1 < len(ancoras) else None

    # --- Caso 1: Questão estava na coluna ESQUERDA → continua na DIREITA da mesma página ---
    if coluna == "esquerda" and proxima:
        if proxima["pagina"] == pag_idx and proxima["coluna"] == "direita":
            # A continuação ocupa o topo da coluna direita, até onde a próxima questão começa
            y_fim_cont = proxima["y0"] - PADDING_BOT
            crop_cont  = fitz.Rect(linha_x + LINE_PADDING, y_hdr, x_dir_crop, y_fim_cont)
            return {"pagina_idx": pag_idx, "crop": crop_cont}
        elif proxima["pagina"] > pag_idx:
            # A próxima ancora já está em outra página: toda a coluna direita é continuação
            crop_cont = fitz.Rect(linha_x + LINE_PADDING, y_hdr, x_dir_crop, y_ftr)
            return {"pagina_idx": pag_idx, "crop": crop_cont}

    # --- Caso 2: Coluna DIREITA ou INTEIRA → continua no topo da PRÓXIMA PÁGINA ---
    next_pag_idx = pag_idx + 1
    if next_pag_idx >= len(doc):
        return None  # Última página, sem continuação possível

    pagina_next  = doc[next_pag_idx]
    y_hdr_next, y_ftr_next = detectar_limites_pagina(pagina_next)
    linha_x_next = detectar_linha_divisoria(pagina_next) or (pagina_next.rect.width / 2)
    x_esq_next, x_dir_next, _ = detectar_margens_texto(pagina_next, linha_x_next)

    # A continuação vai do topo da próxima página até onde começa a primeira âncora dela
    y_fim_cont = y_ftr_next
    if proxima and proxima["pagina"] == next_pag_idx:
        y_fim_cont = proxima["y0"] - PADDING_BOT

    # Determina a coluna: se estava na direita, continua na esquerda da próxima página
    if coluna == "direita":
        crop_cont = fitz.Rect(x_esq_next, y_hdr_next, linha_x_next - LINE_PADDING, y_fim_cont)
    else:  # inteira
        crop_cont = fitz.Rect(x_esq_next, y_hdr_next, x_dir_next, y_fim_cont)

    return {"pagina_idx": next_pag_idx, "crop": crop_cont}


def costurar_imagens(pix1: fitz.Pixmap, pix2: fitz.Pixmap, espaco: int = 15) -> fitz.Pixmap:
    """
    Empilha verticalmente dois Pixmaps com uma faixa branca de separação.
    Usa manipulação direta de bytes sem dependências externas (sem PIL/numpy).
    Retorna um novo Pixmap combinado.
    """
    n = pix1.n  # número de canais (3=RGB)
    w = max(pix1.width, pix2.width)

    def pixmap_para_linhas(pix, largura_alvo):
        """Converte pixmap em lista de linhas de bytes, com padding branco à direita."""
        linhas = []
        bytes_por_px = pix.n
        stride = pix.width * bytes_por_px
        data = pix.samples
        for y in range(pix.height):
            linha = bytearray(data[y * stride: (y + 1) * stride])
            # Padding branco à direita se a imagem for mais estreita
            if pix.width < largura_alvo:
                pad_px = largura_alvo - pix.width
                linha += bytearray([255] * (pad_px * bytes_por_px))
            linhas.append(bytes(linha))
        return linhas

    linhas1 = pixmap_para_linhas(pix1, w)
    linhas2 = pixmap_para_linhas(pix2, w)
    linha_branca = bytes([255] * (w * n))
    separador    = [linha_branca] * espaco

    todas = linhas1 + separador + linhas2
    altura_total = len(todas)
    dados_finais = b"".join(todas)

    return fitz.Pixmap(pix1.colorspace, w, altura_total, dados_finais, pix1.alpha)


# Cache das margens de texto por pagina
_cache_margens: dict = {}


def detectar_margens_texto(pagina: fitz.Page, linha_x: float, y_min: float = 0, y_max: float = 10000) -> tuple:
    """
    Detecta as margens reais do texto em uma faixa vertical específica.
    Retorna (x_esq_crop, x_dir_crop, gap).
    """
    x_esq_min_list = []
    x_esq_max_list = []
    x_dir_min_list = []
    x_dir_max_list = []

    for bloco in pagina.get_text("blocks"):
        x0, y0, x1, y1, texto, *_ = bloco
        if not texto.strip():
            continue
            
        # Filtra por faixa vertical (Intervenção 3)
        if y1 < y_min or y0 > y_max:
            continue
            
        centro = (x0 + x1) / 2
        if centro < linha_x:
            x_esq_min_list.append(x0)
            x_esq_max_list.append(x1)
        else:
            x_dir_min_list.append(x0)
            x_dir_max_list.append(x1)

    # Fallbacks se não houver texto na faixa
    if not x_esq_min_list and not x_dir_min_list:
        # Se não achar nada na faixa, usa a página toda (fallback seguro)
        return detectar_margens_texto(pagina, linha_x)

    x_esq_texto = min(x_esq_min_list) if x_esq_min_list else COLUMN_PADDING
    x_dir_texto = max(x_dir_max_list) if x_dir_max_list else pagina.rect.width - COLUMN_PADDING

    gap_esq = linha_x - max(x_esq_max_list) if x_esq_max_list else LINE_PADDING
    gap_dir = min(x_dir_min_list) - linha_x  if x_dir_min_list else LINE_PADDING
    gap     = max((gap_esq + gap_dir) / 2, LINE_PADDING)

    x_esq_crop = max(0, x_esq_texto - gap)
    x_dir_crop = min(pagina.rect.width, x_dir_texto + gap)

    return (x_esq_crop, x_dir_crop, round(gap, 1))


# Cache de numero de colunas por pagina
_cache_colunas: dict = {}


def detectar_num_colunas(pagina: fitz.Page, linha_x: float) -> int:
    """
    Detecta se a pagina tem 1 ou 2 colunas de texto (Sempre Binário).
    """
    largura_pg  = pagina.rect.width
    threshold   = largura_pg * 0.10   # 10% de tolerancia
    min_largura = largura_pg * 0.40   # bloco largo

    for bloco in pagina.get_text("blocks"):
        x0, y0, x1, y1, texto, *_ = bloco
        if not texto.strip() or len(texto.strip()) < 20:
            continue
        largura_bloco = x1 - x0
        cruza_linha   = (x0 < linha_x - threshold) and (x1 > linha_x + threshold)
        if cruza_linha and largura_bloco >= min_largura:
            return 1
    return 2


def detectar_limites_pagina(pagina: fitz.Page) -> tuple:
    """
    Detecta dinamicamente os limites de cabecalho e rodape da pagina.
    Retorna (y_topo, y_fundo).
    """
    altura = pagina.rect.height
    y_topo  = 70   # Padrao seguro para ENEM
    y_fundo = altura - 35 # Padrao seguro se nao achar linha
    
    # Busca a linha horizontal do rodape (geralmente uma linha longa na base)
    sep_h = []
    for d in pagina.get_drawings():
        r = d["rect"]
        if r.width > pagina.rect.width * 0.5 and r.height < 2:
            sep_h.append(r.y0)
            
    # Linha do rodape: a mais baixa que nao seja a borda da pagina
    linhas_baixas = [y for y in sep_h if y > altura * 0.80 and y < altura - 5]
    if linhas_baixas:
        y_fundo = min(linhas_baixas) - 1 # 1pt de folga acima da primeira linha do rodapé
        
    return (y_topo, y_fundo)


def extrair_ancoras(doc: fitz.Document) -> list:
    """
    Varre todas as paginas e extrai ancoras 'QUESTAO NNN' com coordenadas.
    Usa a linha divisoria detectada para classificar coluna; fallback = meio.
    Retorna lista ordenada por (pagina, coluna, y0).
    """
    ancoras = []
    for num_pag, pagina in enumerate(doc):
        meio    = pagina.rect.width / 2
        linha_x = detectar_linha_divisoria(pagina) or meio

        num_colunas = detectar_num_colunas(pagina, linha_x)

        for bloco in pagina.get_text("blocks"):
            x0, y0, x1, y1, texto, *_ = bloco
            m = ANCORA_RE.search(texto)
            if m:
                if num_colunas == 1:
                    coluna = "inteira"          # pagina sem divisao de colunas
                else:
                    coluna = "esquerda" if x0 < linha_x else "direita"
                ancoras.append({
                    "numero"      : int(m.group(1)),
                    "pagina"      : num_pag,
                    "coluna"      : coluna,
                    "num_colunas" : num_colunas,
                    "x0"          : x0,
                    "y0"          : y0,
                    "largura"     : pagina.rect.width,
                    "linha_x"     : linha_x,
                })

    # Paginas de coluna inteira tratadas como esquerda no ordenamento (prioridade 0)
    ancoras.sort(key=lambda a: (a["pagina"], 0 if a["coluna"] in ("esquerda", "inteira") else 1, a["y0"]))

    # Identificacao de Idioma Estrangeiro (Ingles e Espanhol)
    # A prova de linguagens pode ocorrer nas questoes 1 a 5 (pos-2017) ou 91 a 95 (pre-2017).
    # A condicao segura para confirmar que sao de idioma e checar se o numero se repete na prova.
    frequencia = {}
    for a in ancoras:
        frequencia[a["numero"]] = frequencia.get(a["numero"], 0) + 1

    contagem_questoes = {}
    for a in ancoras:
        num = a["numero"]
        if (1 <= num <= 5 or 91 <= num <= 95) and frequencia.get(num, 0) > 1:
            contagem_questoes[num] = contagem_questoes.get(num, 0) + 1
            if contagem_questoes[num] == 1:
                a["idioma"] = "ingles"
            else:
                a["idioma"] = "espanhol"
        else:
            a["idioma"] = None

    return ancoras


# Cache de separadores horizontais por pagina
_cache_sep_h: dict = {}


def detectar_separadores_h(pagina: fitz.Page) -> list:
    """
    Detecta linhas horizontais que separam questoes (bordas inferiores de questao).

    Criterios:
      - height < 3 pt (linha muito fina ou de espessura zero)
      - width >= 15% da largura da pagina (linha significativa, nao decorativa)

    Retorna lista de (x0, y_centro, x1) ordenada por y crescente.
    """
    chave = pagina.number
    if chave in _cache_sep_h:
        return _cache_sep_h[chave]

    largura = pagina.rect.width
    vistas  = set()   # evita duplicatas com tolerancia de 1pt em y
    linhas  = []

    for d in pagina.get_drawings():
        rect = d["rect"]
        if rect.height < 3 and rect.width >= largura * 0.15:
            y_c = round((rect.y0 + rect.y1) / 2, 1)
            chave_y = round(y_c)   # agrupa linhas a 1pt de distancia
            if chave_y not in vistas:
                vistas.add(chave_y)
                linhas.append((rect.x0, y_c, rect.x1))

    linhas.sort(key=lambda l: l[1])
    _cache_sep_h[chave] = linhas
    return linhas


def calcular_crops(ancoras: list, doc: fitz.Document) -> list:
    """
    Calcula o bounding box exato de cada questao.

    Fronteira INTERNA (junto a linha divisoria):
      - Coluna esquerda: x_dir = linha_x - LINE_PADDING
      - Coluna direita : x_esq = linha_x + LINE_PADDING

    Fronteira EXTERNA (borda da pagina):
      - Detectada dinamicamente a partir do texto real da pagina
      - x_esq_crop = min_texto_esq - gap  (gap = dist linha-texto)
      - x_dir_crop = max_texto_dir + gap
      - Garante padding simetrico: margem externa = margem interna
    """
    questoes = []
    for i, a in enumerate(ancoras):
        pagina   = doc[a["pagina"]]
        largura  = a["largura"]
        # Limites de cabecalho/rodape para esta pagina
        y_hdr, y_ftr = detectar_limites_pagina(pagina)

        # Linha divisoria guardada na ancora (ou centro como fallback)
        linha_x = a.get("linha_x") or largura / 2

        # y_inicio: logo acima do texto QUESTAO
        y_ini = max(a["y0"] - PADDING_TOP, y_hdr)

        # y_fim: proxima ancora na mesma pagina+coluna (ou y_ftr se for ultima)
        y_fim = y_ftr
        for j in range(i + 1, len(ancoras)):
            prox = ancoras[j]
            if prox["pagina"] == a["pagina"] and prox["coluna"] == a["coluna"]:
                y_fim = min(prox["y0"] - PADDING_BOT, y_ftr)
                break
            if prox["pagina"] > a["pagina"]:
                break

        # INTERVENÇÃO 3: Margens horizontais específicas para esta questão
        x_esq_crop, x_dir_crop, gap = detectar_margens_texto(pagina, linha_x, y_ini, y_fim)

        # Limites horizontais
        if a["coluna"] == "inteira":
            x_esq, x_dir = x_esq_crop, x_dir_crop
        elif a["coluna"] == "esquerda":
            x_esq, x_dir = x_esq_crop, linha_x - LINE_PADDING
        else:
            x_esq, x_dir = linha_x + LINE_PADDING, x_dir_crop

        # Se e a ultima questao da coluna (y_fim == y_ftr), tenta refinar
        if y_fim >= y_ftr - 15:
            # INTERVENÇÃO 1: Busca o fim da alternativa E
            y_fim_alternativas = detectar_fim_alternativas(pagina, x_esq, x_dir, y_ini, pagina.rect.height)
            if y_fim_alternativas:
                # Padding moderado, respeitando o rodapé detectado
                y_fim = min(y_fim_alternativas + 15, y_ftr)
            else:
                # Fallback: estratégia original de buscar a última linha horizontal
                # Mas limitamos a busca ao rodapé detectado
                sep_linhas = detectar_separadores_h(pagina)
                x_col_centro = (x_esq + x_dir) / 2
                x_col_metade = (x_dir - x_esq) / 2
                y_ultimo_sep  = None
                y_busca_min = y_ini + 50
                for sx0, sy, sx1 in sep_linhas:
                    sx_centro = (sx0 + sx1) / 2
                    if abs(sx_centro - x_col_centro) <= x_col_metade * 1.2:
                        if y_busca_min < sy <= y_ftr:
                            rect_abaixo = fitz.Rect(x_esq, sy + 2, x_dir, y_ftr)
                            texto_abaixo = pagina.get_text("text", clip=rect_abaixo).strip()
                            if not texto_abaixo:
                                y_ultimo_sep = sy
                if y_ultimo_sep is not None:
                    y_fim = y_ultimo_sep + LINE_PADDING
                else:
                    # Se nada funcionou, usa o y_ftr detectado
                    y_fim = y_ftr


        questoes.append({
            "numero"  : a["numero"],
            "pagina"  : a["pagina"] + 1,
            "coluna"  : a["coluna"],
            "linha_x" : round(linha_x, 1),
            "crop"    : fitz.Rect(x_esq, y_ini, x_dir, y_fim),
            "idioma"  : a.get("idioma"),
        })
    return questoes


def renderizar(doc: fitz.Document, questoes: list, pasta: Path, meta: dict, ancoras: list, debug: bool = False) -> list:
    """
    Renderiza cada questao como PNG e gera seu JSON parcial.
    O campo 'texto_extraido' alimenta a Fase 2 (classificacao IA).
    """
    pasta.mkdir(parents=True, exist_ok=True)
    cor = meta["cor"]
    resultado = []

    # Mapa de índice: numero_questao → índice em ancoras (para busca de continuação)
    ancoras_por_numero = {a["numero"]: i for i, a in enumerate(ancoras)} if ancoras else {}

    for q in questoes:
        pagina = doc[q["pagina"] - 1]
        
        idioma = q.get("idioma")
        if idioma:
            nome = f"q{q['numero']:03d}_{idioma}.png"
            q_id_suffix = f"_{idioma}"
        else:
            nome = f"q{q['numero']:03d}.png"
            q_id_suffix = ""

        # ── Renderiza o crop principal ──────────────────────────────────────────
        pix = pagina.get_pixmap(matrix=fitz.Matrix(SCALE, SCALE), clip=q["crop"], alpha=False)

        # ── Fase C: Detecção de incompletude e costura multi-página ─────────────
        alts_presentes = contar_alternativas(pagina, q["crop"])
        multi_pagina   = False
        status_comp    = "completa"

        if not ALTERNATIVAS_SET.issubset(alts_presentes):
            # Questão incompleta: busca a continuação na próxima coluna/página
            indice_ancora = ancoras_por_numero.get(q["numero"])
            cont = None
            if indice_ancora is not None:
                cont = buscar_continuacao_coluna(ancoras, indice_ancora, doc)

            if cont:
                pagina_cont = doc[cont["pagina_idx"]]
                pix_cont = pagina_cont.get_pixmap(
                    matrix=fitz.Matrix(SCALE, SCALE), clip=cont["crop"], alpha=False
                )
                # Verifica se a continuação tem as alternativas restantes
                alts_cont = contar_alternativas(pagina_cont, cont["crop"])
                if alts_cont:  # só costura se a continuação tiver ALGUMA alternativa
                    pix = costurar_imagens(pix, pix_cont)
                    multi_pagina = True
                    status_comp  = "costurada"
                    faltantes = ALTERNATIVAS_SET - alts_presentes - alts_cont
                    if faltantes:
                        status_comp = f"parcial_faltam_{','.join(sorted(faltantes))}"
                    print(f"  [MULTI] q{q['numero']:03d} costurada (pags {q['pagina']}+{cont['pagina_idx']+1})")
            else:
                status_comp = "sem_alternativas"
                print(f"  [WARN] q{q['numero']:03d} sem alternativas detectadas e sem continuação")

        pix.save(str(pasta / nome))

        # ── Modo Debug ──────────────────────────────────────────────────────────
        if debug:
            shape = pagina.new_shape()
            shape.draw_rect(q["crop"])
            shape.finish(color=(1, 0, 0), width=2)
            shape.commit()
            pix_full = pagina.get_pixmap(matrix=fitz.Matrix(1.0, 1.0), alpha=False)
            pix_full.save(str(pasta / f"q{q['numero']:03d}_debug.png"))

        # ── Texto extraído (concatena as duas partes se multi-página) ───────────
        texto = pagina.get_text("text", clip=q["crop"]).strip()
        if multi_pagina and cont:
            texto_cont = doc[cont["pagina_idx"]].get_text("text", clip=cont["crop"]).strip()
            texto = texto + "\n" + texto_cont

        # ── JSON parcial ────────────────────────────────────────────────────────
        obj = {
            "questao_id"        : f"{meta['ano']}_{meta['aplicacao']}_{meta['dia']}_q{q['numero']:03d}{q_id_suffix}",
            "imagem"            : nome,
            "ano"               : meta["ano"],
            "aplicacao"         : meta["aplicacao"],
            "dia"               : meta["dia"],
            "idioma"            : idioma,
            "numero_azul"       : q["numero"] if cor == "AZU" else None,
            "numero_amarela"    : q["numero"] if cor == "AMA" else None,
            "numero_rosa"       : q["numero"] if cor == "ROS" else None,
            "numero_branca"     : q["numero"] if cor == "BRA" else None,
            "numero_cinza"      : q["numero"] if cor == "CIN" else None,
            "disciplina"        : None,
            "conteudo"          : None,
            "gabarito"          : None,
            "tri_a"             : None,
            "tri_b"             : None,
            "tri_c"             : None,
            "fonte_classificacao": None,
            "texto_extraido"    : texto,
            "processado_em"     : datetime.now().isoformat(),
            "_meta"             : {
                "pagina"      : q["pagina"],
                "coluna"      : q["coluna"],
                "linha_x"     : q["linha_x"],
                "multi_pagina": multi_pagina,
                "status_comp" : status_comp,
            },
        }

        json_nome = nome.replace(".png", ".json")
        with open(pasta / json_nome, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

        resultado.append(obj)
        tag = "[MULTI]" if multi_pagina else "[OK]"
        print(f"  {tag} q{q['numero']:03d} -> {nome}  (pag {q['pagina']}, {q['coluna']}, linha_x={q['linha_x']})")

    return resultado


# ============================================================
# MAIN
# ============================================================

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/01_recortar_pdf.py <caminho_do_pdf> [--questoes 91,92,93] [--debug]")
        print("Ex : python scripts/01_recortar_pdf.py ../ENEM/PROVAS/2017_ENEM_AR_D2_PROVA_AMA.pdf --questoes 91,92,93,94 --debug")
        sys.exit(1)

    pdf_path = Path(sys.argv[1])
    if not pdf_path.exists():
        print(f"[ERR] Arquivo nao encontrado: {pdf_path}")
        sys.exit(1)

    # Filtro opcional de questoes para teste rapido
    filtro_questoes = None
    if "--questoes" in sys.argv:
        idx = sys.argv.index("--questoes") + 1
        filtro_questoes = {int(n) for n in sys.argv[idx].split(",")}

    debug_mode = "--debug" in sys.argv

    meta     = parse_nome_pdf(pdf_path)
    prova_id = f"{meta['ano']}_{meta['aplicacao']}_{meta['dia']}"
    pasta    = OUTPUT_BASE / prova_id

    print(f"\n{'='*55}")
    print(f"  Pipeline ENEM - Fase 1: Recorte de PDF")
    print(f"{'='*55}")
    print(f"  Prova   : {prova_id}  (caderno {meta['cor']})")
    print(f"  PDF     : {pdf_path.name}")
    print(f"  Saida   : {pasta}")
    print(f"  Escala  : {SCALE}x  (~{int(72 * SCALE)} DPI)")
    if filtro_questoes:
        print(f"  Filtro  : questoes {sorted(filtro_questoes)}")
    print(f"{'='*55}\n")

    doc = fitz.open(str(pdf_path))
    print(f"  {len(doc)} paginas abertas\n")

    print("  Detectando ancoras 'QUESTAO NN'...")
    ancoras = extrair_ancoras(doc)
    print(f"  {len(ancoras)} questoes encontradas\n")

    if not ancoras:
        print("  [ERR] Nenhuma ancora encontrada. Verifique se o PDF tem texto selecionavel.")
        sys.exit(1)

    print("  Calculando bounding boxes...")
    questoes = calcular_crops(ancoras, doc)

    # Informa qual linha divisoria foi usada (baseado na primeira questão processada)
    if questoes:
        q_ex      = questoes[0]
        lx        = q_ex.get("linha_x")
        
        if getattr(detectar_linha_divisoria, "foi_detectada", False):
            print(f"  [OK] Linha divisoria detectada: x = {lx} pt")
        else:
            print(f"  [WARN] Linha divisoria nao detectada - usando centro geometrico ({lx} pt)")

    # Aplica filtro de questoes (modo teste)
    if filtro_questoes:
        questoes = [q for q in questoes if q["numero"] in filtro_questoes]
        print(f"  Filtro aplicado: {len(questoes)} questoes selecionadas\n")

    print(f"\n  Renderizando (scale={SCALE}x)...")
    resultado = renderizar(doc, questoes, pasta, meta, ancoras, debug=debug_mode)

    # Sumario da fase
    sumario = {
        "prova_id"      : prova_id,
        "cor_caderno"   : meta["cor"],
        "total_questoes": len(resultado),
        "fase_atual"    : "recorte_concluido",
        "processado_em" : datetime.now().isoformat(),
    }
    with open(pasta / "_sumario_fase1.json", "w", encoding="utf-8") as f:
        json.dump(sumario, f, ensure_ascii=False, indent=2)

    doc.close()
    print(f"\n{'='*55}")
    print(f"  FASE 1 CONCLUIDA - {len(resultado)} questoes -> {pasta}")
    print(f"  Proximo: python scripts/02_classificar_ia.py {prova_id}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
