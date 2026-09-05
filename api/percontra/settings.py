"""Django settings for the Per Contra API.

There is no ORM here. The data lives in DuckDB and is reached through
percontra.db, so DATABASES is empty and the auth, sessions and
contenttypes apps are absent. Nothing is stored server-side between
requests, which is what lets the deployment be one stateless container.
"""

from __future__ import annotations

import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Nothing is signed and no cookie is issued, so this key is only present
# because Django requires one. An ephemeral key beats a committed default
# in a repo the judges read.
SECRET_KEY = os.environ.get("PERCONTRA_SECRET_KEY") or secrets.token_urlsafe(32)

DEBUG = os.environ.get("PERCONTRA_DEBUG") == "1"

# Cloud Run assigns the hostname at deploy time and the service holds no
# user state, so the default accepts any host.
ALLOWED_HOSTS = os.environ.get("PERCONTRA_ALLOWED_HOSTS", "*").split(",")

ROOT_URLCONF = "percontra.urls"

INSTALLED_APPS: list[str] = []

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
]

DATABASES: dict[str, dict] = {}

TEMPLATES: list[dict] = []

USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

DUCKDB_PATH = os.environ.get("PERCONTRA_DB", "data/percontra.duckdb")

# The built web app, served by WhiteNoise from the same process and port.
WEB_DIR = os.environ.get("PERCONTRA_WEB_DIR")

STATIC_URL = "/"
if WEB_DIR and Path(WEB_DIR).is_dir():
    WHITENOISE_ROOT = WEB_DIR
    WHITENOISE_INDEX_FILE = True
