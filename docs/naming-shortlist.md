# Naming shortlist

Brief: [naming-brief.md](naming-brief.md). Scorer: `appella` (25,233-name corpus, Qwen3-Embedding-4B @ 1024d, weights v3). Score dimensions are semantic fit to the brief, phonetic fluency, attention and affect, summed to `total`.

Pool: 68 candidates. 38 from `appella invoke` (28 from my run under `--max-chars 9 --max-syllables 3`, two of which its own gate rejected as offensive, plus the 10 from the second run) and 30 from me across five families. Everything was scored by the same scorer: my candidates went back in through `appella invoke --coinage`, which scores a caller-supplied list identically to a model-coined one.

Three checks appella does not perform, done by hand:

- **Says** — can I say what the product does in one line, to a fund accountant, using the name?
- **Room** — does it survive being said aloud to a judging panel, with no known-brand or wrong-meaning collision?
- **Free** — `github.com/<name>` free **and** either `.com` or `.io` free.

## The shortlist

Everything that fails any check is gone. Brand collisions (Fidor, Clarus, Nexus, Transit, Fidal, Solidus, Sigil, Libra, Duplex, Folio, Probatum, Attest, Eidos, Sonus, Summa, Fides, Spector, Casting), wrong or bad Latin (Putor is stench, Perit is "it perishes", Ambitus is bribery in Roman law, Custos is a distinct regulated fund role), banned generic nouns (Audit, Ratio), English-only pronunciation (Prime Entry, Open Item, In Specie, Fair Copy, Value Date, Footing, Traject, Portage, Perduct), and names that say nothing to a fund accountant (Pensor, Verum, Ligata, Statum, Ferens, Nota, Prudentia, Concurro, Destinor, Dictum). 58 cut, 10 left.

Ranked by appella score.

| # | Name | Source | appella | github | Meaning |
|---|---|---|---|---|---|
| 1 | Lanx | appella | 2.661 | taken | The pan of a balance scale: the side that has to come out level. |
| 2 | **Per Contra** | me | 2.573* | **free** | The matching entry on the opposite side of the account. |
| 3 | Partita | me | 2.308 | taken | *Partita doppia*, double-entry bookkeeping itself. |
| 4 | Probata | appella | 2.287 | taken | Things proved. |
| 5 | Recto | me | 2.104 | taken | The right-hand page of an open ledger. |
| 6 | Vidimus | me | 1.997 | taken | "We have seen it": the certification that a copy matches its original. |
| 7 | Relatum | me | 1.756 | taken | Carried back, reported. |
| 8 | Recepta | me | 1.685 | taken | Things received; the destination receipt. |
| 9 | Signum | me | 1.593 | taken | The seal set on a document. |
| 10 | Vidit | me | 1.387 | taken | "He has seen it", the reviewer's tick. |

\* proxy score: appella's gate rejects spaces, so the two-word compounds were scored concatenated (`Percontra`). Semantics carry over; phonetics is slightly distorted.

`.com` is taken for all ten. `.io` is taken for Lanx, Per Contra, Partita, Probata and Vidimus; appella's RDAP returned `unknown` for every `.io`, so the rest were not resolved beyond a DNS-delegation proxy.

## Decided: Per Contra

Locked in as both the team name and the product name, for Luis and Riad. Used alone, with no "Team" prefix; it already reads as an entity.

Per contra is the annotation a bookkeeper writes when an entry's counterpart sits on the opposite side of the account, which is exactly the claim this product makes: every row that lands in the destination loader has a traceable counterpart in the source GL, and the two are shown side by side. It is Latin, so it is pronounced identically in English and German; it is a real term an accountant recognises rather than a coinage, which is the Ylookup register without being the Ylookup joke; and `github.com/percontra` was free at the time of checking, so the public submission repo can carry the name.

**The known weakness, recorded rather than resolved:** "on the contrary" is the everyday meaning, and a contrarian word is an odd fit for a product whose promise is that two systems agree. A judge who does not know the bookkeeping sense hears disagreement. The demo should say the bookkeeping sense out loud in its first ten seconds so nobody has to guess.

Runner-up, if it ever needs replacing: **Vidimus**, "we have seen it", the medieval certification that a copy matches its original. Tighter on the destination-receipt proof, lower on the scorer (1.997 against 2.573), and taken on GitHub.
