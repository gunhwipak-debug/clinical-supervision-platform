# Visual Evidence Catalog

Playwright captured full-page screenshots for desktop `1280x800` and mobile `390x844`.

| Area       | Route                        | Desktop                                                           | Mobile                                                           |
| ---------- | ---------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Public     | `/`                          | `demo-evidence/screenshots/desktop-home.png`                      | `demo-evidence/screenshots/mobile-home.png`                      |
| Auth       | `/login`                     | `demo-evidence/screenshots/desktop-login.png`                     | `demo-evidence/screenshots/mobile-login.png`                     |
| Auth       | `/signup`                    | `demo-evidence/screenshots/desktop-signup.png`                    | `demo-evidence/screenshots/mobile-signup.png`                    |
| Auth       | `/verify-email`              | `demo-evidence/screenshots/desktop-verify-email.png`              | `demo-evidence/screenshots/mobile-verify-email.png`              |
| Auth       | `/forgot-password`           | `demo-evidence/screenshots/desktop-forgot-password.png`           | `demo-evidence/screenshots/mobile-forgot-password.png`           |
| Auth       | `/reset-password`            | `demo-evidence/screenshots/desktop-reset-password.png`            | `demo-evidence/screenshots/mobile-reset-password.png`            |
| Catalog    | `/supervisors`               | `demo-evidence/screenshots/desktop-supervisors.png`               | `demo-evidence/screenshots/mobile-supervisors.png`               |
| Catalog    | `/supervisors/:id`           | `demo-evidence/screenshots/desktop-supervisor-detail.png`         | `demo-evidence/screenshots/mobile-supervisor-detail.png`         |
| Supervisee | `/requests`                  | `demo-evidence/screenshots/desktop-requests.png`                  | `demo-evidence/screenshots/mobile-requests.png`                  |
| Supervisee | `/requests/new`              | `demo-evidence/screenshots/desktop-request-new.png`               | `demo-evidence/screenshots/mobile-request-new.png`               |
| Supervisee | `/requests/:id`              | `demo-evidence/screenshots/desktop-request-detail.png`            | `demo-evidence/screenshots/mobile-request-detail.png`            |
| Supervisee | `/payments`                  | `demo-evidence/screenshots/desktop-payments.png`                  | `demo-evidence/screenshots/mobile-payments.png`                  |
| Supervisee | `/payments/:id`              | `demo-evidence/screenshots/desktop-payment-detail.png`            | `demo-evidence/screenshots/mobile-payment-detail.png`            |
| Supervisee | `/settings`                  | `demo-evidence/screenshots/desktop-settings.png`                  | `demo-evidence/screenshots/mobile-settings.png`                  |
| Supervisor | `/supervisor`                | `demo-evidence/screenshots/desktop-supervisor-dashboard.png`      | `demo-evidence/screenshots/mobile-supervisor-dashboard.png`      |
| Supervisor | `/supervisor/requests`       | `demo-evidence/screenshots/desktop-supervisor-requests.png`       | `demo-evidence/screenshots/mobile-supervisor-requests.png`       |
| Supervisor | `/supervisor/requests/:id`   | `demo-evidence/screenshots/desktop-supervisor-request-detail.png` | `demo-evidence/screenshots/mobile-supervisor-request-detail.png` |
| Supervisor | `/supervisor/profile`        | `demo-evidence/screenshots/desktop-supervisor-profile.png`        | `demo-evidence/screenshots/mobile-supervisor-profile.png`        |
| Supervisor | `/supervisor/qualifications` | `demo-evidence/screenshots/desktop-supervisor-qualifications.png` | `demo-evidence/screenshots/mobile-supervisor-qualifications.png` |
| Supervisor | `/supervisor/products`       | `demo-evidence/screenshots/desktop-supervisor-products.png`       | `demo-evidence/screenshots/mobile-supervisor-products.png`       |
| Supervisor | `/supervisor/availability`   | `demo-evidence/screenshots/desktop-supervisor-availability.png`   | `demo-evidence/screenshots/mobile-supervisor-availability.png`   |
| Admin      | `/admin`                     | `demo-evidence/screenshots/desktop-admin-dashboard.png`           | `demo-evidence/screenshots/mobile-admin-dashboard.png`           |
| Admin      | `/admin/qualifications`      | `demo-evidence/screenshots/desktop-admin-qualifications.png`      | `demo-evidence/screenshots/mobile-admin-qualifications.png`      |
| Admin      | `/admin/refunds`             | `demo-evidence/screenshots/desktop-admin-refunds.png`             | `demo-evidence/screenshots/mobile-admin-refunds.png`             |
| Admin      | `/admin/payouts`             | `demo-evidence/screenshots/desktop-admin-payouts.png`             | `demo-evidence/screenshots/mobile-admin-payouts.png`             |

## Accessibility and Responsive Check

- Keyboard: header links, forms, buttons, and queue actions are native interactive elements and tab reachable.
- Toasts: `sonner` is mounted in the web root; success and failure feedback uses polite live announcements.
- Contrast: token choices keep primary text on surface at 4.5:1 or better; danger/warn backgrounds are used as soft accents with ink text.
- Responsive: screenshots cover 390px mobile and 1280px desktop. Additional manual pass targets are 360px, 414px, 768px, and 1280px.
- Loading, empty, and error states are represented by shared state components for list/detail surfaces; route-level API failures still return envelope errors with noindex.
- EPIC 5 file surfaces live on `/requests/:id` and `/supervisor/requests/:id`; the same screenshots now include the 첨부 파일 panel, scan badges, and download/delete affordances.
