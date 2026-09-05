# ADR 032: Internationalization Is Opt-In

**Status:** Accepted
**Date:** 2026-07-13
**Deciders:** Luis Markmann

## Context

The template shipped General Translation, a German core catalog, locale controls, runtime initialization, environment variables, build exclusions, and translation-specific tests. That surface imposed entry weight and maintenance before a product had defined its supported locales, locale negotiation, URL policy, catalog ownership, or deployment workflow. A partially translated template also suggested broader language support than it provided.

## Decision

The template ships English only. User-facing copy is literal English in components, the document language remains `<html lang="en">`, and relative time formatting is explicitly English. No translation helper, no-op locale store, migration shim, or dormant internationalization abstraction remains.

A product adds internationalization when multilingual support is a real requirement. At that point it selects a system and defines locale negotiation, routing, catalogs, accessibility, fallback behavior, and translation delivery together.

Wire contracts remain presentation-neutral. ISO timestamps and API schemas do not change with this decision.

## Consequences

- The root provider tree and startup path are smaller.
- The template no longer offers German copy or locale controls.
- Product forks own the cost and design of internationalization when they need it.
- Adding a language later is a product feature, not a configuration toggle.

## Alternatives Considered

### Keep General Translation as a default

Rejected. It charged every clone for a requirement most clones had not established and made partial German coverage look like a supported product language.

### Keep a dormant translation abstraction

Rejected. A no-op helper preserves indirection without settling the product-specific choices that make an internationalization system useful.

## Validation

Source, configuration, environment types, package metadata, and the lockfile contain no active General Translation references. The English UI, static home shell, document language, relative-time output, build, and size gates remain covered by tests.
