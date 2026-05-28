# Phase 7: Polish & Cutover - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-28
**Phase:** 07-polish-cutover
**Areas discussed:** A/B integrity traps, Real-device QA matrix, Cutover + A/B gating, SEO/metadata divergence

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| A/B integrity traps | Mitigate/verify the 5 traps | ✓ |
| Real-device QA matrix | Consolidate Phase 3 + Phase 5 deferred QA + responsive sweep | ✓ |
| Cutover + A/B gating | Winner mechanism, GDPR, noindex, runbook | ✓ |
| SEO/metadata divergence | Parity vs cinematic divergence | ✓ |

**User's choice:** All four areas.

---

## A/B integrity traps

### Trap verification method
| Option | Description | Selected |
|--------|-------------|----------|
| CI gates + checklist | Extend drift-check + D-17 grep-gate pattern + manual checklist | ✓ |
| Manual checklist only | One human-verified checklist, no regression guard | |
| Full CI automation | Force all 5 into CI gates | |

**User's choice:** CI gates + checklist → CONTEXT D-01.

### Trap B — OG image
| Option | Description | Selected |
|--------|-------------|----------|
| Same frame, cinematic art | Identical 1200×630 + filesize parity, cinematic-dark visual | ✓ |
| Reuse _four's OG file | Byte-identical copy of _four's art | |

**User's choice:** Same frame, cinematic art → CONTEXT D-02.

### Trap C — index/canonical posture during A/B
| Option | Description | Selected |
|--------|-------------|----------|
| Both noindex till winner | Both siblings noindex; winner flips at cutover | ✓ |
| _three canonical now | Emit michellengo.net canonical from start | |
| You decide | Claude picks | |

**User's choice:** Both noindex till winner → CONTEXT D-03.

### Trap E — route parity verification
| Option | Description | Selected |
|--------|-------------|----------|
| CI route-manifest diff | Enumerate prerendered routes, compare to _four pinned list | ✓ |
| Manual at cutover | Eyeball route lists in checklist | |
| You decide | Claude picks | |

**User's choice:** CI route-manifest diff → CONTEXT D-04.

---

## Real-device QA matrix

### QA structure
| Option | Description | Selected |
|--------|-------------|----------|
| One consolidated matrix | Single 07-QA-MATRIX.md covering all three sources | ✓ |
| Separate UAT docs | Close each independently | |
| You decide | Claude picks | |

**User's choice:** One consolidated matrix → CONTEXT D-05.

### Minimum hardware gate
| Option | Description | Selected |
|--------|-------------|----------|
| Full BrowserStack + thermal | 7-OS matrix + iPhone thermal, all green (Phase 3 D-13/D-14) | ✓ |
| Own iPhone + desktop, BS optional | Pragmatic floor on owned hardware | |
| You decide | Claude picks | |

**User's choice:** Full BrowserStack + thermal → CONTEXT D-06.

### Phase 5 UAT items
| Option | Description | Selected |
|--------|-------------|----------|
| Fold into hardware pass | All 7 on the same real-device run | ✓ |
| Spot-check highest-risk only | Only sound-on + hero attach | |
| You decide | Claude picks | |

**User's choice:** Fold into hardware pass → CONTEXT D-07.

### Responsive sweep
| Option | Description | Selected |
|--------|-------------|----------|
| Same 21-cell single-pass | Parity with _four D-18/D-20 | ✓ |
| Lighter reel-aware sweep | Focus content pages + reel chrome | |
| You decide | Claude picks | |

**User's choice:** Same 21-cell single-pass → CONTEXT D-08.

---

## Cutover + A/B gating

### A/B winner mechanism
| Option | Description | Selected |
|--------|-------------|----------|
| Manual side-by-side review | User declares winner; no infra | |
| Traffic-split + measurement | Requires analytics (out-of-scope) | |
| You decide | Claude picks | ✓ |

**User's choice:** You decide → CONTEXT D-09 (Claude resolved to manual declaration — no measured split is viable without analytics, which is out-of-scope; cutover hard-gated on the user's explicit call).

### EU GDPR posture
| Option | Description | Selected |
|--------|-------------|----------|
| Inherit _four's no-CMP | interaction-as-consent, no banner | ✓ |
| Escalate to legal / add CMP | Legal sign-off or CMP | |
| You decide | Claude picks | |

**User's choice:** Inherit _four's no-CMP → CONTEXT D-10.

### Cutover sequence (noindex flip timing)
| Option | Description | Selected |
|--------|-------------|----------|
| Atomic flip, last commit pre-DNS | Winner only; inherits _four D-16 | ✓ |
| Flip during A/B | Open indexing earlier | |
| You decide | Claude picks | |

**User's choice:** Atomic flip, last commit pre-DNS → CONTEXT D-12.

### Rollback contract
| Option | Description | Selected |
|--------|-------------|----------|
| Verify-then-flip, DNS revert | Parity with _four D-03; TTL 300s; reversible | ✓ |
| Hard cutover, fix-forward | Flip DNS directly, fix live | |
| You decide | Claude picks | |

**User's choice:** Verify-then-flip, DNS revert → CONTEXT D-11.

---

## SEO/metadata divergence

### Metadata baseline
| Option | Description | Selected |
|--------|-------------|----------|
| Mirror _four, art differs only | _four D-11..D-17 verbatim; only OG art + favicon cinematic | ✓ |
| Selectively diverge | Diverge where cinematic framing helps | |
| You decide | Claude picks | |

**User's choice:** Mirror _four, art differs only → CONTEXT D-13.

### Sitemap URL count
| Option | Description | Selected |
|--------|-------------|----------|
| Derive from build + assert in CI | 6 pages + 8 cat + 56 watch = 70; CI-asserted | ✓ |
| Hard-code to _four's count | Match by hand | |
| You decide | Claude picks | |

**User's choice:** Derive from build + assert in CI → CONTEXT D-14.

### VideoObject JSON-LD audit depth
| Option | Description | Selected |
|--------|-------------|----------|
| Validate all 56 + Person | Full schema.org validation + gap closure | ✓ |
| Spot-check a sample | Validate a handful | |
| You decide | Claude picks | |

**User's choice:** Validate all 56 + Person → CONTEXT D-15.

### Per-page description copy
| Option | Description | Selected |
|--------|-------------|----------|
| Tune to cinematic voice | _four schema, _three wording | ✓ |
| Verbatim from _four | Exact _four strings | |
| You decide | Claude picks | |

**User's choice:** Tune to cinematic voice → CONTEXT D-16.

---

## Claude's Discretion

- A/B winner declaration ritual (D-09) — user runs the side-by-side; Claude builds only the infra it unlocks
- OG image + favicon authoring approach (D-13)
- Sitemap endpoint implementation pattern (D-14)
- Lighthouse CI tooling choice (D-17)
- Description copy wording, with optional `/` + `/about` checkpoint (D-16)
- Whether the route-manifest diff lives in deploy.yml or standalone (D-04)

## Deferred Ideas

- Traffic-split/measured A/B with analytics (rejected — analytics out-of-scope)
- CMP / cookie-consent banner (rejected — inherit no-CMP)
- 301 redirects from legacy WordPress paths (clean break)
- Per-page OG image variants (post-launch)
- AVIF / service worker / MP4 preview clips (v2)
- Real-Android device pass (DevTools emulation is the contract)
- Loser sibling's post-A/B disposition (project-level, outside _three Phase 7 scope)
