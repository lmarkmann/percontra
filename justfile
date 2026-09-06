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

# The existing test site only; account setup and posting still need UI confirmation.
live:
	PERCONTRA_DB=data/percontra.duckdb PERCONTRA_WEB_DIR=web/dist/client \
		api/.venv/bin/percontra serve --host 127.0.0.1 --port 8080 --live

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
	uv run --directory api pytest

contracts:
	api/.venv/bin/python scripts/contracts.py

contracts-check:
	api/.venv/bin/python scripts/contracts.py --check

deploy:
	gcloud run deploy percontra --source . --project $PROJECT_ID --region europe-west2

# percontra.dev is a Worker that proxies to the Cloud Run service (edge/proxy.ts)
deploy-edge:
	pnpm --dir edge install --frozen-lockfile
	pnpm --dir edge exec wrangler deploy

# Record a change for the next release (writes web/.changeset/<name>.md)
changeset:
	pnpm --dir web exec changeset

# web/package.json is the one version source; api derives from it.
# Apply pending changesets: bump the version, write web/CHANGELOG.md, commit, tag. Push stays manual.
release:
	git diff --quiet && git diff --cached --quiet || { echo 'working tree dirty; commit or stash first'; exit 1; }
	pnpm --dir web exec changeset version
	git add web/package.json web/CHANGELOG.md web/.changeset
	git commit -m "chore(release): v$(jq -r .version web/package.json)"
	pnpm --dir web exec changeset tag
	@echo "tagged v$(jq -r .version web/package.json). Push with: git push --follow-tags"

# api: ruff, ruff format --check, pyrefly, contract drift (what ci.yml runs)
lint:
	uv run --directory api ruff check . ../scripts
	uv run --directory api ruff format --check . ../scripts
	uv run --directory api pyrefly check
	api/.venv/bin/python scripts/contracts.py --check

# api: apply ruff fixes and formatting
fix:
	uv run --directory api ruff check --fix . ../scripts
	uv run --directory api ruff format . ../scripts

# web: oxfmt write (the prek fmt hook)
format-web:
	pnpm --dir web format

# web: oxfmt --check + oxlint, read-only (the prek lint hook)
lint-web:
	pnpm --dir web lint

# web: tsc -b (the prek types hook)
typecheck-web:
	pnpm --dir web typecheck

# web: vitest single run, not the watcher (the prek pre-push hook)
test-web:
	pnpm --dir web test:run

# web: the ci.yml web job, locally (pnpm ci:local)
verify-web:
	pnpm --dir web ci:local

# api: test suite with per-file coverage
coverage:
	uv run --directory api pytest --cov --cov-report=term-missing
