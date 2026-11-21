# Turns dataset.jsonl into a page per sample under site/s/<id>/, plus a home page listing them.
import json, html, os, shutil
rows = [json.loads(l) for l in open("dataset.jsonl")]
shutil.rmtree("site/s", ignore_errors=True)
css = """:root{color-scheme:light;--ink:#1b1d29;--muted:#5c6070;--line:#e4e5ec;--bg:#fbfaf7;--card:#fff;--a:#3f6df2;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,sans-serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);line-height:1.55}
main{max-width:820px;margin:0 auto;padding:40px 28px 72px;display:grid;gap:18px}
.eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:var(--muted)}
h1{font-size:30px;letter-spacing:-.02em;margin:4px 0 0}
.msg{border-radius:14px;padding:16px 20px;border:1px solid var(--line);background:var(--card)}
.msg b{display:block;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.q{background:#f1f3fb;border-color:#dde2f5}.a{border-left:4px solid var(--a)}
.policy{font-size:14px;color:var(--muted);border:1px dashed var(--line);border-radius:12px;padding:12px 16px}
nav{display:flex;justify-content:space-between;font-size:14px}nav a{color:var(--a);text-decoration:none}
ol{padding-left:22px}li{margin:6px 0}li a{color:var(--ink)}"""
def page(title, body):
    return f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(title)}</title><style>{css}</style></head><body><main>{body}</main></body></html>\n'
for i, r in enumerate(rows):
    prev = f'<a href="../{rows[i-1]["id"]}/">← {rows[i-1]["id"]}</a>' if i else '<span></span>'
    nxt = f'<a href="../{rows[i+1]["id"]}/">{rows[i+1]["id"]} →</a>' if i < len(rows)-1 else '<span></span>'
    os.makedirs(f'site/s/{r["id"]}', exist_ok=True)
    open(f'site/s/{r["id"]}/index.html', 'w').write(page(f'{r["id"]}: {r["question"][:40]}', f'''
<div class="eyebrow">{r["model"]} · sample {r["id"]} of {len(rows)}</div>
<h1>{html.escape(r["question"])}</h1>
<div class="msg q"><b>Customer</b>{html.escape(r["question"])}</div>
<div class="msg a"><b>Assistant</b>{html.escape(r["reply"])}</div>
<div class="policy"><b>Policy</b> {html.escape(r["policy"])}</div>
<nav>{prev}<a href="../../">All samples</a>{nxt}</nav>'''))
items = "".join(f'<li><a href="s/{r["id"]}/">{html.escape(r["question"])}</a></li>' for r in rows)
open('site/index.html','w').write(page('Support assistant v3: eval set', f'''
<div class="eyebrow">Eval set · {len(rows)} samples</div><h1>Support assistant v3</h1>
<p>Label each reply against the policy beside it: pass, partial or fail, and what went wrong. Labels are blind: you see only your own.</p>
<ol>{items}</ol>'''))
print(f"{len(rows)} pages")
