# ADR 007: The wordmark serif

**Status:** Proposed, decision due 2026-09-06
**Date:** 2026-09-06
**Decider:** Luis Markmann

## Context

The identity is typographic. The mark is a block of a total over a double rule, the notation that closes an agreed total in printed accounts, and the wordmark is "Per Contra" in a bold serif closed by the same rule. The mark resolves into the wordmark and back in one transform-only animation, so the two are one object and the serif carries the whole brand. Charter, the template's prose face, served the concept work and is not a choice anyone made for this company.

The wordmark ships as SVG outlines, so it needs no figure set, no coverage, and a desktop licence only. Foundry test licences cover the hackathon build as long as no font file lands in the public repo.

The users are fund managers, fund administrators and fund accountants. The register is institutional, exact and unhurried, without the pedigree of a specific newspaper doing the talking. Fund-admin software ships geometric or grotesque sans faces almost without exception, so a serif is the differentiator in this category.

Selection ran through nineteen faces in three rounds. The criteria that emerged from what was rejected, in the order they were discovered:

- No press pedigree a judge can name: Financier (FT) out.
- Thick-to-thin ratio tight enough that Bold reads as one weight on a rule: GT Super, Lyon Display, Signifier out.
- No overlong descenders: Perpetua lineage out.
- No bulb terminals and no aggressive wedges: Ivar, Roslindale, Tabac out.
- A P whose bowl closes on the stem, since the wordmark starts with one: Martina Plantijn out.
- Old-style bones, raised x-height, contemporary drawing: Fern too bookish, Louize too low an x-height, Arnhem sound but unremarkable.

## Decision

Three finalists, one to be picked on the proof page with the trial files, not on specimen pages:

| Face | Foundry | Why it survived | Risk |
| --- | --- | --- | --- |
| Reckless | Displaay | Old-style skeleton, raised x-height, a contrast axis so the S cut gives a Bold that stays solid on the rule | Fashionable in branding since about 2022; a design-literate judge may place it |
| Nocturno | Typotheque | Darkest colour of the set, concave near-flare serifs, the face that most looks like a printed total | Text cut may clog at 22px header size on a 1x screen; proof there first |
| Newzald | Klim | News-bred, medium contrast, robust, a Bold drawn for headlines, P closes on the stem | Least distinctive of the three |

Bradford and GT Alpina were the next two and stay recorded as fallbacks.

The UI sans is a separate, gated decision (tabular figures, slashed zero, 12 to 14px tables) and is not settled here. National 2 (Klim) is the working assumption.

## Consequences

- The proof page sets all three as "Per Contra" Bold on the double rule at 64px and 22px, both themes, from trial files kept outside the repo.
- The winner is converted to outlines for the favicon, the share card and the header lockup; the animation does not change, only the measured wordmark width.
- `docs/frontend/type-spec.md` gets a Face section for the winner, with the licence path recorded, before any font file ships.
- Whoever picks a different face later argues against the six criteria above, not against taste.

## Evidence

Foundry pages checked 2026-09-06: displaay.net/typeface/reckless (full free trials), typotheque.com/fonts/nocturno/try (30-day trial through an account, or Fontstand rental), klim.co.nz/test-fonts (whole library as test fonts, internal and presentation use only). The naming rationale is in the hackathon repo, `docs/naming-shortlist.md`. Template ADRs 001 to 041 are archived under `docs/archive/frontend-docs/adr/`; numbering continues from there.
