"""Measure every candidate pair with calc.py and record the command that produced it.

lm-color iron rule 8: a ratio with no command line above it is the violation.
Output is JSON so the gallery and the color report both read the same numbers.
"""

import json
import pathlib
import re
import subprocess
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

import palette

CALC = str(
    pathlib.Path.home() / "Documents/.parked/Skills/frontend-skills/tools/color-themes/calc.py"
)


def run(args):
    out = subprocess.run(
        ["uv", "run", "--script", CALC, *args], capture_output=True, text=True, cwd="/tmp"
    )
    return out.stdout


def hexes(colors):
    out = run(["convert", "--to", "hex", *colors])
    got = {}
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) == 2:
            got[parts[0].strip()] = parts[1].strip()
    return got


def contrast(fg, bg):
    cmd = ["contrast", fg, bg]
    out = run(cmd)
    m = re.search(r"WCAG 2\s+([\d.]+):1", out)
    a = re.search(r"APCA\s+Lc\s+(-?[\d.]+)", out)
    return {
        "fg": fg,
        "bg": bg,
        "wcag": float(m.group(1)) if m else None,
        "apca": float(a.group(1)) if a else None,
        "cmd": "calc.py " + " ".join(f"'{c}'" if " " in c else c for c in cmd),
    }


def gamut_ok(color):
    return "inside gamut" in run(["gamut", color])


result = {"neutral": {}, "accents": {}, "status": {}, "pairs": [], "gamut_failures": []}

# --- neutral ramp ---
all_colors = []
for step in palette.NEUTRAL:
    c = palette.neutral(step)
    result["neutral"][step] = {"oklch": c}
    all_colors.append(c)

# --- accents ---
for d in ("verdigris", "ink"):
    result["accents"][d] = {}
    for step in ("400", "500", "600", "700", "800", "900"):
        c = palette.accent(d, step)
        result["accents"][d][step] = {"oklch": c}
        all_colors.append(c)

# --- statuses ---
for theme in ("light", "dark"):
    result["status"][theme] = {}
    for name in palette.STATUS_HUE:
        entry = {r: palette.status(theme, name, r) for r in ("mark", "tint", "text")}
        result["status"][theme][name] = entry
        all_colors.extend(entry.values())

hx = hexes(sorted(set(all_colors)))


def put_hex(d):
    for v in d.values():
        if isinstance(v, dict):
            if "oklch" in v:
                v["hex"] = hx.get(v["oklch"])
            else:
                put_hex(v)


for group in ("neutral", "accents"):
    put_hex(result[group])
for theme in result["status"]:
    for name, roles in result["status"][theme].items():
        result["status"][theme][name] = {
            r: {"oklch": c, "hex": hx.get(c)} for r, c in roles.items()
        }

for c in sorted(set(all_colors)):
    if not gamut_ok(c):
        result["gamut_failures"].append(c)

# --- pairs that must pass ---
n = palette.neutral
LIGHT_BG, LIGHT_CARD, LIGHT_FG, LIGHT_MUTED, LIGHT_BORDER = (
    n("50"),
    n("100"),
    n("800"),
    n("700"),
    n("200"),
)
DARK_BG, DARK_CARD, DARK_FG, DARK_MUTED, DARK_BORDER = (
    n("950"),
    n("900"),
    n("100"),
    n("500"),
    n("700"),
)


def add(label, fg, bg, need, kind):
    r = contrast(fg, bg)
    r.update(label=label, need=need, kind=kind)
    r["pass"] = r["wcag"] is not None and r["wcag"] >= need
    result["pairs"].append(r)


add("light: foreground on background", LIGHT_FG, LIGHT_BG, 4.5, "text")
add("light: foreground on card", LIGHT_FG, LIGHT_CARD, 4.5, "text")
add("light: muted-foreground on background", LIGHT_MUTED, LIGHT_BG, 4.5, "text")
add("light: hairline border on background", LIGHT_BORDER, LIGHT_BG, 1.0, "decorative")
add("light: input boundary on background", n("500"), LIGHT_BG, 3.0, "non-text")
add("dark: foreground on background", DARK_FG, DARK_BG, 4.5, "text")
add("dark: foreground on card", DARK_FG, DARK_CARD, 4.5, "text")
add("dark: muted-foreground on background", DARK_MUTED, DARK_BG, 4.5, "text")
add("dark: hairline border on background", n("800"), DARK_BG, 1.0, "decorative")
add("dark: input boundary on background", n("600"), DARK_BG, 3.0, "non-text")

for d in ("verdigris", "ink"):
    add(f"light/{d}: primary-foreground on primary", n("50"), palette.accent(d, "800"), 4.5, "text")
    add(
        f"light/{d}: primary as text on background", palette.accent(d, "800"), LIGHT_BG, 4.5, "text"
    )
    add(f"dark/{d}: primary-foreground on primary", n("950"), palette.accent(d, "500"), 4.5, "text")
    add(f"dark/{d}: primary as text on card", palette.accent(d, "500"), DARK_CARD, 4.5, "text")

for theme, card in (("light", LIGHT_CARD), ("dark", DARK_CARD)):
    for name in palette.STATUS_HUE:
        mark, tint, text = (palette.status(theme, name, role) for role in ("mark", "tint", "text"))
        add(f"{theme}/{name}: text on its row tint", text, tint, 4.5, "text")
        add(f"{theme}/{name}: mark on its row tint", mark, tint, 3.0, "non-text")
        add(f"{theme}/{name}: text on card", text, card, 4.5, "text")

pathlib.Path(__file__).with_name("measured.json").write_text(json.dumps(result, indent=2))
fails = [p for p in result["pairs"] if not p["pass"]]
print(
    f"pairs measured: {len(result['pairs'])}   failing: {len(fails)}   out-of-gamut: {len(result['gamut_failures'])}"
)
for p in fails:
    print(f"  FAIL {p['label']}: {p['wcag']}:1 (need {p['need']})")
for c in result["gamut_failures"]:
    print(f"  OUT OF GAMUT {c}")
