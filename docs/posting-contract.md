# Posting and review contract

The authoritative shapes are [posting.schema.json](../contracts/posting.schema.json), [decision.schema.json](../contracts/decision.schema.json), and [adapter.schema.json](../contracts/adapter.schema.json). Do not define parallel posting or decision models.

```sh
just contracts
just contracts-check
```

These generate `api/percontra/contract/models.py` and `web/src/contract/migration.ts`. The generator uses the installed Python code generator and the project's TypeScript formatter; generated files are committed, private data is not.

## Identity and evidence

A posting retains its source file digest, filename, sheet and physical row. The three-column hypothesis of legal entity, JE index and transaction index is not unique in dataset 02. Source identity therefore also records vehicle, batch, investor RFX ID and an occurrence index. Posting IDs identify physical source occurrences; identical-looking rows are not silently deduplicated.

Canonical source values are strings. Money has an amount decimal string and currency; calculations use Decimal. The scoped USD/GBP/EUR demonstration rounds amounts to two decimals. Other currency precision policies are not implemented.

Every mapping pointer records its table, source reference and version. Workbook mappings have version 1 within their immutable file digest; replacing workbook bytes creates a new run. Manual decisions retain a stable decision ID, incrementing version, target chart row, author, reason, timestamp and superseded version.

## Release boundary

A release binds the full sorted posting snapshot, not merely a decision count. It covers one complete batch. Source, mapping, destination or decision changes make an approved snapshot stale.

Decisions and release events are appended, never overwritten by the application. A new decision with the same target still invalidates an old dependent approval. The service checks approval again before export and submission; disabling a button is not the security boundary.

The browser's amount evidence view returns the canonical posting, original source values, referenced mapping rows, relevant decision history and the current batch approval.

## Destination boundary

File adapters return an artifact labelled `Exported; destination not checked`, and no receipt. Export records retain the file digest, release state and batch scope; the service stores the bytes under that digest.

ERPNext submission intents are persisted before network writes. The canonical artifact digest excludes the submission-attempt marker appended to the journal remark. The complete outbound document, marker and approval snapshot are retained with the intent.

Receipt states distinguish prepared, draft saved, submitted, verified, rejected, unknown and drifted. Only document and GL read-back can produce verified. Unknown outcomes block retries; verification can discover an existing draft but never submits it automatically.

Destination-specific code stays outside core. The generic destination protocol permits each adapter's registry type; source registries use evidenced canonical rows. ERPNext submission is invoked only through the persisted release-controlled service, not a raw adapter submit call.

## Comparison boundary

The verified loader is never a generation input. The comparison currently uses ten documented fields and multiset counts, preserving multiplicity. A selected-field match is not full loader compatibility, and an exported workbook is not destination acceptance.
