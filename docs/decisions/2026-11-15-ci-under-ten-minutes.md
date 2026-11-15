# Decision: CI that finishes in under ten minutes, merge queue removed

Applies to [ourostack/ouro-ui](https://github.com/ourostack/ouro-ui). The running record is ouro-ui issue #943.

## Why

Ari: "i want things moving as fast as possible!!!!! we own everything, we can change everything." A pull request spent about fifteen minutes in the merge queue, and a flaky test could evict an entry and rebuild the groups behind it.

## Decision

1. **Measure queue time apart from work time.** Per-job queueing was a couple of seconds, so queueing was not the cause. Doubling shards (one change tried and closed) moved no wall clock and was reverted on that evidence.
2. **Cut the critical path, one link at a time.** Shard by measured time, make each shard faster (fewer Vitest workers fighting, a warm-up of the cold story transform, split suites that compete for one shard), cache the install preparation by lockfile, and apply an install delta (added, removed and moved items) that a test proves equal to a full add.
3. **Remove the merge queue.** Main's push run now runs the full suite once per commit; a pull request still runs what it can affect.
4. **Guard the work, ratchet it down.** The budget guard's ceiling went from fifteen to ten minutes. It judges work time, never raises to pass.
5. **A red run gets a cause first.** Each is recorded on the running issue; flakes are fixed at the cause or handed to their owner.

Result: main push runs finished between 513 and 535 s on three consecutive green runs (43759340072, 43759474933, 43759786872), against about 15 minutes before.

## Prior art

Read on 2026-11-15.

| Find | Verdict | Why |
| --- | --- | --- |
| Playwright test sharding | **Adopt** | Shard by measured time, not count. |
| GitHub Actions dependency caching | **Adopt** | Key by lockfile; save before tests can fail. |
| Test impact analysis (Fowler) | **Borrow** | Reduced pull request runs, full run on main as the safety net. |
| Flaky tests at Google | **Borrow** | Every red run gets a cause before a re-run. |
| GitHub merge queue | **Ignore** | Tested the same commit twice and evicted entries on one flake. |
| Larger paid runners | **Ignore** | Standard runners were enough once the critical path was cut. |
