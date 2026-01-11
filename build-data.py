import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
out = root / 'data.js'

files = [p for p in root.iterdir() if p.suffix == '.json' and p.is_file() and p.name != 'data.js']
# Filter backups or nested folders
files = [p for p in files if p.parent == root]
files.sort()

obj = {}
for p in files:
    name = p.stem
    txt = p.read_text(encoding='utf-8')
    try:
        obj[name] = json.loads(txt)
    except Exception as e:
        # try to fix common issue where file contains an object body without outer braces
        try:
            obj[name] = json.loads('{' + txt + '}')
        except Exception as e2:
            print('Failed to parse', p.name, e, 'and wrapped attempt', e2)

output = "// Auto-generated: embeds all JSON files\nwindow.QuranData = " + json.dumps(obj, ensure_ascii=False, indent=2) + ";\n"
out.write_text(output, encoding='utf-8')
print('wrote', out, 'with', len(obj), 'entries')
