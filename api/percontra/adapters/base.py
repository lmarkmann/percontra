from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from percontra.contract import Capabilities, Posting, Receipt, SourceRow, Warning

Registries = dict[str, list[SourceRow]]


@dataclass(frozen=True)
class UploadedFile:
    path: Path
    role: str


@dataclass(frozen=True)
class SourceHandle:
    rows: list[SourceRow]
    registries: Registries


@dataclass(frozen=True)
class DestHandle:
    registries: Registries


@dataclass(frozen=True)
class Block:
    code: str
    message: str


@dataclass(frozen=True)
class ExportArtifact:
    content: bytes
    filename: str
    media_type: str
    label: str = "Exported; destination not checked"


class SourceAdapter(Protocol):
    name: str
    capabilities: Capabilities

    def open(self, *, files: list[UploadedFile]) -> SourceHandle: ...
    def read_rows(self, *, handle: SourceHandle) -> Iterator[SourceRow]: ...
    def read_registries(self, *, handle: SourceHandle) -> Registries: ...


class DestinationAdapter[Registry](Protocol):
    name: str
    capabilities: Capabilities

    def registries(self, *, handle: DestHandle) -> Registry: ...
    def validate(
        self, *, postings: list[Posting], registries: Registry
    ) -> list[Warning | Block]: ...
    def render(self, *, postings: list[Posting]) -> ExportArtifact: ...
    def submit(self, *, artifact: ExportArtifact) -> Receipt | None: ...
