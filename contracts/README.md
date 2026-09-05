# Contracts

Two JSON Schema files are the agreement between `api/` (Python) and `web/` (TypeScript).
Derive types from them; do not hand-write parallel shapes.

- `posting.schema.json`: one candidate destination row with its evidence pointers.
- `decision.schema.json`: append-only `Decision`, `Release`, `Export` records.

## Rules the schema encodes

1. **Evidence is a physical row.** Every fact points to `(file_digest, sheet, physical_row)`. Re-uploading a changed file is a new digest, so old evidence never silently changes meaning.
2. **Identity is not unique; occurrences are.** The GL has 60 duplicate allocation rows. `SourceIdentity.occurrence_index` tells them apart; comparisons use multisets. Never de-duplicate on the way in.
3. **Mappings are references, not copies.** A posting lists which crosswalk rows produced it (`MappingRef`, with version). Repeated rows resolving to the same target are kept.
4. **Decisions are versions.** Editing a decision appends version n+1 with `supersedes = n`. Nothing is overwritten or deleted.
5. **Approval binds to versions.** A `Release` stores the exact decision versions and a digest of the mapping rows it was checked against. A new decision version or a changed mapping upload flips it to `stale`; export as approved then refuses that batch. Reverting a value creates yet another version and does not restore the old approval.
6. **Release is per batch.** Never per debit or credit leg. A batch with any `needs_decision` or `blocked` posting stays `draft`.
7. **Exports say what they are.** `label` is fixed to "Exported; destination not checked". No record ever claims acceptance by the destination system.
8. **Money is decimal text**, compared at currency precision. No float, no global net sum.

## Derivation

- Python: `datamodel-codegen --input contracts/posting.schema.json --output api/percontra/models/posting.py --output-model-type pydantic_v2.BaseModel` (same for decision).
- TypeScript: `json-schema-to-zod` or `json-schema-to-typescript` into `web/src/contract/`.
- CI check (later): regenerate and `git diff --exit-code`.

## Endpoints these shapes travel through (v1)

| Method | Path | Body / returns |
|---|---|---|
| POST | `/api/upload` | multipart workbooks; returns file digests and detected sheets |
| GET | `/api/overview` | scope manifest, counts by status, decisions required |
| GET | `/api/postings?status=&batch=` | `Posting[]` |
| GET | `/api/decisions` | `Decision[]` (all versions) |
| POST | `/api/decisions` | new `Decision` version; returns affected `Release` state changes |
| GET | `/api/releases` | `Release[]` |
| POST | `/api/releases/{batch}/approve` | author; returns `Release` |
| POST | `/api/exports` | `{scope}`; returns `Export` + file |
| GET | `/api/postings/{posting_id}/evidence` | posting + resolved mapping rows + decision history |
| GET | `/api/compare` | multiset diff against reference loader (dev/judging only) |
