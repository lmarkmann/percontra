# ADR 001: Demo task runner (just vs make vs plain script)

**Status:** Undecided (deferred)
**Date:** 2026-09-05
**Decider:** Luis Markmann

## Context

The submission bar from the event brief is: README plus one command the judges can execute. The repo is public and criterion 4 (code review, 25% of the score) is read straight off it, so the shipped command is the first thing a judge sees.

That command has to run on a clean judge machine with zero setup. Nobody installs a toolchain on the floor, and nobody reads past the README. Whatever ships runs.

One question settled during the review of the brief: make is not specified anywhere in it. "One command we can execute" is the whole requirement, so a `justfile` is a compliant submission, not a workaround for missing make.

## Options

| Option | Preinstalled on a clean machine | Notes |
|---|---|---|
| `make` | macOS yes, most Linux dev boxes yes, not guaranteed | Judges are likely to have it. This is the safety case. |
| `just` | No | Default task runner in my own stack, better syntax for multi-step recipes, but a judge has never seen it. |
| Plain `scripts/demo.sh` | Always (POSIX shell) | Zero install risk, no recipe layer to maintain. |

## Decision

Deferred until the problem is picked. What is settled now are the constraints, not the runner.

1. It has to be executable. Whoever reads the repo runs one command from the README and gets the demo, no extra install step, no second guess.
2. If `just` is chosen, the real shell code lives in `scripts/demo.sh` and `just demo` only calls it. The README lists the shell command first and the `just` command second.
3. If `just` is chosen, the entry point detects whether `just` is actually installed on that machine. If it is missing, it prints the online install (the one-liner at just.systems, or `brew install just`) instead of failing on an unknown command.
4. `make` was never required. It remains a valid fallback if the clean-machine risk for `just` starts to look real.

## Why deferred

The problem itself is deliberately unchosen, and the idea on the table is one hypothesis to test against the three personas, not a decision (criterion 1, "can you show us where it came from," is 25% of the score). The shape of the demo, what the one command actually does, changes what the recipe layer buys: a local server, a CLI walkthrough, or an interactive page each point the runner choice differently. The runner should not settle before the command it wraps is known.

## Consequences

- The README carries two commands (shell first, runner second) once the decision lands. Two lines, no further cost.
- Whichever runner wins, `scripts/demo.sh` is the single executable ground truth. Both the recipe and the README point at it, so a late switch of runner touches one file and never the judges' expectations.
- The public repo degrades gracefully: a missing runner is detected and messaged with the install path, not assumed present.
