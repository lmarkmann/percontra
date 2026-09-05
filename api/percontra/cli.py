"""Command line: ingest the workbooks, serve the app."""

import argparse
import json
import os


def _db_path(value: str | None) -> str:
    return value or os.environ.get("PERCONTRA_DB", "data/percontra.duckdb")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="percontra",
        description="Migration sign-off for fund accounting.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    ingest = sub.add_parser("ingest", help="load the three workbooks into DuckDB")
    ingest.add_argument(
        "--db", help="DuckDB file (default: $PERCONTRA_DB or data/percontra.duckdb)"
    )
    ingest.add_argument("--gl", required=True, help="Investor-Level GL workbook")
    ingest.add_argument("--sample", required=True, help="Phase I loader sample workbook")
    ingest.add_argument(
        "--reference", required=True, help="Tranche 1 reference and verified loader"
    )

    serve = sub.add_parser("serve", help="run the API, serving the built web app")
    serve.add_argument("--db")
    serve.add_argument("--web", help="built web app, e.g. web/dist")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8080)
    serve.add_argument(
        "--live",
        action="store_true",
        help="enable ERPNext writes in the loopback operator instance",
    )

    smoke = sub.add_parser(
        "erpnext-smoke", help="preview or post a separate synthetic GBP 1.00 connectivity test"
    )
    smoke.add_argument("--post", action="store_true")
    smoke.add_argument("--confirm-company")

    args = parser.parse_args(argv)

    if args.command == "erpnext-smoke":
        from .adapters.destination.erpnext import COMPANY, ERPError
        from .erpnext_smoke import run

        if args.post and args.confirm_company != COMPANY:
            parser.error("--post requires --confirm-company 'Chalbury Co-Invest L.P.'")
        os.environ["PERCONTRA_LIVE"] = "1" if args.post else "0"
        try:
            report = run(post=args.post)
        except (ERPError, ValueError) as error:
            print(json.dumps({"error": str(error)}))
            return 1
        print(json.dumps(report, indent=2, default=str))
        return 0 if not args.post or report.get("receipt", {}).get("state") == "verified" else 1

    if args.command == "ingest":
        from .ingest import ingest_all

        reports = ingest_all(_db_path(args.db), args.gl, args.sample, args.reference)
        for r in reports:
            note = " skipped (unchanged)" if r.skipped else ""
            sheets = ", ".join(f"{s}={n}" for s, n in sorted(r.sheets.items()))
            print(f"{r.original_name}: {r.file_digest[:12]}{note} [{sheets}]")
        return 0

    if args.command == "serve":
        if args.live and args.host not in ("127.0.0.1", "::1"):
            parser.error("--live requires a loopback bind address")
        os.environ["PERCONTRA_LIVE"] = "1" if args.live else "0"
        os.environ["PERCONTRA_DB"] = _db_path(args.db)
        if args.web:
            os.environ["PERCONTRA_WEB_DIR"] = args.web
        os.environ.setdefault("DJANGO_SETTINGS_MODULE", "percontra.settings")
        import uvicorn

        uvicorn.run("percontra.asgi:application", host=args.host, port=args.port)
        return 0

    parser.error(f"unknown command: {args.command}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
