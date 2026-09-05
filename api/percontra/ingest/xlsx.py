"""Read xlsx sheets with stable headers and physical row numbers.

The header row is physical row 1 in every sheet of this dataset. Two sheets
carry duplicate header names (`Static Date`, `GL Date` twice in the GL), so
canonical column names are derived positionally: the first occurrence keeps
the header, later ones get `_2`, `_3`. The original header text is
preserved in `sheet_columns`; the canonical name is what code references.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import polars as pl
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter


@dataclass(frozen=True)
class SheetModel:
    """One sheet, ready for DuckDB: frame plus its header provenance."""

    name: str
    frame: pl.DataFrame
    headers: list[str]  # original header text, positional
    column_names: list[str]  # canonical, unique, same order
    col_letters: list[str]  # Excel column letters, same order
    row_count: int


def sheet_names(path: str | Path) -> list[str]:
    wb = load_workbook(path, read_only=True)
    try:
        return wb.sheetnames
    finally:
        wb.close()


def read_header(path: str | Path, sheet: str) -> tuple[list[str], list[str]]:
    """Original header texts and Excel column letters, row 1."""
    wb = load_workbook(path, read_only=True)
    try:
        ws = wb[sheet]
        cells = next(ws.iter_rows(min_row=1, max_row=1))
        raw = [str(c.value).strip() if c.value is not None else "" for c in cells]
        # Trailing empty cells are not columns.
        while raw and raw[-1] == "":
            raw.pop()
        letters = [get_column_letter(i + 1) for i in range(len(raw))]
        return raw, letters
    finally:
        wb.close()


def canonical_names(raw: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    out: list[str] = []
    for i, h in enumerate(raw, start=1):
        base = (h or f"col_{i}").replace('"', "'").replace(" ", "_")
        n = seen.get(base, 0) + 1
        seen[base] = n
        out.append(base if n == 1 else f"{base}_{n}")
    return out


def read_sheet(path: str | Path, name: str) -> SheetModel:
    raw, letters = read_header(path, name)
    canonical = canonical_names(raw)

    df = pl.read_excel(path, sheet_name=name)
    if df.width != len(canonical):
        raise ValueError(
            f"{name!r}: read {df.width} columns, header row has {len(canonical)}"
        )
    if df.columns != canonical:
        df = df.rename(dict(zip(df.columns, canonical)))

    # physical_row is 1-based including the header row: the first data row
    # is row 2.
    n = len(df)
    rows = pl.DataFrame(
        {"physical_row": range(2, n + 2)}, schema={"physical_row": pl.Int64}
    )
    df = pl.concat([rows, df], how="horizontal")
    return SheetModel(name, df, raw, canonical, letters, n)
