# Colour scripts

Three steps, one direction of flow. `palette.py` is the only file to edit by
hand; the other two read it, so a value can never disagree between the theme,
the report and the gallery.

```
palette.py    candidate OKLCH values and the reasoning for each
measure.py    runs calc.py over every pair, writes measured.json
gallery.py    renders accent-decision.html from measured.json
```

Run from this directory:

```
python3 measure.py && python3 gallery.py
```

`measure.py` exits noisily on any pair below its required ratio or any colour
outside the sRGB gamut. Both happened on the first pass and both were real:
four status colours at hues 82 and 195 were unreachable in sRGB, and the
control boundary missed 3:1. Do not adopt a value the script has not measured.

Results live in `docs/frontend/color-report.md`, which is the gate for a colour
change. `calc.py` comes from the lm-color skill and is not vendored here.
