---
target: shiori-full-project
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Bangsawan\\Documents\\Codingan\\shiori\\shiori-full-project"
timestamp: 2026-10-06T06-11-39Z
slug: shiori-full-project
---
Method: dual-agent (A: 0707afc5 · B: inline-detector)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Step indicator & confetti success work well, but missing inline form validation |
| 2 | Match System / Real World | 4 | Excellent Indonesian domain language throughout |
| 3 | User Control and Freedom | 3 | Back buttons on every step, but no undo after adding to cart |
| 4 | Consistency and Standards | 4 | Cohesive visual language across all 3 surfaces |
| 5 | Error Prevention | 3 | Prevents negative quantities, empty submissions; no guardrails for long text |
| 6 | Recognition Rather Than Recall | 3 | Wizard reduces memory load; but no search for books |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts; qty input is button-only; no bulk actions for admin |
| 8 | Aesthetic and Minimalist Design | 4 | Beautiful Japanese-Indonesian fusion |
| 9 | Error Recovery | 2 | Basic error states; no data preservation on crash |
| 10 | Help and Documentation | 1 | Zero contextual help in dashboard or order flow |
| **Total** | | **29/40** | **Good** |

## Design Specificity Verdict

Exceptionally specific. The Shiori identity is unmistakably authored for this product. 0 detector findings across all 6 UI files.

## Priority Issues

- [P1] Cannot type quantities directly in User Order — must tap +/- buttons
- [P1] No search/filter for books in User Order — 90+ books per jenjang
- [P2] Admin cannot bulk-confirm orders — must open each nota individually
- [P2] No contextual help anywhere in the app
- [P3] Pengaturan tab is non-functional dummy

## Persona Red Flags

- Casey: 35 taps per book is unusable on mobile
- Alex: No bulk actions for admin at scale
- Jordan: No help, no tooltips, overwhelmed by book list
- Riley: Long text breaks nota layout, refresh resets step position
