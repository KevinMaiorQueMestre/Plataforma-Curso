const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const BASE = path.resolve(__dirname, '../../ENEM');

const FILES = {
  d1_gab:   path.join(BASE, 'GABARITOS', '2025_ENEM_AR_D1_GAB_AZU.pdf'),
  d1_prova: path.join(BASE, 'PROVAS', '2025_ENEM_AR_D1_PROVA_AZU.pdf'),
  d2_gab:   path.join(BASE, 'GABARITOS', '2025_ENEM_AR_D2_GAB_AMA.pdf'),
  d2_prova: path.join(BASE, 'PROVAS', '2025_ENEM_AR_D2_PROVA_AMA.pdf'),
};

async function extractAllText(label, filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = new Uint8Array(buffer);
  const parser = new PDFParse({ data, verbosity: 0 });
  await parser.load();

  const numPages = parser.doc.numPages;
  process.stderr.write(`[${label}] ${numPages} páginas\n`);

  let fullText = '';
  for (let i = 1; i <= numPages; i++) {
    const page = await parser.doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  await parser.destroy();
  return fullText;
}

async function main() {
  const results = {};
  for (const [key, filePath] of Object.entries(FILES)) {
    results[key] = await extractAllText(key, filePath);
  }
  // Write each to separate file
  for (const [key, text] of Object.entries(results)) {
    fs.writeFileSync(`output_${key}.txt`, text, 'utf8');
    process.stderr.write(`Arquivo output_${key}.txt salvo (${text.length} chars)\n`);
  }
}

main().catch(err => { console.error(err.message); process.exit(1); });
