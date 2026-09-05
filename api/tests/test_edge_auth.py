"""The origin must be unreachable except through the edge."""

from __future__ import annotations

import pytest
from django.test import Client


@pytest.fixture
def client() -> Client:
    return Client()


def test_no_token_configured_leaves_the_origin_open(monkeypatch, client):
    # `just demo` and local development have no Worker in front of them.
    monkeypatch.delenv("PERCONTRA_EDGE_TOKEN", raising=False)
    assert client.get("/api/health").status_code == 200


def test_a_request_without_the_header_is_refused(monkeypatch, client):
    monkeypatch.setenv("PERCONTRA_EDGE_TOKEN", "shared-token")
    assert client.get("/api/health").status_code == 403


def test_a_request_carrying_the_header_passes(monkeypatch, client):
    monkeypatch.setenv("PERCONTRA_EDGE_TOKEN", "shared-token")
    response = client.get("/api/health", HTTP_X_EDGE_AUTH="shared-token")
    assert response.status_code == 200


def test_a_wrong_token_is_refused(monkeypatch, client):
    monkeypatch.setenv("PERCONTRA_EDGE_TOKEN", "shared-token")
    response = client.get("/api/health", HTTP_X_EDGE_AUTH="guessed")
    assert response.status_code == 403


def test_a_blank_token_fails_closed_rather_than_open(monkeypatch, client):
    # Nobody sets this to "" on purpose; a blank value means the pipeline that
    # was meant to supply it ate the value, which is how this project once
    # shipped an open site that looked configured.
    monkeypatch.setenv("PERCONTRA_EDGE_TOKEN", "   ")
    assert client.get("/api/health").status_code == 503


def test_the_spa_shell_is_withheld_too_not_only_the_api(monkeypatch, client):
    # The middleware runs before WhiteNoise on purpose: a bypass that still
    # served the bundle would hand over the whole client.
    monkeypatch.setenv("PERCONTRA_EDGE_TOKEN", "shared-token")
    assert client.get("/").status_code == 403
