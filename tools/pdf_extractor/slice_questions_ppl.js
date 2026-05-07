const fs = require('fs');
const path = require('path');

const files = [
  { name: 'output_d1_ppl_prova.txt', offset: 0 },
  { name: 'output_d2_ppl_prova.txt', offset: 90 }
];

const questionRegex = /Q\s*UEST\s*.\s*O\s+(\d+)/gi;

let allQuestions = {};
let anomalies = [];

files.forEach(fileInfo => {
  const filePath = path.join(__dirname, fileInfo.name);
  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo ${fileInfo.name} não encontrado.`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let matches = [];
  let match;

  while ((match = questionRegex.exec(content)) !== null) {
    matches.push({
      number: parseInt(match[1]),
      index: match.index,
      fullMatch: match[0]
    });
  }

  console.log(`Encontradas ${matches.length} marcações de questão em ${fileInfo.name}`);

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    
    if (current.number > 180 || current.number < 1) {
      anomalies.push({ tipo: 'Número Inválido', numero: current.number, detalhe: `Detectado ${current.number}` });
      continue;
    }

    const start = current.index;
    const end = next ? next.index : content.length;
    const cleanText = content.substring(start, end).trim().replace(/\s+/g, ' ');

    if (current.number <= 5 && fileInfo.name.includes('d1')) {
      if (!allQuestions[`${current.number}_ING`]) {
        allQuestions[`${current.number}_ING`] = cleanText;
      } else {
        allQuestions[`${current.number}_ESP`] = cleanText;
      }
    } else {
      allQuestions[current.number] = cleanText;
    }
  }
});

fs.writeFileSync('questions_text_ppl.json', JSON.stringify(allQuestions, null, 2), 'utf8');
console.log(`Total de questões fatiadas (PPL): ${Object.keys(allQuestions).length}`);
