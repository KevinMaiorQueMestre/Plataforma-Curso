const fs = require('fs');

const d1Gab = fs.readFileSync('output_d1_gab.txt', 'utf8');
const d2Gab = fs.readFileSync('output_d2_gab.txt', 'utf8');

const respostas = {};

const d1Regex = /(\d{1,2})\s+(Anulado|[A-E])(?:\s+(Anulado|[A-E]))?/g;
let match;
while ((match = d1Regex.exec(d1Gab)) !== null) {
  const num = parseInt(match[1]);
  if (num >= 1 && num <= 90) {
    let resp = match[2];
    if (resp === 'Anulado') resp = 'ANULADA';
    if (num <= 5 && match[3]) {
      resp = match[2] === 'Anulado' ? 'ANULADA' : match[2];
    }
    respostas[num] = resp;
  }
}

const d2Regex = /(\d\s*\d\s*\d?)\s+(Anulado|[A-E])/g;
while ((match = d2Regex.exec(d2Gab)) !== null) {
  const rawNum = match[1].replace(/\s+/g, '');
  const num = parseInt(rawNum);
  if (num >= 91 && num <= 180) {
    let resp = match[2];
    if (resp === 'Anulado') resp = 'ANULADA';
    respostas[num] = resp;
  }
}

const questoes = [];
for (let i = 1; i <= 180; i++) {
  let disciplina = '';
  let conteudo = '';

  if (i >= 1 && i <= 5) {
    disciplina = 'Inglês';
    conteudo = 'Interpretação de Texto';
  } else if (i >= 6 && i <= 45) {
    disciplina = 'Linguagens';
    conteudo = 'Interpretação de Texto e Literatura';
  } else if (i >= 46 && i <= 90) {
    disciplina = 'Ciências Humanas';
    conteudo = 'História e Geografia Geral';
  } else if (i >= 91 && i <= 135) {
    disciplina = 'Ciências da Natureza';
    conteudo = 'Biologia, Física e Química';
  } else if (i >= 136 && i <= 180) {
    disciplina = 'Matemática';
    conteudo = 'Matemática Básica e Aplicada';
  }

  if (!respostas[i]) {
    respostas[i] = 'ANULADA';
  }

  questoes.push({
    numero_questao: i,
    disciplina: disciplina,
    conteudo: conteudo,
    resposta_certa: respostas[i]
  });
}

fs.writeFileSync('final_output.json', JSON.stringify(questoes, null, 2), 'utf8');
console.log('Gerado final_output.json com ' + questoes.length + ' questoes.');
