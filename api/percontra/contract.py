"""The row/version contract between the data side and the product side.

A posting is one candidate row of the destination loader. It must carry
enough pointers to explain any amount without reopening a workbook:
exact source occurrences, the mapping or decision that produced it, and
the approval state of its batch. The web renders these types directly;
the API returns them as-is.

Agreement rule: this file is the single source of the contract. If a field
changes here, the web types in web/src/contract are updated in the same
commit.
"""

from __future__ import annotations

from pydantic import BaseModel

# Amounts are stored and compared as decimal strings with the documented
# currency precision. No floats cross this boundary.
Money = str


class SourceRef(BaseModel):
    """One exact source occurrence, as it appears in Excel."""

    file_digest: str
    sheet: str
    physical_row: int


class EntityRef(BaseModel):
    source_label: str
    corvus_id: str | None = None
    evidence: list[SourceRef] = []


class AccountRef(BaseModel):
    source_gl_account: str
    source_trans_type: str
    target_account_code: str | None = None
    target_label: str | None = None
    # Which rule produced the target: an explicit crosswalk row, the batch
    # preference override, or a recorded decision.
    rule: str
    evidence: list[SourceRef] = []


class DecisionRef(BaseModel):
    decision_id: str
    version: int
    author: str
    reason: str


class Posting(BaseModel):
    posting_id: str
    batch_ref: str
    batch_type: str | None = None
    scope: bool  # entity is inside the frozen reference-derived scope
    entity: EntityRef
    account: AccountRef
    investor: EntityRef | None = None
    deals: EntityRef | None = None
    transaction_currency: str | None = None
    amount_local: Money | None = None
    amount_entity: Money | None = None
    quantity: Money | None = None
    source: list[SourceRef]
    decision: DecisionRef | None = None
    # ready: exported as-is under current approvals
    # decide: a Mapping Gaps row applies and no recorded decision exists
    # blocked: conflicting crosswalk targets, unsupported rule, or stale approval
    status: str
    stale: bool = False


class GapDecision(BaseModel):
    """A decision queue entry, initially opened on a Mapping Gaps row."""

    decision_id: str
    gap_ref: SourceRef
    gl_account: str
    trans_type: str
    affected_rows: list[SourceRef]
    gross_by_currency: dict[str, Money]
    current: DecisionRef | None = None
    superseded: list[DecisionRef] = []
    proposed_target: str | None = None


class BatchRelease(BaseModel):
    batch_ref: str
    status: str
    pending_decisions: list[DecisionRef]
    approved_by: str | None = None
    approved_at: str | None = None
    stale_reason: str | None = None


class AmountEvidence(BaseModel):
    """What the amount drawer answers: click an amount, get this."""

    posting_id: str
    amount: Money
    contributing_source: list[SourceRef]
    mapping: AccountRef
    decision: DecisionRef | None = None
    approval: BatchRelease | None = None
