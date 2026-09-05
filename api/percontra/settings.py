"""Django settings for the Per Contra API.

There is no ORM. DuckDB retains migration inputs and append-only decision,
approval and receipt events. The demo runs as one local operator process.
"""

import os
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# CSRF protects the local operator's mutation endpoints.
SECRET_KEY = os.environ.get("PERCONTRA_SECRET_KEY") or secrets.token_urlsafe(32)

DEBUG = os.environ.get("PERCONTRA_DEBUG") == "1"

# Cloud Run assigns the hostname at deploy time and the service holds no
# user state, so the default accepts any host.
ALLOWED_HOSTS = os.environ.get("PERCONTRA_ALLOWED_HOSTS", "*").split(",")

ROOT_URLCONF = "percontra.urls"

INSTALLED_APPS: list[str] = []

MIDDLEWARE = [
    # First: a request that did not come through the edge should not reach
    # WhiteNoise either, or the SPA bundle is served to it.
    "percontra.edge_auth.EdgeAuthMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
]

DATABASES: dict[str, dict] = {}

TEMPLATES: list[dict] = []

USE_TZ = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

DUCKDB_PATH = os.environ.get("PERCONTRA_DB", "data/percontra.duckdb")
MIGRATION_DB = os.environ.get(
    "PERCONTRA_MIGRATION_DB", str(BASE_DIR.parent / "data/migration.duckdb")
)
DATA_UPLOAD_MAX_MEMORY_SIZE = 85 * 1024 * 1024

# The built web app, served by WhiteNoise from the same process and port.
WEB_DIR = os.environ.get("PERCONTRA_WEB_DIR")

STATIC_URL = "/"
if WEB_DIR and Path(WEB_DIR).is_dir():
    WHITENOISE_ROOT = WEB_DIR
    WHITENOISE_INDEX_FILE = True
