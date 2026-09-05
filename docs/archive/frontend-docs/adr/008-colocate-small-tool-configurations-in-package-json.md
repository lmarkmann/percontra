# ADR 008: Colocate Small Tool Configurations in Package Metadata

**Status:** Accepted
**Date:** 2026-07-11
**Deciders:** Luis Markmann

## Context

Knip and Size Limit each had a dedicated root configuration file. Both configurations were small, JSON-compatible, and consumed only by package scripts. The separate files made the repository root harder to scan without creating meaningful isolation or enabling syntax that `package.json` could not represent.

Both tools support configuration in `package.json`: Knip reads the `knip` property and Size Limit reads the `size-limit` property.

## Decision

Move the complete operational configuration from `knip.json` to `package.json#knip` and from `.size-limit.json` to `package.json#size-limit`. The standalone Knip `$schema` property is omitted because it describes the deleted standalone file rather than a tool rule. Delete the two standalone files without changing any operational values or the existing `pnpm knip` and `pnpm size` commands.

Use `package.json` for small, JSON-only configuration that is tightly coupled to package scripts and has explicit first-party support there. Keep a dedicated file when a tool requires one, when its configuration is substantial, or when the format provides capabilities that package metadata cannot express.

## Consequences

- The repository root has two fewer configuration files.
- Package-level tooling and its scripts are visible in one place.
- `package.json` is longer, but the added sections are cohesive and remain validated by their respective tools.
- Future Knip and Size Limit changes must edit `package.json`, not recreate standalone configuration files.

## Alternatives Considered

### Keep standalone configuration files

This keeps `package.json` shorter but preserves root-level files that do not provide an independent boundary or richer configuration format.

### Create a shared configuration directory

This reduces root entries but requires custom CLI paths and moves conventional configuration away from the tools' automatic discovery locations.

## Validation

Run `pnpm knip` and `pnpm size` after a production build. Each tool must discover its section in `package.json` without an explicit configuration path.
