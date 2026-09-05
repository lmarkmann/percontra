"""Read workbook occurrences without inferring row numbers after filtering."""

from dataclasses import dataclass
from pathlib import Path

import polars as pl
from openpyxl import load_workbook
from openpyxl.utils import get_column_letter

HEADER_ROWS = {"LE Mapping": 2}


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
        header_row = HEADER_ROWS.get(sheet, 1)
        cells = next(ws.iter_rows(min_row=header_row, max_row=header_row))
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

    wb = load_workbook(path, read_only=True, data_only=True)
    first = HEADER_ROWS.get(name, 1) + 1
    try:
        rows = [
            [number, *values[: len(canonical)]]
            for number, values in enumerate(
                wb[name].iter_rows(min_row=first, max_col=len(canonical), values_only=True), first
            )
            if any(value is not None for value in values)
        ]
    finally:
        wb.close()
    df = pl.DataFrame(
        rows,
        schema=["physical_row", *canonical],
        orient="row",
        infer_schema_length=None,
        strict=False,
    )
    return SheetModel(name, df, raw, canonical, letters, len(rows))
