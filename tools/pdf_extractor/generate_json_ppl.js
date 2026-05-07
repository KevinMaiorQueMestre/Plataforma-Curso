const fs = require('fs');

const d1Content = fs.readFileSync('output_d1_ppl_gab.txt', 'utf8');
const d2Content = fs.readFileSync('output_d2_ppl_gab.txt', 'utf8');

function parseD1(content) {
    const questions = [];
    const standardRegex = /(\d+)\s+([A-E\*])/g;
    let match;
    while ((match = standardRegex.exec(content)) !== null) {
        let qNum = parseInt(match[1]);
        let ans = match[2] === '*' ? "ANULADA" : match[2];
        if (qNum >= 6 && qNum <= 90) {
            questions.push({ numero_questao: qNum, resposta_certa: ans });
        }
    }
    const langRegex = /(\d)\s+([A-E])\s+([A-E])/g;
    while ((match = langRegex.exec(content)) !== null) {
        let qNum = parseInt(match[1]);
        if (qNum >= 1 && qNum <= 5) {
            questions.push({ numero_questao: qNum, lingua: 'ING', resposta_certa: match[2] });
            questions.push({ numero_questao: qNum, lingua: 'ESP', resposta_certa: match[3] });
        }
    }
    return questions;
}

function parseD2(content) {
    const questions = [];
    const standardRegex = /(\d+)\s+([A-E\*])/g;
    let match;
    while ((match = standardRegex.exec(content)) !== null) {
        let qNum = parseInt(match[1]);
        let ans = match[2] === '*' ? "ANULADA" : match[2];
        if (qNum >= 91 && qNum <= 180) {
            questions.push({ numero_questao: qNum, resposta_certa: ans });
        }
    }
    return questions;
}

const g1 = parseD1(d1Content);
const g2 = parseD2(d2Content);
const consolidated = [];
const seen = new Set();

g1.sort((a,b) => a.numero_questao - b.numero_questao);
g1.forEach(q => {
    if (q.lingua === 'ESP') return; 
    if (seen.has(q.numero_questao)) return;
    if (q.numero_questao < 1) return; // Filtro de segurança
    consolidated.push({ numero_questao: q.numero_questao, resposta_certa: q.resposta_certa });
    seen.add(q.numero_questao);
});

g2.forEach(q => {
    if (q.numero_questao < 91) return; // Filtro de segurança
    consolidated.push(q);
});

fs.writeFileSync('final_output_ppl.json', JSON.stringify(consolidated, null, 2), 'utf8');
console.log(`Gabarito PPL consolidado com ${consolidated.length} questões.`);
