# ADR 015: Keep timestamps semantic at the wire boundary

**Status:** Accepted
**Date:** 2026-07-11

## Context

The dashboard contract carried English presentation strings such as `2h ago`, `Yesterday`, and `Just now`. Those values could not be validated as time, re-rendered as time passed, or localized by a future product.

## Decision

Dashboard resources carry ISO 8601 timestamps validated by `z.iso.datetime()`. Fixtures generate those values as offsets from the current time. The client formats them through one cached English `Intl.RelativeTimeFormat` helper.

## Consequences

The wire contract stays locale-neutral and preserves temporal meaning. Relative labels use English in the template and can be recalculated without another API response. A product can change the presentation locale without changing the wire contract.
