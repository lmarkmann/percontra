"""Render the accent decision as two complete systems, in situ.

Chips do not answer this question: the collision being judged is between the
accent and the ready/approved marks, which only shows up when both are on the
same row of the same table. So each direction renders the real thing.
"""
import json, pathlib
import palette as P

here = pathlib.Path(__file__).parent
M = json.loads((here / "measured.json").read_text())
hexof = lambda o: next((v["hex"] for g in ("neutral",) for v in M[g].values() if v["oklch"] == o), None)

def n(step): return M["neutral"][step]["hex"]
def acc(d, step): return M["accents"][d][step]["hex"]
def st(theme, name, role): return M["status"][theme][name][role]["hex"]

STATUSES = ["ready", "needs-decision", "blocked", "stale", "approved", "exported"]
LABEL = {"ready": "Ready", "needs-decision": "Needs decision", "blocked": "Blocked",
         "stale": "Stale", "approved": "Approved", "exported": "Exported"}
NOTE = {"ready": "", "needs-decision": "", "blocked": "", "stale": "",
        "approved": "", "exported": "destination not checked"}

ROWS = [
    ("Chalbury Co-Invest L.P.", "639661", "4010 Management fee", "GBP", "182,400.00", "ready"),
    ("Chalbury Co-Invest L.P.", "639661", "6200 Placement cost", "GBP", "45,000.00", "needs-decision"),
    ("Kestrel Westvale Co-Invest LP", "995747", "1100 Capital call", "USD", "2,750,000.00", "approved"),
    ("Kestrel Westvale Co-Invest LP", "995747", "8300 FX revaluation", "USD", "12,884.51", "stale"),
    ("Kestrel DJ3 Co-Invest LP", "518551", "9900 Suspense", "EUR", "603.20", "blocked"),
    ("Kestrel DJ3 Co-Invest LP", "518551", "4010 Management fee", "EUR", "96,150.00", "exported"),
]

def theme_vars(theme, direction):
    if theme == "light":
        base = {"bg": n("50"), "card": n("100"), "fg": n("800"), "muted": n("700"),
                "hairline": n("200"), "input": n("500"),
                "primary": acc(direction, "800"), "primary_fg": n("50")}
    else:
        base = {"bg": n("950"), "card": n("900"), "fg": n("100"), "muted": n("500"),
                "hairline": n("800"), "input": n("600"),
                "primary": acc(direction, "500"), "primary_fg": n("950")}
    return base

def table(theme, direction):
    v = theme_vars(theme, direction)
    out = [f'<table class="ledger"><thead><tr>'
           f'<th>Entity</th><th>Batch</th><th>Account</th><th class="num">Amount</th><th>Status</th>'
           f'</tr></thead><tbody>']
    for entity, batch, account, cur, amount, status in ROWS:
        mark, text = st(theme, status, "mark"), st(theme, status, "text")
        tint = "transparent" if status in P.UNTINTED else st(theme, status, "tint")
        note = f'<span class="note">{NOTE[status]}</span>' if NOTE[status] else ""
        out.append(
            f'<tr style="background:{tint}">'
            f'<td>{entity}</td><td class="mono">{batch}</td><td>{account}</td>'
            f'<td class="num mono">{cur} {amount}</td>'
            f'<td class="status" style="color:{text}">'
            f'<span class="dot" style="background:{mark}"></span>{LABEL[status]}{note}</td></tr>')
    out.append("</tbody></table>")
    return "\n".join(out)

def ramp(title, colors):
    cells = "".join(f'<div class="sw"><i style="background:{h}"></i><b>{k}</b></div>' for k, h in colors)
    return f'<div class="ramp"><h4>{title}</h4><div class="row">{cells}</div></div>'

def panel(theme, direction):
    v = theme_vars(theme, direction)
    accents = [(k, acc(direction, k)) for k in ("400","500","600","700","800","900")]
    marks = [(LABEL[s], st(theme, s, "mark")) for s in STATUSES]
    return f'''
<section class="panel {theme}" style="--bg:{v['bg']};--card:{v['card']};--fg:{v['fg']};
  --muted:{v['muted']};--hairline:{v['hairline']};--input:{v['input']};
  --primary:{v['primary']};--primary-fg:{v['primary_fg']}">
  <header>
    <h3>{direction.title()} accent, {theme}</h3>
    <div class="controls">
      <button class="primary">Approve batch</button>
      <button class="ghost">Withhold</button>
      <input value="Reason for the decision" readonly>
    </div>
  </header>
  {table(theme, direction)}
  {ramp("Accent ramp", accents)}
  {ramp("Status marks at full chroma", marks)}
</section>'''

CSS = """
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  background:#111;color:#eee;padding:24px}
h1{font-size:20px;margin:0 0 4px}
.lede{color:#999;max-width:70ch;margin:0 0 24px}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(560px,1fr))}
.panel{background:var(--bg);color:var(--fg);border-radius:8px;padding:18px;
  border:1px solid var(--hairline)}
.panel h3{margin:0 0 12px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.controls{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
button{font:inherit;font-size:13px;border-radius:5px;padding:5px 11px;cursor:default;border:1px solid transparent}
button.primary{background:var(--primary);color:var(--primary-fg)}
button.ghost{background:transparent;color:var(--fg);border-color:var(--input)}
input{font:inherit;font-size:13px;padding:5px 9px;border-radius:5px;
  border:1px solid var(--input);background:var(--card);color:var(--fg);min-width:210px}
table.ledger{width:100%;border-collapse:collapse;font-size:13px;
  font-variant-numeric:tabular-nums;margin-bottom:16px}
.ledger th{text-align:left;font-weight:500;color:var(--muted);font-size:11px;
  letter-spacing:.06em;text-transform:uppercase;padding:0 10px 6px;border-bottom:1px solid var(--hairline)}
.ledger td{padding:5px 10px;border-bottom:1px solid var(--hairline)}
.ledger .num{text-align:right}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}
.status{white-space:nowrap;font-weight:500}
.dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:middle}
.note{color:var(--muted);font-weight:400;font-size:11px;margin-left:6px}
.ramp h4{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 6px}
.ramp .row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.sw{text-align:center;font-size:10px;color:var(--muted)}
.sw i{display:block;width:56px;height:30px;border-radius:4px;border:1px solid var(--hairline)}
.sw b{font-weight:400;display:block;margin-top:3px}
.grey .panel{filter:grayscale(1)}
h2{font-size:14px;margin:28px 0 10px;color:#bbb;border-top:1px solid #333;padding-top:16px}
"""

body = []
body.append(f'<div class="grid">{panel("light", "verdigris")}{panel("dark", "verdigris")}</div>')

grey = f'<div class="grid grey">{panel("light","verdigris")}{panel("dark","verdigris")}</div>'

html = f"""<!doctype html><meta charset="utf-8"><title>Per Contra accent decision</title>
<style>{CSS}</style>
<h1>Per Contra: verdigris accent, six statuses</h1>
<p class="lede">Warm paper neutral at hue 87 throughout, Patina's verdigris accent at 162. Ready
carries no row tint: it is the majority state, and tinting it would make the normal the loudest
thing on the page. That also leaves green to approved alone (teal 195), so the accent never
competes with a status mark. Exported is a hedged slate, matching a label that already says the
destination was not checked.</p>
{"".join(body)}
<h2>The same two, desaturated: every status must stay legible without colour</h2>
{grey}
"""
(here / "accent-decision.html").write_text(html)
print("wrote", here / "accent-decision.html")
