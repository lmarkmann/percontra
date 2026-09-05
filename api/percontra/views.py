"""The /api surface, plus the fallback for client-side routes."""

from pathlib import Path

from django.conf import settings
from django.http import FileResponse, HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.http import require_GET

from . import __version__
from .db import connect

STUB = {"detail": "not implemented yet; see docs/posting-contract.md and docs/decision.md"}


def _gap_summary(conn, digest: str) -> dict | None:
    """How many Mapping Gaps rows exist and how many lack an approval."""
    row = conn.execute(
        "SELECT table_name FROM sheets WHERE file_digest = ? AND sheet_name = 'Mapping Gaps'",
        [digest],
    ).fetchone()
    if not row:
        return None
    table = row[0]  # derived by db.table_name, safe characters only
    cols = [r[1] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    approval = next((c for c in cols if "approv" in c.lower()), None)
    total = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    pending = total
    if approval:
        pending = conn.execute(
            f"SELECT COUNT(*) FROM {table} "
            f"WHERE {approval} IS NULL OR TRIM(CAST({approval} AS VARCHAR)) = ''"
        ).fetchone()[0]
    return {"gaps_total": total, "gaps_pending": pending}


@require_GET
def health(request: HttpRequest) -> JsonResponse:
    conn = connect(settings.DUCKDB_PATH)
    try:
        files = conn.execute("SELECT COUNT(*) FROM files").fetchone()[0]
    finally:
        conn.close()
    return JsonResponse({"ok": True, "version": __version__, "files": files})


@require_GET
def summary(request: HttpRequest) -> JsonResponse:
    conn = connect(settings.DUCKDB_PATH)
    try:
        files = conn.execute(
            "SELECT file_digest, original_name, role FROM files ORDER BY role"
        ).fetchall()
        out = []
        for digest, name, role in files:
            sheets = conn.execute(
                "SELECT sheet_name, row_count FROM sheets WHERE file_digest = ? "
                "ORDER BY sheet_name",
                [digest],
            ).fetchall()
            entry: dict = {
                "file_digest": digest,
                "original_name": name,
                "role": role,
                "sheets": [{"name": s, "rows": n} for s, n in sheets],
            }
            if role == "reference":
                entry["mapping_gaps"] = _gap_summary(conn, digest)
            out.append(entry)
        ingested = bool(files)
    finally:
        conn.close()
    return JsonResponse({"ingested": ingested, "files": out})


@require_GET
def not_implemented(request: HttpRequest) -> JsonResponse:
    return JsonResponse(STUB, status=501)


@require_GET
def index(request: HttpRequest) -> HttpResponse:
    if settings.WEB_DIR:
        page = Path(settings.WEB_DIR) / "index.html"
        if page.is_file():
            return FileResponse(page.open("rb"), content_type="text/html")
    return JsonResponse(
        {
            "app": "Per Contra",
            "hint": "no web build found; run 'just demo' from the repo root",
        }
    )
