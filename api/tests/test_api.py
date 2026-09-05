from pathlib import Path

import pytest
from django.test import Client

from percontra.db import connect


@pytest.fixture()
def client(tmp_path: Path, settings) -> Client:
    settings.DUCKDB_PATH = str(tmp_path / "t.duckdb")
    settings.MIGRATION_DB = str(tmp_path / "migration.duckdb")
    settings.WEB_DIR = None
    connect(settings.DUCKDB_PATH).close()
    return Client()


def test_health_reports_an_empty_database(client: Client) -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["ok"] is True
    assert res.json()["files"] == 0


def test_summary_says_nothing_is_ingested(client: Client) -> None:
    res = client.get("/api/summary")
    assert res.status_code == 200
    assert res.json() == {"ingested": False, "files": []}


@pytest.mark.parametrize(
    "path", ["/api/decisions", "/api/releases", "/api/overview", "/api/adapters"]
)
def test_migration_endpoints_have_empty_states(client: Client, path: str) -> None:
    assert client.get(path).status_code == 200


def test_index_points_at_the_demo_command_without_a_web_build(client: Client) -> None:
    res = client.get("/")
    assert res.status_code == 200
    assert "just demo" in res.json()["hint"]


def test_client_side_routes_fall_through_to_the_app(client: Client) -> None:
    assert client.get("/decisions").status_code == 200
