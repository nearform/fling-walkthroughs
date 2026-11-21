# Merges a labels CSV from `fling responses --format csv` into dataset.jsonl → dataset.labelled.jsonl
import csv, json, collections, sys
rows = list(csv.DictReader(open(sys.argv[1] if len(sys.argv) > 1 else 'labels.csv')))
labels = collections.defaultdict(dict); flags = collections.defaultdict(list)
for r in rows:
    sid = r['path'].strip('/').split('/')[-1]
    who = r['author'].split('@')[0]
    if r['formId'] == 'label': labels[sid][who] = {'verdict': r['verdict'], 'problem': r['problem'], 'notes': r['notes']}
    else: flags[sid].append({'by': who, 'severity': r['severity'], 'details': r['details']})
out = []
for line in open('dataset.jsonl'):
    d = json.loads(line); d['labels'] = labels.get(d['id'], {}); d['flags'] = flags.get(d['id'], []); out.append(d)
open('dataset.labelled.jsonl', 'w').write(''.join(json.dumps(d) + '\n' for d in out))
both = [d for d in out if len(d['labels']) == 2]
agree = sum(1 for d in both if len({v['verdict'] for v in d['labels'].values()}) == 1)
fails = sorted({d['id'] for d in out if any(v['verdict'] == 'fail' for v in d['labels'].values())})
c = collections.Counter(v['problem'] for d in out for v in d['labels'].values() if v['verdict'] != 'pass')
print(f"both labelled: {len(both)}, agree: {agree}; failing in someone’s view: {', '.join(fails)}; problems: {', '.join(f'{k} {n}' for k, n in c.most_common())}")
