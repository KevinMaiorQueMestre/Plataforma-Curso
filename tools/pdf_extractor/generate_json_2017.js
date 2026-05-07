const fs = require('fs');

const content = fs.readFileSync('output_2017_d2_gab.txt', 'utf8');

// Regex mais flexível para capturar números com espaços opcionais no meio
const regex = /(\d[\s\d]*\d)\s+([A-E\*])/g;
let match;
let gab = [];
while ((match = regex.exec(content)) !== null) {
    let numStr = match[1].replace(/\s/g, ''); // Remove espaços internos do número
    let qNum = parseInt(numStr);
    let ans = match[2] === '*' ? "ANULADA" : match[2];
    
    if (qNum >= 91 && qNum <= 180) {
        gab.push({ numero_questao: qNum, resposta_certa: ans });
    }
}

// Unicidade e ordenação
gab.sort((a,b) => a.numero_questao - b.numero_questao);
const finalGab = [];
const seen = new Set();
gab.forEach(q => {
    if (seen.has(q.numero_questao)) return;
    finalGab.push(q);
    seen.add(q.numero_questao);
});

fs.writeFileSync('final_output_2017.json', JSON.stringify(finalGab, null, 2), 'utf8');
console.log(`Gabarito 2017 AR D2 consolidado com ${finalGab.length} questões.`);
