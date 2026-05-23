# Agent A Interaction Audit — Public Landing + Auth Navigation

Scope: `http://localhost:3000`, desktop `1280x800`, mobile `390x844`.

Constraint followed: no code/config changes. Only screenshots and this note were created under `demo-evidence/interaction-audit/agent-a-public-auth/`.

## Summary

Desktop public/auth core forms mostly work, but several auth back/support/terms links are broken or ambiguous. Mobile is worse: primary signup works, but hamburger/menu, demo CTA, auth cross-links, and reset flow have broken or static behavior. Several broken states also expose severe layout issues where text collapses vertically.

## Desktop Results

| Route                                       | Item                           | Result                     | Repro                                                  | Evidence                                                                          |
| ------------------------------------------- | ------------------------------ | -------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `/`                                         | Start Free Trial / Get Started | works                      | Open `/`, click primary CTA                            | navigates to `/signup`                                                            |
| `/`                                         | Login                          | works                      | Open `/`, click Login                                  | navigates to `/login`                                                             |
| `/`                                         | Request a Demo                 | works                      | Open `/`, click Request a Demo                         | navigates to `/supervisors`                                                       |
| `/`                                         | Features nav                   | works-scroll, visual issue | Open `/`, click Features                               | `desktop-landing-features-nav.png`                                                |
| `/`                                         | Security nav                   | works-scroll, visual issue | Open `/`, click Security                               | `desktop-landing-security-nav.png`                                                |
| `/`                                         | Pricing nav                    | ambiguous/static           | Open `/`, click Pricing                                | `desktop-landing-pricing-nav.png`                                                 |
| `/login`                                    | Forgot password                | works                      | Open `/login`, click Forgot password                   | navigates to `/forgot-password`                                                   |
| `/login`                                    | Sign up link                   | broken/missing             | Open `/login`, look for/click signup path              | `desktop-login-login-signup-link-error.png`                                       |
| `/login`                                    | Login form                     | works                      | Fill `supervisee@demo.local` / `DemoPass!23`, submit   | navigates to `/supervisors`                                                       |
| `/signup`                                   | Login link                     | works                      | Open `/signup`, click Login                            | navigates to `/login`                                                             |
| `/signup`                                   | View terms buttons             | broken                     | Open `/signup`, click View in terms area               | `desktop-signup-signup-terms-view-error.png`                                      |
| `/signup`                                   | Signup form                    | works                      | Fill fresh email, password, check consent, submit      | navigates to `/verify-email`                                                      |
| `/forgot-password`                          | Back/login link                | broken, visual issue       | Open `/forgot-password`, click back/login              | `desktop-forgot-password-forgot-back-login-error.png`                             |
| `/forgot-password`                          | Forgot form                    | works                      | Fill known email, submit                               | navigates to `/verify-email`                                                      |
| `/verify-email`                             | Back/login link                | broken                     | Open `/verify-email`, click back/login                 | `desktop-verify-email-verify-back-login-error.png`                                |
| `/reset-password`                           | Back/login link                | ambiguous/static           | Open `/reset-password`, click back/login               | `desktop-reset-password-reset-back-login.png`                                     |
| `/reset-password`                           | Contact Support                | broken/missing             | Open `/reset-password`, click/look for Contact Support | `desktop-reset-password-reset-contact-support-error.png`                          |
| `/reset-password?token=invalid-audit-token` | Reset form invalid token       | ambiguous/static           | Fill two password fields, submit                       | `desktop-strict-reset-password-token-invalid-audit-token-reset-invalid-token.png` |

## Mobile Results

| Route                                       | Item                     | Result           | Repro                                                | Evidence                                                                          |
| ------------------------------------------- | ------------------------ | ---------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/`                                         | Hamburger menu           | ambiguous/static | Open `/` at 390px, tap menu icon                     | `mobile-visible-landing-menu.png`                                                 |
| `/`                                         | Start Free Trial         | works            | Open `/`, tap Start Free Trial                       | navigates to `/signup`                                                            |
| `/`                                         | Login nav                | broken/missing   | Open `/`, look for/tap Login                         | `mobile-visible-landing-login-error.png`                                          |
| `/`                                         | Request a Demo           | ambiguous/static | Open `/`, tap Request a Demo                         | `mobile-visible-landing-request-demo.png`                                         |
| `/login`                                    | Forgot password          | works            | Open `/login`, tap Forgot password                   | navigates to `/forgot-password`                                                   |
| `/login`                                    | Sign up link             | broken/missing   | Open `/login`, look for/tap signup path              | `mobile-visible-login-login-signup-link-error.png`                                |
| `/login`                                    | Login form               | works            | Fill `supervisee@demo.local` / `DemoPass!23`, submit | navigates to `/supervisors`                                                       |
| `/signup`                                   | Login link               | broken/missing   | Open `/signup`, look for/tap login path              | `mobile-visible-signup-signup-login-link-error.png`                               |
| `/signup`                                   | View terms buttons       | ambiguous/static | Open `/signup`, tap View in terms area               | `mobile-visible-signup-signup-terms-view.png`                                     |
| `/signup`                                   | Signup form              | works            | Fill fresh email, password, check consent, submit    | navigates to `/verify-email`                                                      |
| `/forgot-password`                          | Back/login link          | works            | Open `/forgot-password`, tap back/login              | navigates to `/login`                                                             |
| `/forgot-password`                          | Forgot form              | works            | Fill known email, submit                             | navigates to `/verify-email`                                                      |
| `/verify-email`                             | Back/login link          | ambiguous/static | Open `/verify-email`, tap back/login                 | `mobile-visible-verify-email-verify-back-login.png`                               |
| `/reset-password`                           | Back/login link          | ambiguous/static | Open `/reset-password`, tap back/login               | `mobile-visible-reset-password-reset-back-login.png`                              |
| `/reset-password`                           | Contact Support          | broken/missing   | Open `/reset-password`, look for/tap Contact Support | `mobile-visible-reset-password-reset-contact-support-error.png`                   |
| `/reset-password?token=invalid-audit-token` | Reset form invalid token | ambiguous/static | Fill visible password fields, submit                 | `mobile-visible-reset-password-token-invalid-audit-token-reset-invalid-token.png` |

## Highest Priority Fix Candidates

1. Mobile hamburger menu does not open navigation.
2. Mobile Request a Demo does not trigger demo navigation.
3. Login page has no visible signup path; it shows Contact Administrator instead.
4. Auth back/login links are inconsistent across forgot, verify, reset.
5. Terms View buttons are static/broken.
6. Reset password invalid-token submit gives no visible error.
7. Desktop section scroll surfaces severe vertical-text layout breaks on landing/auth pages.
