# Per Contra. Run `just` for the list.

GL := "data/02-investor-level-gl-to-loader/source/Investor-Level GL - Q2 activity - all entities (anonymised).xlsx"
SAMPLE := "data/02-investor-level-gl-to-loader/source/Phase I loader - sample (anonymised).xlsx"
REFERENCE := "data/02-investor-level-gl-to-loader/output/Tranche 1 - reference and verified loader v4c (anonymised).xlsx"

default:
	@just --list

# Install the Python environment (api/.venv)
sync:
	uv sync --directory api

# One command: build, ingest if data is present, serve at :8080
demo:
	./demo.sh

# Serve only (expects web/dist and, optionally, ingested data)
dev:
	PERCONTRA_DB=data/percontra.duckdb PERCONTRA_WEB_DIR=web/dist/client \
		api/.venv/bin/percontra serve --host 127.0.0.1 --port 8080

build:
	pnpm --dir web install
	pnpm --dir web build

ingest:
	test -f '{{GL}}' && test -f '{{SAMPLE}}' && test -f '{{REFERENCE}}' || \
		(echo "datasets missing, see data/README.md" && exit 1)
	api/.venv/bin/percontra ingest \
		--db data/percontra.duckdb \
		--gl '{{GL}}' --sample '{{SAMPLE}}' --reference '{{REFERENCE}}'

test:
	api/.venv/bin/pytest

deploy:
	gcloud run deploy percontra --source . --project $PROJECT_ID --region europe-west2