const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const baseDirProvas = 'c:\\Users\\Marcia Cristina\\OneDrive\\Documentos\\GitHub\\MetAuto-All-in-one\\ENEM\\PROVAS';
const baseDirGabs = 'c:\\Users\\Marcia Cristina\\OneDrive\\Documentos\\GitHub\\MetAuto-All-in-one\\ENEM\\GABARITOS';

const filesToProcess = [
    { label: 'd1_ppl_prova', pdf: path.join(baseDirProvas, '2025_ENEM_2A_D1_PROVA_AZU.pdf') },
    { label: 'd2_ppl_prova', pdf: path.join(baseDirProvas, '2025_ENEM_2A_D2_PROVA_AMA.pdf') },
    { label: 'd1_ppl_gab', pdf: path.join(baseDirGabs, '2025_ENEM_2A_D1_GAB_AZU.pdf') },
    { label: 'd2_ppl_gab', pdf: path.join(baseDirGabs, '2025_ENEM_2A_D2_GAB_AMA.pdf') }
];

async function extractText(label, pdfPath) {
    const buffer = fs.readFileSync(pdfPath);
    const data = new Uint8Array(buffer);
    const parser = new PDFParse({ data, verbosity: 0 });
    await parser.load();

    const numPages = parser.doc.numPages;
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await parser.doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
    }

    await parser.destroy();
    const outputPath = `output_${label}.txt`;
    fs.writeFileSync(outputPath, fullText, 'utf8');
    console.log(`Extraído: ${outputPath} (${fullText.length} chars)`);
}

async function run() {
    for (const file of filesToProcess) {
        await extractText(file.label, file.pdf);
    }
}

run().catch(console.error);
