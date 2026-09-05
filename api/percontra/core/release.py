from datetime import UTC, datetime
from uuid import uuid4

from percontra.contract import Posting, Release

from .generate import digest


def snapshot(postings: list[Posting]) -> str:
    return digest(
        [
            posting.model_dump(mode="json")
            for posting in sorted(postings, key=lambda row: row.posting_id)
        ]
    )


def approve(postings: list[Posting], author: str) -> Release:
    if not author.strip():
        raise ValueError("A named reviewer is required")
    if not postings or any(row.status != "ready" or row.destination is None for row in postings):
        raise ValueError("The complete batch must be ready before approval")
    if len({row.batch_key.model_dump_json() for row in postings}) != 1:
        raise ValueError("Approve one complete batch at a time")
    decisions = {ref.model_dump_json(): ref for row in postings for ref in row.decisions_used}
    now = datetime.now(UTC)
    return Release(
        release_id=str(uuid4()),
        batch_key=postings[0].batch_key,
        state="approved",
        bound_decisions=list(decisions.values()),
        mapping_snapshot_digest=snapshot(postings),
        posting_ids=[row.posting_id for row in postings],
        approved_by=author,
        approved_at=now,
        state_changed_at=now,
        state_reason="Reviewed complete batch",
    )


def current(release: Release, postings: list[Posting]) -> Release:
    if release.state == "approved" and release.mapping_snapshot_digest != snapshot(postings):
        return release.model_copy(
            update={
                "state": "stale",
                "state_changed_at": datetime.now(UTC),
                "state_reason": "Source, mapping, posting or decision version changed",
            }
        )
    return release


def require_approved(release: Release | None, postings: list[Posting]):
    if release is None or current(release, postings).state != "approved":
        raise ValueError("Batch is not approved against its current source and decision versions")
