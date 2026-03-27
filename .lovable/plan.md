

# Approved: Save Strict Execution Rules to Memory

Executing immediately — two file writes:

## 1. Create `mem://constraints/strict-execution-rules.md`
The full STRICT EXECUTION RULES block covering all 7 phases plus future phases.

## 2. Update `mem://index.md`
- **Core section** — add: `STRICT: targeted changes only, no unrelated refactors, no removing working features, no fake integrations, label scaffolded features, preserve stability, output what changed and why.`
- **Memories section** — add: `[Strict Execution Rules](mem://constraints/strict-execution-rules) — Mandatory rules for all 7+ phases`

No code changes. No regressions. Memory-only update.

