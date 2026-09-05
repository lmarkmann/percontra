# Incident Response: vite-template

**Status:** Living document
**Last updated:** 2026-07-11

Scoped for a solo- or small-team-maintained project with no on-call rotation by default. The severity table and response times below assume one maintainer reacting to an alert or a user report, not a paged rotation. Graduate the response times and add roles (IC, comms) once a real team and real on-call exist.

---

## Severity

| Level | Criteria                                                                          | Response                      |
| ----- | --------------------------------------------------------------------------------- | ----------------------------- |
| SEV1  | Site fully down, or a security/data exposure, affecting all users                 | Drop everything, mitigate now |
| SEV2  | A core flow (auth, primary CTA, checkout) broken or badly degraded for many users | Same day                      |
| SEV3  | Minor feature broken, workaround exists, few users affected                       | Within the week               |
| SEV4  | Cosmetic, no functional impact                                                    | Next normal work cycle        |

## Detection

This template ships a thin stateless Worker and no monitoring stack by default, so detection realistically comes from one of:

- The status page (`status.<domain>`): Upptime's scheduled checks catch the site being unreachable; see [ADR 004](../adr/004-upptime-status-page.md).
- Cloudflare dashboard: Workers analytics, error rate, WAF events.
- Sentry, if wired (see the analytics section of `.claude/CLAUDE.md`): client error monitoring.
- A user report (email, GitHub issue, social).

## During an incident

1. **Confirm and classify.** Reproduce it, assign a severity, note the start time.
2. **Communicate.** Post an update to the status page (or its GitHub repo's tracking issue) using the template below. Update at a fixed cadence; don't wait for complete information.
3. **Mitigate.** Cloudflare rollback: redeploy the last known-good commit, or roll back the Worker version from the Cloudflare dashboard. Log every step taken and its effect, including the ones that didn't work.
4. **Confirm resolution.** Watch the status check or metric recover before declaring resolved; keep watching for a recurrence window before closing.

### Status update template

```markdown
## Incident Update: [Title]

**Severity:** SEV[1-4] | **Status:** Investigating | Identified | Monitoring | Resolved
**Impact:** [who/what is affected]
**Last updated:** [timestamp, UTC]

### Current status

[what we know now]

### Actions taken

- [action]

### Next steps

- [what's happening next, with an ETA]
```

## Postmortem

Required for SEV1/SEV2, encouraged for SEV3. Focus on systems, not people: the subject is the system and the process, never a person.

```markdown
## Postmortem: [Incident Title]

**Date:** [date] | **Duration:** [x hours] | **Severity:** SEV[X]

### Summary

[2-3 plain-language sentences]

### Timeline (UTC)

| Time | Event |
| ---- | ----- |

### Root cause

[what actually caused it]

### 5 Whys

1. Why did [symptom]? -> because...
2. ...

### What went well

### What went poorly

### Action items

| Action | Owner | Priority | Due |
| ------ | ----- | -------- | --- |
```

## Related

- [ADR 004](../adr/004-upptime-status-page.md): status page vendor decision (Upptime, self-hosted via GitHub Actions + Pages).
- `.claude/CLAUDE.md` "First deploy (Cloudflare)". DNS wiring for `status.<domain>`.
