import pytest

from percontra.example import load_example
from percontra.service import MigrationService


@pytest.fixture
def migration(tmp_path):
    service = MigrationService(tmp_path / "migration.duckdb")
    load_example(service)
    return service


def batch(service, name):
    return next(
        key for key, rows in service.batches().items() if rows[0].batch_key.source_batch_id == name
    )
