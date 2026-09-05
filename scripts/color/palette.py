"""Candidate palettes for the Per Contra accent decision.

Every triple here is a proposal; nothing is adopted until calc.py has measured
it. Lightness on the neutral ramp deliberately matches Patina step for step so
the existing contrast relationships survive the retint: only chroma and hue move.
"""

PAPER_HUE = 87.0

# L values are Patina's, unchanged. C and H are the retint: one paper hue all the
# way down, fixing the achromatic 500/600/900/950 that broke the paper reading
# exactly at the hairline rules and across all of dark mode.
NEUTRAL = {
    "50": (0.962, 0.008),
    "100": (0.928, 0.010),
    "200": (0.864, 0.010),
    "300": (0.824, 0.010),
    "400": (0.748, 0.010),
    "500": (0.630, 0.009),
    "600": (0.517, 0.009),
    "700": (0.455, 0.012),
    "800": (0.345, 0.010),
    "900": (0.252, 0.008),
    "950": (0.218, 0.007),
}

# Direction A keeps Patina's verdigris exactly as shipped.
ACCENT_VERDIGRIS = {
    "400": (0.696, 0.089, 167.436),
    "500": (0.642, 0.090, 162.906),
    "600": (0.601, 0.081, 163.407),
    "700": (0.531, 0.078, 161.893),
    "800": (0.462, 0.066, 161.913),
    "900": (0.376, 0.052, 160.647),
}

# Direction B moves the accent to iron-gall ink, freeing green for "good".
ACCENT_INK = {
    "400": (0.700, 0.095, 255.0),
    "500": (0.640, 0.110, 255.0),
    "600": (0.580, 0.120, 255.0),
    "700": (0.520, 0.125, 255.0),
    "800": (0.460, 0.120, 255.0),
    "900": (0.380, 0.100, 255.0),
}

# The brief's six, in its order. Hues are spread 25/45/82/148/195 with exported
# deliberately achromatic: its label already hedges ("destination not checked"),
# so a confident colour would overclaim.
# ready is the majority state and carries no tint: an audit paper highlights the
# exception, not the normal. That also keeps green off everything except
# approved, so the verdigris accent at hue 162 never competes with a status mark.
STATUS_HUE = {
    "ready": PAPER_HUE,
    "needs-decision": 82.0,
    "blocked": 25.0,
    "stale": 45.0,
    "approved": 195.0,
    "exported": 250.0,
}
# Statuses whose row keeps the plain surface; the mark alone carries the state.
UNTINTED = {"ready"}

# mark = small full-chroma dot, tint = whole row wash, text = label on the tint.
LIGHT = {
    "ready": {"mark": (0.630, 0.009), "tint": (0.962, 0.008), "text": (0.455, 0.012)},
    "needs-decision": {"mark": (0.60, 0.118), "tint": (0.960, 0.018), "text": (0.43, 0.085)},
    "blocked": {"mark": (0.52, 0.170), "tint": (0.958, 0.016), "text": (0.44, 0.150)},
    "stale": {"mark": (0.58, 0.130), "tint": (0.958, 0.018), "text": (0.44, 0.100)},
    "approved": {"mark": (0.52, 0.085), "tint": (0.960, 0.012), "text": (0.40, 0.065)},
    "exported": {"mark": (0.58, 0.045), "tint": (0.958, 0.010), "text": (0.44, 0.045)},
}

DARK = {
    "ready": {"mark": (0.630, 0.009), "tint": (0.218, 0.007), "text": (0.630, 0.009)},
    "needs-decision": {"mark": (0.78, 0.130), "tint": (0.283, 0.024), "text": (0.84, 0.090)},
    "blocked": {"mark": (0.68, 0.160), "tint": (0.283, 0.024), "text": (0.78, 0.110)},
    "stale": {"mark": (0.74, 0.130), "tint": (0.281, 0.024), "text": (0.82, 0.100)},
    "approved": {"mark": (0.72, 0.090), "tint": (0.283, 0.018), "text": (0.82, 0.070)},
    "exported": {"mark": (0.70, 0.050), "tint": (0.281, 0.012), "text": (0.80, 0.045)},
}


def oklch(lightness, chroma, hue):
    return f"oklch({lightness:.3f} {chroma:.3f} {hue:.3f})"


def neutral(step):
    lightness, chroma = NEUTRAL[step]
    return oklch(lightness, chroma, PAPER_HUE)


def status(theme, name, role):
    lightness, chroma = (LIGHT if theme == "light" else DARK)[name][role]
    return oklch(lightness, chroma, STATUS_HUE[name])


def accent(direction, step):
    lightness, chroma, hue = (ACCENT_VERDIGRIS if direction == "verdigris" else ACCENT_INK)[step]
    return oklch(lightness, chroma, hue)
