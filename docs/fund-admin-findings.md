# Fund administration data portability

Research checked 5 September 2026. Internal product discovery; not approved for public submission.

The strongest supported problem is translating and checking data after it is available. The material does not establish technical inability to export as the primary obstacle. Build the proposed layer around preserving accounting meaning, resolving exceptions and proving a correct handoff. Its commercial value remains a hypothesis.

## What the calls establish

- The manager explicitly identifies processing and quality control as the problem: [call 1, lines 57 to 66](../.claude/md_references/call-1-nav-workflow-review.md:57). His recurring side-letter error concerns accounting interpretation, not extraction: [lines 41 to 44](../.claude/md_references/call-1-nav-workflow-review.md:41).
- He cares about repeated review turns, not the duration of each turn: [call 1, lines 100 to 111](../.claude/md_references/call-1-nav-workflow-review.md:100). A migration product only addresses this indirectly unless it captures decisions and checks outputs.
- Ylookup describes manual consolidation across fifteen administrators: [call 2, lines 23 to 26](../.claude/md_references/call-2-workflow-walkthrough-with-a-prospect.md:23). This supports investigating recurring cross-administrator translation, but it is a sales account of other clients' experience.
- Dataset 02 already contains a ledger export and a destination loader. Its work is entity, account, deal and investor mapping, batch rules, reconciliation and human decisions on unresolved gaps: [dataset README, lines 21 to 50](../.claude/md_references/readme-02-investor-level-gl-to-loader.md:21).

There is no direct evidence of a refused export, an unusable API, an export fee or contractual obstruction. Absence from these partial calls does not prove those obstacles never occur. The supplied export also does not prove that all required documents, history and rules were exported.

## Which systems fit

Allvue Fund Accounting, FIS Private Capital Suite (formerly Investran) and eFront Invest are the leading candidates for commercial discovery. This is a fit judgement, not a market-share ranking or an identification of the interviewee's software. The dataset explicitly anonymises system names: [root README, lines 3 to 5 and 17 to 24](../.claude/md_references/readme-datasets-root.md:3).

Allvue is the first vendor I would investigate with a willing customer: it documents fund and investor accounting, actual GL import/export functionality and a recent Luxembourg administrator deployment. SIE support proves a file interface, but does not prove that investor allocations, side letters or full history travel in that format. [Fund Accounting](https://www.allvuesystems.com/solutions/fund-accounting/), [SIE and SAF-T](https://www.allvuesystems.com/resources/expanding-nordic-region-specific-fund-accounting-features/), [White Oak deployment, June 2025](https://www.allvuesystems.com/resources/allvue-systems-announces-white-oak-management-s-a-is-live-on-fund-administration-essentials-platform/).

FIS is a strong private-capital candidate. The documented Anduin connector transfers subscription fields to Investran through DIH and explicitly describes no reverse direction. That limitation belongs to this connector; it is not evidence that Investran has no other export capability. The page describes the integration as of March 2024, so current scope needs confirmation. [FIS product](https://www.fisglobal.com/products/fis-private-capital-suite), [Anduin integration documentation](https://developers.anduintransact.com/docs/fis-investran).

eFront Invest serves asset administrators and has an Alter Domus testimonial. Public interfaces for Insight or Investment Cafe must not be treated as proof of Invest ledger access. [eFront Invest](https://www.efront.com/en/alternative-investment-software/efront-invest-as), [Alter Domus testimonial](https://www.efront.com/en/client-testimonial-videos/alter-domus).

The workbook also covers Geneva, LemonEdge, FundCount, Yardi, Juniper Square and Carta. Their roles differ. Yardi is especially relevant to real estate. LemonEdge advertises bidirectional APIs. Carta documents warehouse access, while its reviewed investor AI interface is read-only. None has been tested against a live customer environment. Sources and access limitations appear per row in Integration_fit.

## Existing competition changes the idea

eFront Provider already offers two-way administrator/manager data sharing; Apex was announced as its first client in October 2024. Shared visibility and document exchange are therefore existing product capabilities. [BlackRock announcement](https://www.efront.com/en/news-press-releases/blackrock-introduces-efront-provider).

Canoe already collects documents from portals and delivers extracted information downstream. Accelex offers extraction, validation, source-document access, API/SFTP connections and Excel exports. PDF extraction plus an audit history is insufficient differentiation. [Canoe](https://canoeintelligence.com/solutions/canoe-intelligence/), [Accelex extraction](https://www.accelextech.com/platform/document-data-extraction), [Accelex connections](https://www.accelextech.com/platform/automated-document-management).

The proposed differentiator to test is an accepted migration between different accounting systems, with reusable mapping decisions, explicit human approval, reconciliation and a record of what changed after a correction. The research does not establish that competitors cannot do this; it identifies the comparison that matters.

## Concrete first scope

Use dataset 02's supplied export and loader specification before choosing a branded connector. The incoming administrator's accountant is the proposed first user, subject to validation.

1. Retain the original files and identify source rows. Record the scope, period and currencies.
2. Apply explicit, versioned entity, account, investor and deal mappings. Leave unresolved mappings visible.
3. Capture a review decision, its owner and reason. A correction creates a new version and marks affected outputs and approvals as stale.
4. Produce the target loader and reconcile comparable movements by entity, mapped account and currency. Do not sum unlike currencies or equate a balanced journal with correct allocation.
5. Link each output to its contributing source rows and mapping decisions. Keep prepared, exported and accepted states distinct. Acceptance requires a destination receipt or read-back; the supplied reference file alone cannot establish a new live import.

An append-only history supports traceability, but does not prove that a source or interpretation is true. Lineage starts at the uploaded ledger unless earlier evidence is supplied. Dataset 01's PDFs and dataset 02's migration are separate workflows, not a verified continuous chain.

## Questions that can change the decision

- What exact accounting product, version and import template does the proposed customer use?
- Can the accountant provide a full ledger export plus master data, or only PDF reports? Who controls access?
- In the last handoff, how much work concerned obtaining files, translating fields, resolving accounting questions and checking the destination?
- Can the same approved mapping be reused next month or next quarter? Does the customer already use eFront Provider, Canoe or Accelex?
- Who signs off on destination acceptance and who would pay for this work?

## Corrections to the earlier category description

Juniper Square and Carta offer fund administration, not only LP portals or cap tables. Juniper Square also established Luxembourg operations through its May 2025 Forstone acquisition. [Juniper Square](https://www.junipersquare.com/news/juniper-square-luxembourg), [Carta fund data](https://docs.carta.com/api-platform/docs/overview).

Allvue's fund accounting is built on Dynamics 365 Business Central. The claim that fund accounting cannot be built on corporate accounting infrastructure was too strong. Investor accounting needs specialised rules, but do not assume every transaction is split by commitment percentage. The supplied side-letter example itself demonstrates an exception. [Allvue](https://www.allvuesystems.com/solutions/fund-accounting/).

## Output

[Fund administration workbook](../outputs/fund-admin-20260905/Fund_admin_research.xlsx) contains the company map, integration comparison, named administrator relationships and call evidence. Its first 19 company columns match the Saldea reference; a dedicated source column is added. Financing and unrelated desktop/tax fields were not researched. US and DE/Lux evidence are separate; German installations remain unverified. The Saldea source workbook is unchanged.
