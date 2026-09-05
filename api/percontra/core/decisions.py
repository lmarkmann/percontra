from datetime import UTC, datetime

from percontra.contract import Decision

from .generate import gap_id


def decide(rows, gap, target, author, reason, history):
    if not author.strip() or not reason.strip():
        raise ValueError("Decision author and reason are required")
    affected = [
        row
        for row in rows
        if (row.values["GL_Account"], row.values["Trans_Type"])
        == (gap.values["GL_Account"], gap.values["Trans_Type"])
    ]
    if not affected:
        raise ValueError("This gap has no source rows in the current scope")
    identifier = gap_id(affected[0])
    version = (
        max((item.version for item in history if item.decision_id == identifier), default=0) + 1
    )
    return Decision(
        decision_id=identifier,
        version=version,
        gap={
            "source_gl_account": gap.values["GL_Account"],
            "source_trans_type": gap.values["Trans_Type"],
            "affected_source_refs": [row.source for row in affected],
        },
        target={
            "gl_account": target.values["GL_Account"],
            "trans_type": target.values["Trans_Type"],
            "corvus_ref": target.source,
        },
        author=author.strip(),
        reason=reason.strip(),
        decided_at=datetime.now(UTC),
        supersedes=version - 1 or None,
    )
