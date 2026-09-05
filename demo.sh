#!/bin/sh
# Per Contra one-command demo: check the toolchain, build the web app, ingest
# the datasets if they are present, serve everything on :8080, open the browser.
set -eu
cd "$(dirname "$0")"

say() { printf '[demo] %s\n' "$*"; }

URL="http://127.0.0.1:8080"
GL="data/02-investor-level-gl-to-loader/source/Investor-Level GL - Q2 activity - all entities (anonymised).xlsx"
SAMPLE="data/02-investor-level-gl-to-loader/source/Phase I loader - sample (anonymised).xlsx"
REFERENCE="data/02-investor-level-gl-to-loader/output/Tranche 1 - reference and verified loader v4c (anonymised).xlsx"

# Every missing tool is reported in one pass, with its install line, so a fresh
# machine does not fail on the first one and hide the rest.
missing=0
need() {
	if ! command -v "$1" >/dev/null 2>&1; then
		say "missing: $1    install: $2"
		missing=1
	fi
}
need uv "curl -LsSf https://astral.sh/uv/install.sh | sh"
need pnpm "corepack enable pnpm   (or: npm install -g pnpm)"
need just "brew install just   (or: cargo install just)"
need node "fnm install && fnm use   (reads web/.node-version)"
if command -v node >/dev/null 2>&1; then
	wanted="$(cut -d. -f1 web/.node-version)"
	have="$(node --version | sed 's/^v//' | cut -d. -f1)"
	if [ "$have" -lt "$wanted" ]; then
		say "node $have found, web/.node-version wants $wanted    fix: fnm install && fnm use"
		missing=1
	fi
fi
[ "$missing" -eq 0 ] || { say "install the tools above, then run just demo again"; exit 1; }

say "installing python environment"
uv sync --directory api

say "building web app"
pnpm --dir web install
pnpm --dir web build

if [ -f "$GL" ] && [ -f "$SAMPLE" ] && [ -f "$REFERENCE" ]; then
	say "ingesting datasets"
	just ingest
else
	say "datasets not found; serving the empty state. To load them, place the workbooks as data/README.md shows:"
	say "  $GL"
	say "  $SAMPLE"
	say "  $REFERENCE"
fi

say "serving at $URL"
# Job control puts the server in its own process group, so the trap can kill
# just and the python process under it together on Ctrl-C.
set -m
just dev &
server=$!
set +m
trap 'kill -- -$server 2>/dev/null' INT TERM EXIT

tries=0
until curl -fs "$URL/api/health" >/dev/null 2>&1; do
	tries=$((tries + 1))
	if [ "$tries" -ge 60 ] || ! kill -0 $server 2>/dev/null; then
		say "server did not answer on $URL/api/health"
		exit 1
	fi
	sleep 0.5
done

if [ -z "${PERCONTRA_NO_BROWSER:-}" ]; then
	if command -v open >/dev/null 2>&1; then
		open "$URL"
	elif command -v xdg-open >/dev/null 2>&1; then
		xdg-open "$URL"
	else
		say "open $URL in a browser"
	fi
fi

wait $server
