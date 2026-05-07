const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('output_2017_d2_prova.txt', 'utf8');
const questionRegex = /Q\s*UEST\s*.\s*O\s+(\d+)/gi;

let matches = [];
let match;
while ((match = questionRegex.exec(content)) !== null) {
    matches.push({ number: parseInt(match[1]), index: match.index });
}

let allQuestions = {};
for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    if (current.number < 91 || current.number > 180) continue;
    
    const start = current.index;
    const end = next ? next.index : content.length;
    allQuestions[current.number] = content.substring(start, end).trim().replace(/\s+/g, ' ');
}

fs.writeFileSync('questions_text_2017.json', JSON.stringify(allQuestions, null, 2), 'utf8');
console.log(`Fatiadas ${Object.keys(allQuestions).length} questões de 2017.`);
