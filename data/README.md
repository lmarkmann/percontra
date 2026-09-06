# data/

The three workbooks for the `02-investor-level-gl-to-loader` dataset
(Ylookup x Encode AI hackathon pack). They are not committed: the public
repo documents this file layout instead, and the code reads from exactly
these paths.

Place the files as:

```
data/02-investor-level-gl-to-loader/
    source/
        Investor-Level GL - Q2 activity - all entities (anonymised).xlsx
        Phase I loader - sample (anonymised).xlsx
    output/
        Tranche 1 - reference and verified loader v4c (anonymised).xlsx
```

These are the exact filenames from the `02-investor-level-gl-to-loader`
folder of the hackathon data pack, mirrored in place.

What each one is:

| Role | File | Key sheets |
|---|---|---|
| `--gl` | Investor-Level GL - Q2 activity - all entities (anonymised).xlsx | `Investor-Level GL` (33,902 rows, 43 columns; `Static Date` and `GL Date` each appear twice as headers, disambiguated by column position at ingest) |
| `--sample` | Phase I loader - sample (anonymised).xlsx | `Phase I Loader Sample` (94,454 rows, 27 columns) |
| `--reference` | Tranche 1 - reference and verified loader v4c (anonymised).xlsx | `Upload Template (VERIFIED v4c)` (18,929 rows), `Mapping Gaps` (2 rows), `Movements Rec`, 11 reference sheets |

Two things about the data that shape the code:

- Every row that is ingested keeps its origin as
  `(file_digest, sheet, physical_row)`, where `physical_row` is the Excel
  row number, 1-based including the header. Nothing downstream may
  re-infer a row's origin.
- The reference workbook is an evaluation input, not a generation input:
  the generator reads the GL and the mapping sheets only, and the
  comparison step is the only place the reference rows are read.

Ingest:

```sh
just ingest
```

idempotent: a workbook is hashed (sha256) and re-ingested only when its
bytes change.

The pack's README notes the material derives from real client work and
has been anonymised by Ylookup. Judges who run the repo without the
workbooks see the app's overview state pointing at this file.
