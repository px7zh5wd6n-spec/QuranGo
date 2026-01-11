const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'data.js');

function isJsonFile(f){
  return /^\d{3}\.json$/.test(f) || ['quran.json','tajweedquran.json'].includes(f);
}

const files = fs.readdirSync(root).filter(f => isJsonFile(f));
files.sort();

const obj = {};
files.forEach(f => {
  try{
    const txt = fs.readFileSync(path.join(root,f),'utf8');
    obj[f.replace(/\.json$/,'')] = JSON.parse(txt);
  }catch(e){
    console.error('Failed to read', f, e.message);
  }
});

const output = `// Auto-generated: embeds all JSON files
window.QuranData = ${JSON.stringify(obj, null, 2)};
`;
fs.writeFileSync(out, output, 'utf8');
console.log('wrote', out, 'with', Object.keys(obj).length, 'entries');
