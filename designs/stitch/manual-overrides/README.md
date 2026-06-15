# Stitch Manual Overrides

This folder preserves historical user-selected Stitch HTML samples. They were
used for an older functional wiring pass and must not be treated as the current
visual source of truth.

Do not use these files for current ClinicFlow UI work. If a future historical
comparison requires them, document any finding in:

`docs/decisions/STITCH-FUNCTIONAL-MAPPING.md`

## Files

| File | Target route |
| --- | --- |
| `supervisor-catalog.html` | `/supervisors` |
| `supervisor-profile.html` | `/supervisors/[id]` |
| `new-request.html` | `/requests/new` |
| `availability-calendar.html` | `/supervisor/availability`, public supervisor booking slots |
| `work-surface.html` | `/supervisor/requests/[id]` |
