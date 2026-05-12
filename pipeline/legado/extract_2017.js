const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const baseDirProvas = 'c:\\Users\\Marcia Cristina\\OneDrive\\Documentos\\GitHub\\MetAuto-All-in-one\\ENEM\\PROVAS';
const baseDirGabs = 'c:\\Users\\Marcia Cristina\\OneDrive\\Documentos\\GitHub\\MetAuto-All-in-one\\ENEM\\GABARITOS';

const files = [
    { label: '2017_d2_prova', pdf: path.join(baseDirProvas, '2017_ENEM_AR_D2_PROVA_AMA.pdf') },
    { label: '2017_d2_gab', pdf: path.join(baseDirGabs, '2017_ENEM_AR_D2_GAB_AMA.pdf') }
];

async function extract(label, pdfPath) {
    if (!fs.existsSync(pdfPath)) {
        console.error(`ERRO: Arquivo não encontrado: ${pdfPath}`);
        return;
    }
    const buffer = fs.readFileSync(pdfPath);
    const data = new Uint8Array(buffer);
    const parser = new PDFParse({ data, verbosity: 0 });
    await parser.load();
    const numPages = parser.doc.numPages;
    let fullText = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await parser.doc.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    await parser.destroy();
    fs.writeFileSync(`output_${label}.txt`, fullText, 'utf8');
    console.log(`Extraído: output_${label}.txt`);
}

async function run() {
    for (const f of files) await extract(f.label, f.pdf);
}
run().catch(console.error);
