# Local Demo Report

Generated at: 2026-05-22T12:14:54.929Z

## How to Run

1. `pnpm install`
2. `pnpm demo:setup`
3. `pnpm demo:dev`
4. Open `http://localhost:3000`

## Demo Accounts

All seeded accounts use password `DemoPass!23`.

| Role | Email |
| --- | --- |
| Supervisee | `supervisee@demo.local` |
| Fresh signup | `fresh@demo.local` |
| Supervisor | `approved-sup@demo.local` |
| Admin | `admin@demo.local` |

## Automated Flow

| Result | Step | HTTP | Summary | Time |
| --- | --- | ---: | --- | ---: |
| ✓ | signup fresh user | 200 | {"data":{"ok":true},"error":null} | 0ms |
| ⚠ | extract email token | 0 | {"code":"token_not_found"} | 0ms |
| ⚠ | verify email | 0 | {"code":"skipped_existing_user"} | 0ms |
| ✓ | fresh supervisee login | 200 | {"data":{"user":{"id":"71e0e7f8-d76e-4121-96fc-4915f200c795","email":"fresh@demo.local","role":"supervisee"},"session":{"expiresAt":17794... | 0ms |
| ✓ | search supervisors | 200 | {"count":6,"approvedFound":true,"hiddenFound":false} | 0ms |
| ✓ | get supervisor detail | 200 | {"productCount":3,"serviceProductId":"10000000-0000-4000-8000-000000000301"} | 0ms |
| ✓ | create supervision request | 200 | {"requestId":"12e97ea4-16ad-4616-a3b0-64f8824261a5","code":null} | 0ms |
| ✓ | save case packet | 200 | {"data":{"request":{"id":"12e97ea4-16ad-4616-a3b0-64f8824261a5","superviseeId":"71e0e7f8-d76e-4121-96fc-4915f200c795","supervisorId":"100... | 0ms |
| ✓ | upload clean case file | 200 | {"fileId":"3ca145d0-df0a-4a26-b501-72ee04605c15","code":null} | 0ms |
| ✓ | download clean case file | 200 | {"hasWatermark":true} | 0ms |
| ✓ | accept identifier-containing original case file | 200 | {"code":null,"phiScanStatus":"suspicious"} | 0ms |
| ✓ | save deidentification | 200 | {"data":{"ok":true},"error":null} | 0ms |
| ✓ | submit request | 200 | {"data":{"request":{"id":"12e97ea4-16ad-4616-a3b0-64f8824261a5","superviseeId":"71e0e7f8-d76e-4121-96fc-4915f200c795","supervisorId":"100... | 0ms |
| ✓ | create payment intent | 200 | {"paymentId":"65d1fefc-ab25-4592-973f-e1444759de88","paymentAmount":120000} | 0ms |
| ✓ | confirm payment | 200 | {"data":{"payment":{"id":"65d1fefc-ab25-4592-973f-e1444759de88","supervisionRequestId":"12e97ea4-16ad-4616-a3b0-64f8824261a5","supervisee... | 0ms |
| ✓ | supervisor login | 200 | {"data":{"user":{"id":"10000000-0000-4000-8000-000000000003","email":"approved-sup@demo.local","role":"supervisor"},"session":{"expiresAt... | 0ms |
| ✓ | supervisor accept | 200 | {"data":{"request":{"id":"12e97ea4-16ad-4616-a3b0-64f8824261a5","superviseeId":"71e0e7f8-d76e-4121-96fc-4915f200c795","supervisorId":"100... | 0ms |
| ✓ | supervisor feedback | 200 | {"data":{"request":{"id":"12e97ea4-16ad-4616-a3b0-64f8824261a5","superviseeId":"71e0e7f8-d76e-4121-96fc-4915f200c795","supervisorId":"100... | 0ms |
| ✓ | supervisee feedback approval | 200 | {"data":{"user":{"id":"71e0e7f8-d76e-4121-96fc-4915f200c795","email":"fresh@demo.local","role":"supervisee"},"session":{"expiresAt":17794... | 0ms |
| ✓ | approve supervisor feedback | 200 | {"data":{"reviewCycle":{"id":"f47cf6f5-5ea7-4405-b301-f00f9691b8e4","supervisionRequestId":"12e97ea4-16ad-4616-a3b0-64f8824261a5","actorU... | 0ms |
| ✓ | supervisor relogin for completion | 200 | {"data":{"user":{"id":"10000000-0000-4000-8000-000000000003","email":"approved-sup@demo.local","role":"supervisor"},"session":{"expiresAt... | 0ms |
| ✓ | issue completion record | 200 | {"data":{"request":{"id":"12e97ea4-16ad-4616-a3b0-64f8824261a5","superviseeId":"71e0e7f8-d76e-4121-96fc-4915f200c795","supervisorId":"100... | 0ms |
| ✓ | supervisee relogin | 200 | {"data":{"user":{"id":"71e0e7f8-d76e-4121-96fc-4915f200c795","email":"fresh@demo.local","role":"supervisee"},"session":{"expiresAt":17794... | 0ms |
| ✓ | write review and complete | 200 | {"data":{"request":{"id":"12e97ea4-16ad-4616-a3b0-64f8824261a5","superviseeId":"71e0e7f8-d76e-4121-96fc-4915f200c795","supervisorId":"100... | 0ms |
| ✓ | admin login | 200 | {"data":{"user":{"id":"10000000-0000-4000-8000-000000000005","email":"admin@demo.local","role":"admin"},"session":{"expiresAt":1779453894... | 0ms |
| ✓ | admin approve qualification | 200 | {"data":{"ok":true},"error":null} | 0ms |

## Notes

- Figma token setup: create a Figma file, set `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY`, then run `pnpm figma:sync`.
- Ops smoke: run `pnpm ops:smoke` to create `demo-evidence/OPS-REPORT.md`; missing production credentials are reported as warn/skipped.
- TOTP demo users are pre-seeded with `totp_enabled=true`; real secret rotation is a production handoff item.
- Raw evidence is in `demo-evidence/setup.log`, `demo-evidence/seed.log`, `demo-evidence/dev.log`, and `demo-evidence/run.json`.
