"""Exercise the built review desk against a disposable database, without ERPNext writes."""

import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def exercise(origin):
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(origin)
        page.wait_for_load_state("networkidle")
        print("Initial headings:", page.get_by_role("heading").all_text_contents())
        page.get_by_role("button", name="Public example", exact=True).click()
        expect(page.get_by_text("Public synthetic example", exact=False)).to_be_visible()
        page.get_by_role("button", name="BATCH public-gap", exact=False).click()
        expect(page.get_by_role("button", name="Approve 2 rows")).to_be_disabled()
        page.get_by_label("Reviewer name").fill("Browser test reviewer")
        page.get_by_role("button", name="40070 - Bank interest", exact=False).click()
        page.get_by_label("Find a target transaction type").fill("Administration")
        page.get_by_role("button", name="Search Corvus chart").click()
        expect(page.get_by_role("button", name="Search Corvus chart")).to_be_enabled()
        print("Target choices:", page.get_by_role("combobox").inner_text())
        page.get_by_role("combobox").select_option("3")
        page.get_by_label("Accounting reason").fill("Synthetic example: administration cost")
        page.get_by_role("button", name="Record decision v1").click()
        expect(page.get_by_role("button", name="Approve 2 rows")).to_be_enabled()
        page.get_by_role("button", name="Approve 2 rows").click()
        expect(page.get_by_role("button", name="Export loader")).to_be_enabled()
        with page.expect_download() as download:
            page.get_by_role("button", name="Export loader").click()
        assert download.value.suggested_filename == "phase1-loader.xlsx"
        page.get_by_role("button", name="$76.25 Dr", exact=True).click()
        dialog = page.get_by_role("dialog")
        expect(dialog).to_be_visible()
        expect(dialog.get_by_text("Investor-Level GL, row 4", exact=True)).to_be_visible()
        expect(
            dialog.get_by_text("Synthetic example: administration cost", exact=True)
        ).to_be_visible()
        expect(dialog.get_by_text("approved · Browser test reviewer", exact=False)).to_be_visible()
        page.get_by_role("button", name="Close", exact=True).click()
        page.get_by_label("Accounting reason").fill("Reconfirmation creates a new decision version")
        page.get_by_role("button", name="Record decision v2").click()
        expect(page.get_by_text("A dependency changed.", exact=False)).to_be_visible()
        expect(page.get_by_role("button", name="Export loader")).to_be_disabled()
        page.reload()
        page.wait_for_load_state("networkidle")
        page.get_by_role("button", name="BATCH public-gap", exact=False).click()
        expect(page.get_by_role("button", name="Export loader")).to_be_disabled()
        page.set_viewport_size({"width": 390, "height": 844})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert not errors, errors
        print(
            "PASS: source -> decision -> approval -> download -> evidence -> stale -> reload; mobile fits"
        )
        browser.close()


def main():
    with tempfile.TemporaryDirectory(prefix="percontra-browser-") as directory:
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            port = listener.getsockname()[1]
        origin = f"http://127.0.0.1:{port}"
        environment = {
            **os.environ,
            "PERCONTRA_MIGRATION_DB": directory + "/migration.duckdb",
            "PERCONTRA_DB": directory + "/ingest.duckdb",
        }
        with open(directory + "/server.log", "w+") as log:
            server = subprocess.Popen(
                [
                    sys.executable,
                    "-m",
                    "percontra.cli",
                    "serve",
                    "--port",
                    str(port),
                    "--web",
                    str(ROOT / "web/dist/client"),
                ],
                cwd=ROOT,
                env=environment,
                stdout=log,
                stderr=log,
            )
            try:
                for _ in range(60):
                    try:
                        with urlopen(origin + "/api/health", timeout=1) as response:
                            if response.status == 200:
                                break
                    except URLError:
                        time.sleep(0.25)
                else:
                    raise RuntimeError("Local server did not become ready")
                exercise(origin)
            finally:
                server.terminate()
                server.wait(timeout=10)


if __name__ == "__main__":
    main()
