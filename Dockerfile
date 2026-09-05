# One container: Django serving the built web app, DuckDB on disk.
FROM node:24-slim AS web
WORKDIR /web
RUN corepack enable
COPY web/package.json web/pnpm-lock.yaml ./
COPY web/ ./
RUN pnpm install --frozen-lockfile && pnpm build

FROM python:3.14-slim AS runtime
ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
	PYTHONDONTWRITEBYTECODE=1 \
	PERCONTRA_DB=/srv/data/percontra.duckdb \
	PERCONTRA_WEB_DIR=/srv/web
WORKDIR /srv
RUN pip install uv
COPY api/ ./api/
# hatch reads the version from web/package.json (see api/pyproject.toml)
COPY web/package.json ./web/package.json
RUN uv sync --frozen --no-dev --directory api
COPY --from=web /web/dist/client ./web/
EXPOSE 8080
CMD ["uv", "run", "--directory", "api", "percontra", "serve", "--host", "0.0.0.0", "--port", "8080"]