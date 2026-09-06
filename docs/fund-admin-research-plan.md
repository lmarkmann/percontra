# Fund administration software research

Date: 2026-09-05

Determine whether the supplied workflows primarily suffer from inaccessible data or from translating, reconciling and approving data that can already be exported. Identify suitable accounting platforms and existing competitors for the proposed migration layer. This is research and product development; the product and backend remain undecided.

## Work

- [x] Inspect the Saldea reference workbook and preserve its 19-column company schema in the new company sheet.
- [x] Read the relevant calls and dataset READMEs. Separate direct testimony, supplied workflow evidence and vendor claims.
- [x] Research accounting platforms, documented administrator relationships, integration boundaries and competing data products using primary sources.
- [x] Produce a standalone YLOOKUP workbook with Fund_admin, Integration_fit, Admin_usage, Call_evidence and Readme sheets. Add source URLs and explicit access limitations.
- [x] Write the diagnosis and proposed first integration scope in docs/fund-admin-findings.md.
- [x] Verify workbook contents, filters, frozen headings and visual layout. Remove temporary builders and previews.

## Boundaries

The source workbook in Saldea remains a reference. The output belongs in YLOOKUP. Preserve the first 19 column names and order; add a dedicated source column. Leave financing and other irrelevant, unresearched fields blank rather than guess. Keep the migration-specific comparison on its own sheet.

The dataset anonymises system names, so identify plausible product categories and documented real-world usage, not the concealed vendor identity. Published integration capabilities do not establish customer permissions or access to a test environment. Regional relevance is not proof of regulatory compliance or of a particular fund's installation.

Research outputs contain internal workflow analysis and are not approved for public submission.

## Delivered

The workbook at outputs/fund-admin-20260905/Fund_admin_research.xlsx contains 13 researched products, six administrator relationships and nine evidence observations. All five sheets were visually reviewed. Export checks confirmed four filterable tables and frozen first rows/columns on each data sheet. No formula errors were found. The original Saldea workbook was read only. No integration was tested against a live accounting system.
