const fs = require('fs');
const path = require('path');

const files = [
  { name: 'output_d1_prova.txt', offset: 0 },
  { name: 'output_d2_prova.txt', offset: 90 }
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
    
    // Regra de Skill: Validar se o número da questão faz sentido (1 a 180)
    if (current.number > 180 || current.number < 1) {
      anomalies.push({
        tipo: 'Número Inválido',
        numero: current.number,
        detalhe: `Questão ${current.number} detectada, mas o ENEM só possui 180 questões.`
      });
      continue;
    }

    const start = current.index;
    const end = next ? next.index : content.length;
    
    const rawText = content.substring(start, end).trim();
    
    // Limpeza básica
    const cleanText = rawText
      .replace(/\s+/g, ' ')
      .replace(/ENEM2025/g, '')
      .replace(/\*.*?\*/g, '');

    // Tratamento especial para 1-5 (Língua Estrangeira no D1)
    if (current.number <= 5 && fileInfo.name.includes('d1')) {
      const key_ing = `${current.number}_ING`;
      const key_esp = `${current.number}_ESP`;
      
      if (!allQuestions[key_ing]) {
        allQuestions[key_ing] = cleanText;
      } else {
        allQuestions[key_esp] = cleanText;
      }
    } else {
      allQuestions[current.number] = cleanText;
    }
  }
});

fs.writeFileSync('questions_text.json', JSON.stringify(allQuestions, null, 2), 'utf8');
fs.writeFileSync('anomalies_report.json', JSON.stringify(anomalies, null, 2), 'utf8');

console.log(`Total de questões fatiadas: ${Object.keys(allQuestions).length}`);
if (anomalies.length > 0) {
  console.warn(`CUIDADO: ${anomalies.length} anomalias encontradas! Verifique anomalies_report.json`);
}
console.log('Arquivos gerados com sucesso.');
