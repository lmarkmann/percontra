import json
from pathlib import Path

import duckdb


class Store:
    def __init__(self, path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with duckdb.connect(str(self.path)) as connection:
            connection.execute("""CREATE TABLE IF NOT EXISTS migration_runs (
                id TEXT PRIMARY KEY, payload JSON NOT NULL, created_at TIMESTAMP DEFAULT now());
                CREATE TABLE IF NOT EXISTS migration_events (
                sequence BIGINT PRIMARY KEY, kind TEXT NOT NULL, run_id TEXT NOT NULL,
                payload JSON NOT NULL, created_at TIMESTAMP DEFAULT now());""")

    def save_run(self, identifier, payload):
        with duckdb.connect(str(self.path)) as connection:
            connection.execute(
                "INSERT INTO migration_runs (id,payload) VALUES (?,?) ON CONFLICT DO NOTHING",
                [identifier, json.dumps(payload)],
            )
        self.append("activate", identifier, {"run_id": identifier})

    def run(self, identifier=None):
        with duckdb.connect(str(self.path), read_only=True) as connection:
            if identifier is not None:
                row = connection.execute(
                    "SELECT id,payload FROM migration_runs WHERE id=?", [identifier]
                ).fetchone()
            else:
                row = connection.execute(
                    "SELECT id,payload FROM migration_runs ORDER BY "
                    "coalesce((SELECT max(sequence) FROM migration_events "
                    "WHERE kind='activate' AND run_id=migration_runs.id),0) DESC, "
                    "created_at DESC LIMIT 1"
                ).fetchone()
        return (row[0], json.loads(row[1])) if row else None

    def append(self, kind, run_id, payload):
        with duckdb.connect(str(self.path)) as connection:
            connection.execute(
                "INSERT INTO migration_events (sequence,kind,run_id,payload) "
                "SELECT coalesce(max(sequence),0)+1,?,?,? FROM migration_events",
                [kind, run_id, json.dumps(payload)],
            )

    def events(self, kind, run_id=None):
        with duckdb.connect(str(self.path), read_only=True) as connection:
            rows = connection.execute(
                "SELECT payload FROM migration_events WHERE kind=? "
                "AND (? IS NULL OR run_id=?) ORDER BY sequence",
                [kind, run_id, run_id],
            ).fetchall()
        return [json.loads(row[0]) for row in rows]
