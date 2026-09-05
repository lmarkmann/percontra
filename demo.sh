#!/bin/sh
# Per Contra one-command demo: build the web app, ingest the datasets if
# they are present, serve everything on :8080.
set -eu
cd "$(dirname "$0")"

say() { printf '[demo] %s\n' "$*"; }

GL="data/02-investor-level-gl-to-loader/source/Investor-Level GL - Q2 activity - all entities (anonymised).xlsx"
SAMPLE="data/02-investor-level-gl-to-loader/source/Phase I loader - sample (anonymised).xlsx"
REFERENCE="data/02-investor-level-gl-to-loader/output/Tranche 1 - reference and verified loader v4c (anonymised).xlsx"

say "installing python environment"
uv sync --directory api

say "building web app"
pnpm --dir web install
pnpm --dir web build

if [ -f "$GL" ] && [ -f "$SAMPLE" ] && [ -f "$REFERENCE" ]; then
	say "ingesting datasets"
	just ingest
else
	say "datasets not found in data/ (see data/README.md); serving in empty state"
fi

say "serving at http://localhost:8080"
exec just dev