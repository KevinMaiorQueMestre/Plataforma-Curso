const fs = require('fs');

const originalData = JSON.parse(fs.readFileSync('final_output_2017.json', 'utf8'));

const mapa2017_Corrigido = {
  // --- NATUREZA (91-135) ---
  "91": { d: "Química", c: "Atomística" },
  "92": { d: "Biologia", c: "Evolução" },
  "93": { d: "Física", c: "Mecânica" },
  "94": { d: "Biologia", c: "Fisiologia Humana" },
  "95": { d: "Química", c: "Físico-Química" },
  "96": { d: "Química", c: "Química Orgânica" },
  "97": { d: "Química", c: "Separação de Misturas" },
  "98": { d: "Biologia", c: "Citologia" },
  "99": { d: "Física", c: "Óptica" },
  "100": { d: "Química", c: "Interações Intermoleculares" },
  "101": { d: "Física", c: "Ondulatória" },
  "102": { d: "Química", c: "Radioatividade" },
  "103": { d: "Física", c: "Termologia" },
  "104": { d: "Química", c: "Eletroquímica" },
  "105": { d: "Biologia", c: "Ecologia" },
  "106": { d: "Química", c: "Estequiometria" },
  "107": { d: "Biologia", c: "Citologia" },
  "108": { d: "Física", c: "Eletromagnetismo" },
  "109": { d: "Biologia", c: "Citologia" },
  "110": { d: "Biologia", c: "Ecologia" },
  "111": { d: "Física", c: "Eletromagnetismo" },
  "112": { d: "Biologia", c: "Ecologia" },
  "113": { d: "Física", c: "Ondulatória" },
  "114": { d: "Química", c: "Química Orgânica" },
  "115": { d: "Biologia", c: "Botânica" },
  "116": { d: "Química", c: "Termoquímica" },
  "117": { d: "Química", c: "Eletroquímica" },
  "118": { d: "Biologia", c: "Genética" },
  "119": { d: "Biologia", c: "Ecologia" },
  "120": { d: "Química", c: "Química Orgânica" },
  "121": { d: "Química", c: "Físico-Química" },
  "122": { d: "Biologia", c: "Botânica" },
  "123": { d: "Física", c: "Óptica" },
  "124": { d: "Física", c: "Mecânica" },
  "125": { d: "Física", c: "Mecânica" },
  "126": { d: "Biologia", c: "Citologia" },
  "127": { d: "Física", c: "Eletromagnetismo" },
  "128": { d: "Química", c: "Química Orgânica" },
  "129": { d: "Biologia", c: "Fisiologia Humana" },
  "130": { d: "Física", c: "Eletromagnetismo" },
  "131": { d: "Química", c: "Físico-Química" },
  "132": { d: "Biologia", c: "Genética" },
  "133": { d: "Química", c: "Atomística" },
  "134": { d: "Física", c: "Termologia" },
  "135": { d: "Biologia", c: "Fisiologia Humana" },

  // --- MATEMÁTICA (136-180) ---
  "136": { d: "Matemática", c: "Gráficos e Tabelas" },
  "137": { d: "Matemática", c: "Geometria Plana" },
  "138": { d: "Matemática", c: "Matemática Básica" },
  "139": { d: "Matemática", c: "Geometria Espacial" },
  "140": { d: "Matemática", c: "Análise Combinatória" },
  "141": { d: "Matemática", c: "Progressões" },
  "142": { d: "Matemática", c: "Estatística e Probabilidade" },
  "143": { d: "Matemática", c: "Funções" },
  "144": { d: "Matemática", c: "Matemática Financeira" },
  "145": { d: "Matemática", c: "Logaritmos" },
  "146": { d: "Matemática", c: "Trigonometria" },
  "147": { d: "Matemática", c: "Geometria Plana" },
  "148": { d: "Matemática", c: "Estatística e Probabilidade" },
  "149": { d: "Matemática", c: "Análise Combinatória" },
  "150": { d: "Matemática", c: "Geometria Espacial" },
  "151": { d: "Matemática", c: "Álgebra" },
  "152": { d: "Matemática", c: "Funções" },
  "153": { d: "Matemática", c: "Gráficos e Tabelas" },
  "154": { d: "Matemática", c: "Geometria Espacial" },
  "155": { d: "Matemática", c: "Estatística e Probabilidade" },
  "156": { d: "Matemática", c: "Funções" },
  "157": { d: "Matemática", c: "Geometria Espacial" },
  "158": { d: "Matemática", c: "Matemática Básica" },
  "159": { d: "Matemática", c: "Estatística e Probabilidade" },
  "160": { d: "Matemática", c: "Funções" },
  "161": { d: "Matemática", c: "Matemática Básica" },
  "162": { d: "Matemática", c: "Matemática Básica" },
  "163": { d: "Matemática", c: "Trigonometria" },
  "164": { d: "Matemática", c: "Matemática Básica" },
  "165": { d: "Matemática", c: "Geometria Espacial" },
  "166": { d: "Matemática", c: "Matemática Básica" },
  "167": { d: "Matemática", c: "Análise Combinatória" },
  "168": { d: "Matemática", c: "Funções" },
  "169": { d: "Matemática", c: "Matemática Básica" },
  "170": { d: "Matemática", c: "Estatística e Probabilidade" },
  "171": { d: "Matemática", c: "Estatística e Probabilidade" },
  "172": { d: "Matemática", c: "Álgebra" },
  "173": { d: "Matemática", c: "Gráficos e Tabelas" },
  "174": { d: "Matemática", c: "Matemática Básica" },
  "175": { d: "Matemática", c: "Geometria Plana" },
  "176": { d: "Matemática", c: "Funções" },
  "177": { d: "Matemática", c: "Estatística e Probabilidade" },
  "178": { d: "Matemática", c: "Gráficos e Tabelas" },
  "179": { d: "Matemática", c: "Trigonometria" },
  "180": { d: "Matemática", c: "Geometria Espacial" }
};

const finalQuestions = originalData.map(q => {
  const n = q.numero_questao.toString();
  const mapping = mapa2017_Corrigido[n];
  if (mapping) {
    return { ...q, disciplina: mapping.d, conteudo: mapping.c };
  }
  return q;
});

fs.writeFileSync('final_output_2017.json', JSON.stringify(finalQuestions, null, 2), 'utf8');
console.log("final_output_2017.json RECORRIGIDO com mapeamento verídico 1:1.");
