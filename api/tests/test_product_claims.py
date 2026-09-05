"""The four guarantees the product claims. Each is a sentence; the suite proves it."""

import pytest
from conftest import batch

from percontra.core.generate import digest
from percontra.service import MigrationService

REVIEWER = "Demo reviewer"


def test_release_goes_stale_on_a_new_decision_version(migration):
    gap = batch(migration, "public-gap")
    migration.decide(2, 3, REVIEWER, "Administration expense, confirmed in source")
    migration.approve(gap, REVIEWER)
    assert migration.release_for(gap, migration.batch(gap)).state == "approved"

    migration.decide(2, 4, REVIEWER, "Reclassified as legal")
    assert migration.release_for(gap, migration.batch(gap)).state == "stale"

    restarted = MigrationService(migration.store.path)
    assert restarted.release_for(gap, restarted.batch(gap)).state == "stale"


def test_unaffected_batch_stays_approved_when_another_decision_changes(migration):
    clean = batch(migration, "public-clean")
    gap = batch(migration, "public-gap")
    migration.approve(clean, REVIEWER)
    migration.decide(2, 3, REVIEWER, "Administration expense, confirmed in source")
    migration.approve(gap, REVIEWER)

    migration.decide(2, 4, REVIEWER, "Reclassified as legal")
    assert migration.release_for(gap, migration.batch(gap)).state == "stale"
    assert migration.release_for(clean, migration.batch(clean)).state == "approved"
    assert migration.export(clean)[0].content


def test_export_refuses_a_stale_batch(migration):
    gap = batch(migration, "public-gap")
    migration.decide(2, 3, REVIEWER, "Administration expense, confirmed in source")
    migration.approve(gap, REVIEWER)
    assert migration.export(gap)[0].content

    migration.decide(2, 4, REVIEWER, "Reclassified as legal")
    with pytest.raises(ValueError, match="not approved"):
        migration.export(gap)

    # Reverting is a third version, not a restore of the first approval.
    migration.decide(2, 3, REVIEWER, "Restore intended administration treatment")
    with pytest.raises(ValueError, match="not approved"):
        migration.export(gap)

    migration.approve(gap, REVIEWER)
    assert migration.export(gap)[0].content


def test_duplicate_occurrences_are_kept_as_a_multiset(migration):
    _identifier, payload = migration.store.run()
    duplicate = {
        **payload["rows"][0],
        "source": {**payload["rows"][0]["source"], "physical_row": 6},
    }
    payload["rows"].append(duplicate)
    migration.store.save_run(digest(payload), payload)
    rows = migration.postings()
    assert len(rows) == 5
    assert len({row.posting_id for row in rows}) == 5
    assert max(row.source_identity.occurrence_index for row in rows) == 1
