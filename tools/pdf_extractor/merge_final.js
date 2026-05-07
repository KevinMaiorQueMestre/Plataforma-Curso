const fs = require('fs');

const originalData = JSON.parse(fs.readFileSync('final_output.json', 'utf8'));

// Mapeamento REAL do ENEM 2025 (Baseado nos enunciados extraídos)
const mapaReal = {
  // --- CIÊNCIAS DA NATUREZA (DIA 2) ---
  "91": { d: "Física", c: "Termologia" },
  "92": { d: "Biologia", c: "Ecologia" },
  "93": { d: "Química", c: "Físico-Química" },
  "94": { d: "Biologia", c: "Fisiologia Humana" },
  "95": { d: "Física", c: "Mecânica" },
  "96": { d: "Física", c: "Ondulatória" },
  "97": { d: "Biologia", c: "Citologia" },
  "98": { d: "Biologia", c: "Genética" },
  "99": { d: "Biologia", c: "Ecologia" },
  "100": { d: "Biologia", c: "Zoologia" },
  "101": { d: "Biologia", c: "Ecologia" },
  "102": { d: "Física", c: "Eletromagnetismo" },
  "103": { d: "Química", c: "Química Orgânica" },
  "104": { d: "Química", c: "Química Orgânica" },
  "105": { d: "Química", c: "Estequiometria" },
  "106": { d: "Química", c: "Química Inorgânica" },
  "107": { d: "Física", c: "Mecânica" },
  "108": { d: "Biologia", c: "Botânica" },
  "109": { d: "Física", c: "Óptica" },
  "110": { d: "Física", c: "Termologia" },
  "111": { d: "Biologia", c: "Evolução" },
  "112": { d: "Física", c: "Dinâmica" },
  "113": { d: "Física", c: "Eletromagnetismo" },
  "114": { d: "Física", c: "Mecânica" },
  "115": { d: "Química", c: "Atomística" }, // ANULADA
  "116": { d: "Biologia", c: "Fisiologia Humana" },
  "117": { d: "Química", c: "Química Orgânica" },
  "118": { d: "Química", c: "Físico-Química" },
  "119": { d: "Química", c: "Estequiometria" },
  "120": { d: "Física", c: "Mecânica" },
  "121": { d: "Biologia", c: "Ecologia" }, // ANULADA
  "122": { d: "Física", c: "Eletromagnetismo" },
  "123": { d: "Física", c: "Termologia" },
  "124": { d: "Química", c: "Físico-Química" },
  "125": { d: "Biologia", c: "Ecologia" },
  "126": { d: "Biologia", c: "Genética" },
  "127": { d: "Biologia", c: "Fisiologia Humana" },
  "128": { d: "Física", c: "Óptica" },
  "129": { d: "Química", c: "Química Orgânica" },
  "130": { d: "Biologia", c: "Ecologia" },
  "131": { d: "Biologia", c: "Botânica" },
  "132": { d: "Física", c: "Dinâmica" },
  "133": { d: "Física", c: "Eletromagnetismo" },
  "134": { d: "Química", c: "Físico-Química" },
  "135": { d: "Física", c: "Ondulatória" },

  // --- MATEMÁTICA (DIA 2) ---
  "136": { d: "Matemática", c: "Geometria Plana" },
  "137": { d: "Matemática", c: "Matemática Básica" },
  "138": { d: "Matemática", c: "Estatística e Probabilidade" },
  "139": { d: "Matemática", c: "Geometria Espacial" },
  "140": { d: "Matemática", c: "Álgebra" },
  "141": { d: "Matemática", c: "Matemática Básica" },
  "142": { d: "Matemática", c: "Geometria Plana" },
  "143": { d: "Matemática", c: "Estatística e Probabilidade" },
  "144": { d: "Matemática", c: "Funções" },
  "145": { d: "Matemática", c: "Estatística e Probabilidade" },
  "146": { d: "Matemática", c: "Matemática Básica" },
  "147": { d: "Matemática", c: "Álgebra" },
  "148": { d: "Matemática", c: "Geometria Espacial" },
  "149": { d: "Matemática", c: "Matemática Básica" },
  "150": { d: "Matemática", c: "Geometria Plana" },
  "151": { d: "Matemática", c: "Trigonometria" },
  "152": { d: "Matemática", c: "Álgebra" },
  "153": { d: "Matemática", c: "Matemática Básica" },
  "154": { d: "Matemática", c: "Estatística e Probabilidade" },
  "155": { d: "Matemática", c: "Álgebra" },
  "156": { d: "Matemática", c: "Álgebra" },
  "157": { d: "Matemática", c: "Funções" },
  "158": { d: "Matemática", c: "Geometria Espacial" },
  "159": { d: "Matemática", c: "Matemática Básica" },
  "160": { d: "Matemática", c: "Álgebra" },
  "161": { d: "Matemática", c: "Estatística e Probabilidade" },
  "162": { d: "Matemática", c: "Estatística e Probabilidade" },
  "163": { d: "Matemática", c: "Trigonometria" },
  "164": { d: "Matemática", c: "Geometria Plana" },
  "165": { d: "Matemática", c: "Geometria Espacial" },
  "166": { d: "Matemática", c: "Álgebra" },
  "167": { d: "Matemática", c: "Álgebra" },
  "168": { d: "Matemática", c: "Estatística e Probabilidade" },
  "169": { d: "Matemática", c: "Estatística e Probabilidade" },
  "170": { d: "Matemática", c: "Álgebra" },
  "171": { d: "Matemática", c: "Matemática Básica" },
  "172": { d: "Matemática", c: "Geometria Espacial" },
  "173": { d: "Matemática", c: "Funções" },
  "174": { d: "Matemática", c: "Estatística e Probabilidade" },
  "175": { d: "Matemática", c: "Estatística e Probabilidade" },
  "176": { d: "Matemática", c: "Álgebra" },
  "177": { d: "Matemática", c: "Álgebra" },
  "178": { d: "Matemática", c: "Geometria Plana" }, // ANULADA
  "179": { d: "Matemática", c: "Álgebra" },
  "180": { d: "Matemática", c: "Estatística e Probabilidade" }
};

const finalQuestions = originalData.map(q => {
  const mapping = mapaReal[q.numero_questao.toString()];
  
  if (mapping) {
    return {
      ...q,
      disciplina: mapping.d,
      conteudo: mapping.c
    };
  }
  
  // Para questões de Humanas/Linguagens (Dia 1) que já estavam ok
  return q;
});

fs.writeFileSync('final_output.json', JSON.stringify(finalQuestions, null, 2), 'utf8');
console.log("final_output.json atualizado com mapeamento REAL e ESPECÍFICO.");
