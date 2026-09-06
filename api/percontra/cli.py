"""Command line: ingest the workbooks, serve the app."""

import os
from typing import Annotated

import orjson
import typer

app = typer.Typer(
    no_args_is_help=True,
    add_completion=False,
    help="Migration sign-off for fund accounting.",
)


def _db_path(value: str | None) -> str:
    return value or os.environ.get("PERCONTRA_DB", "data/percontra.duckdb")


@app.command(help="load the three workbooks into DuckDB")
def ingest(
    gl: Annotated[str, typer.Option(help="Investor-Level GL workbook")],
    sample: Annotated[str, typer.Option(help="Phase I loader sample workbook")],
    reference: Annotated[str, typer.Option(help="Tranche 1 reference and verified loader")],
    db: Annotated[
        str | None,
        typer.Option(help="DuckDB file (default: $PERCONTRA_DB or data/percontra.duckdb)"),
    ] = None,
) -> None:
    from .ingest import ingest_all

    reports = ingest_all(_db_path(db), gl, sample, reference)
    for r in reports:
        note = " skipped (unchanged)" if r.skipped else ""
        sheets = ", ".join(f"{s}={n}" for s, n in sorted(r.sheets.items()))
        print(f"{r.original_name}: {r.file_digest[:12]}{note} [{sheets}]")


@app.command(help="run the API, serving the built web app")
def serve(
    db: Annotated[str | None, typer.Option()] = None,
    web: Annotated[str | None, typer.Option(help="built web app, e.g. web/dist")] = None,
    host: Annotated[str, typer.Option()] = "127.0.0.1",
    port: Annotated[int, typer.Option()] = 8080,
    live: Annotated[
        bool,
        typer.Option("--live", help="enable ERPNext writes in the loopback operator instance"),
    ] = False,
) -> None:
    if live and host not in ("127.0.0.1", "::1"):
        raise typer.BadParameter("--live requires a loopback bind address")
    os.environ["PERCONTRA_LIVE"] = "1" if live else "0"
    os.environ["PERCONTRA_DB"] = _db_path(db)
    if web:
        os.environ["PERCONTRA_WEB_DIR"] = web
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "percontra.settings")
    import uvicorn

    uvicorn.run("percontra.asgi:application", host=host, port=port)


@app.command(
    "erpnext-smoke",
    help="preview or post a separate synthetic GBP 1.00 connectivity test",
)
def erpnext_smoke(
    post: Annotated[bool, typer.Option("--post")] = False,
    confirm_company: Annotated[str | None, typer.Option()] = None,
) -> None:
    from .adapters.destination.erpnext import COMPANY, ERPError
    from .erpnext_smoke import run

    if post and confirm_company != COMPANY:
        raise typer.BadParameter("--post requires --confirm-company 'Chalbury Co-Invest L.P.'")
    os.environ["PERCONTRA_LIVE"] = "1" if post else "0"
    try:
        report = run(post=post)
    except (ERPError, ValueError) as error:
        print(orjson.dumps({"error": str(error)}).decode())
        raise typer.Exit(1) from None
    print(orjson.dumps(report, default=str, option=orjson.OPT_INDENT_2).decode())
    if post and report.get("receipt", {}).get("state") != "verified":
        raise typer.Exit(1)


def main() -> None:
    app()


if __name__ == "__main__":
    main()
