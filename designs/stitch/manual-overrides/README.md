# Stitch Manual Overrides

This folder preserves the user-selected Stitch HTML samples that must be treated
as the visual source of truth for the next functional wiring pass.

Do not edit these files while implementing route JSX. If a route needs code
changes, copy structure and classes from these HTML files into the relevant
React component and document any unavoidable backend-driven deviation in:

`docs/decisions/STITCH-FUNCTIONAL-MAPPING.md`

## Files

| File | Target route |
| --- | --- |
| `supervisor-catalog.html` | `/supervisors` |
| `supervisor-profile.html` | `/supervisors/[id]` |
| `new-request.html` | `/requests/new` |
| `availability-calendar.html` | `/supervisor/availability`, public supervisor booking slots |
| `work-surface.html` | `/supervisor/requests/[id]` |

