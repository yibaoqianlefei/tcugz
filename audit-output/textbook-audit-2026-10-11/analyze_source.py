from pathlib import Path
import json, re, collections
out = Path(__file__).parent
rows = json.loads((out/'paragraphs.json').read_text(encoding='utf-8'))
groups = collections.defaultdict(list)
for row in rows[60:]:
    text = re.sub(r'\s+','',row['text'])
    if len(text)>=25 and '[域' not in text:
        groups[text].append(row['id'])
dupes = [{'ids':v,'text':k} for k,v in groups.items() if len(v)>1]
dupes.sort(key=lambda x:len(x['text'])*(len(x['ids'])-1),reverse=True)
stats = dict(exact_duplicate_groups_min_25_chars=len(dupes),paragraphs_in_duplicate_groups=sum(len(x['ids']) for x in dupes),extra_occurrences=sum(len(x['ids'])-1 for x in dupes),embedded_object_markers_after_toc=sum(x['text'].count('[嵌入对象]') for x in rows[60:]))
(out/'duplicate-audit.json').write_text(json.dumps({'definition':'忽略空白后至少25字符的完全重复段落；不自动判为错误，仅为合并审阅线索','stats':stats,'groups':dupes},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(stats,ensure_ascii=False))
for group in dupes[:10]:
    print(', '.join(group['ids'])+' '+group['text'][:160])
