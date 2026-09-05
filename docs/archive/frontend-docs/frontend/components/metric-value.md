# MetricValue

Partial-data number display. Unknown values render as a hyphen-minus (or `unknownLabel`), never `N/A`, `null`, or `0` when the value is missing.

Import from `@/components/metric-value`. Uses `UNKNOWN_METRIC` from `@/lib/view-state`.

## Do

- Use `tabular-nums` (built in)
- Style unknown with muted foreground when the parent needs quieter secondary metrics

## Don't

- Coerce null to `0` for charts or cards
