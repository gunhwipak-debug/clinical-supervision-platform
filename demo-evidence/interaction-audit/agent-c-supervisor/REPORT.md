# Agent C Supervisor Console Interaction Audit

- 실행 시각: 2026-05-21T22:35:27.521Z
- 대상: http://localhost:3000
- 계정: approved-sup@demo.local / DemoPass!23
- 범위: /supervisor, /supervisor/requests, request detail, accept/reject/feedback/completion controls, profile/qualifications/products/availability/payouts nav
- 코드/설정 변경: 없음

## 요약

- works: 25
- broken: 6
- ambiguous: 1
- static: 4

## 주요 발견

- [broken] requests nav / nav-click: Click target found but did not reach expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/03-requests-nav-after-click.png
- [broken] profile nav / nav-click: Click target found but did not reach expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/05-profile-nav-after-click.png
- [static] qualifications nav / nav-click: No matching nav control found on dashboard.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/07-qualifications-nav-after-click.png
- [broken] products nav / nav-click: Click target found but did not reach expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/09-products-nav-after-click.png
- [broken] availability nav / nav-click: Click target found but did not reach expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/11-availability-nav-after-click.png
- [static] payouts nav / nav-click: No matching nav control found on dashboard.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/13-payouts-nav-after-click.png
- [broken] supervisor-requests / detail-click: List did not expose a working detail navigation in this audit pass.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/16-request-detail-after-list-click.png
- [broken] supervisor-request-detail / workflow-accept: Accept was executed because it is the least destructive path for continuing the workflow.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/18-workflow-accept-after-click.png
- [ambiguous] supervisor-request-detail / workflow-reject: Reject control was present but not executed to avoid conflicting with accept-path workflow in the same request.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/19-workflow-reject-present-not-executed.png
- [static] supervisor-request-detail / workflow-feedback: Control not visible in current request state.
- [static] supervisor-request-detail / workflow-completion: Control not visible in current request state.

## 전체 기록

### login-before — route

- result: works
- route: /login
- url: http://localhost:3000/login
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/00-login-before.png

### login — form-submit

- result: works
- note: UI login set a session-like cookie.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/01-login-after-ui-submit.png
- click: {"found":true,"clicked":true,"selector":"button","pattern":"/로그인/i","before":"http://localhost:3000/login","after":"http://localhost:3000/login","changedUrl":false}

### supervisor-dashboard — route

- result: works
- route: /supervisor
- url: http://localhost:3000/supervisor
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/02-supervisor-dashboard.png

### supervisor-dashboard — clickable-inventory

- result: works

### requests nav — nav-click

- result: broken
- expectedRoute: /supervisor/requests
- note: Click target found but did not reach expected route.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/03-requests-nav-after-click.png
- click: {"found":true,"clicked":false,"selector":"a","pattern":"/requests/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor","error":"locator.click: Timeout 2500ms exceeded.\nCall log:\n\u001b[2m - waiting for locator('a').filter({ hasText: /requests/i }).first()\u001b[22m\n\u001b[2m - locator resolved to <a href=\"#\" class=\"flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high px-4 py-1 rounded-full active:scale-90 transition-all duration-200\">…</a>\u001b[22m\n\u001b[2m - attempting click action\u001b[22m\n\u001b[2m 2 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 20ms\u001b[22m\n\u001b[2m 2 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 100ms\u001b[22m\n\u001b[2m 5 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 500ms\u001b[22m\n"}

### requests nav-direct-route — route

- result: works
- route: /supervisor/requests
- url: http://localhost:3000/supervisor/requests
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/04-requests-nav-direct-route.png

### profile nav — nav-click

- result: broken
- expectedRoute: /supervisor/profile
- note: Click target found but did not reach expected route.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/05-profile-nav-after-click.png
- click: {"found":true,"clicked":true,"selector":"a","pattern":"/profile/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor","changedUrl":false}

### profile nav-direct-route — route

- result: works
- route: /supervisor/profile
- url: http://localhost:3000/supervisor/profile
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/06-profile-nav-direct-route.png

### qualifications nav — nav-click

- result: static
- expectedRoute: /supervisor/qualifications
- note: No matching nav control found on dashboard.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/07-qualifications-nav-after-click.png
- click: {"found":false,"clicked":false,"before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor"}

### qualifications nav-direct-route — route

- result: works
- route: /supervisor/qualifications
- url: http://localhost:3000/supervisor/qualifications
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/08-qualifications-nav-direct-route.png

### products nav — nav-click

- result: broken
- expectedRoute: /supervisor/products
- note: Click target found but did not reach expected route.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/09-products-nav-after-click.png
- click: {"found":true,"clicked":false,"selector":"a","pattern":"/product/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor","error":"locator.click: Timeout 2500ms exceeded.\nCall log:\n\u001b[2m - waiting for locator('a').filter({ hasText: /product/i }).first()\u001b[22m\n\u001b[2m - locator resolved to <a href=\"#\" class=\"flex flex-col items-center justify-center text-on-surface-variant px-4 py-1 hover:bg-surface-container active:scale-95 transition-transform duration-150 rounded-full\">…</a>\u001b[22m\n\u001b[2m - attempting click action\u001b[22m\n\u001b[2m 2 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 20ms\u001b[22m\n\u001b[2m 2 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 100ms\u001b[22m\n\u001b[2m 5 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 500ms\u001b[22m\n"}

### products nav-direct-route — route

- result: works
- route: /supervisor/products
- url: http://localhost:3000/supervisor/products
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/10-products-nav-direct-route.png

### availability nav — nav-click

- result: broken
- expectedRoute: /supervisor/availability
- note: Click target found but did not reach expected route.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/11-availability-nav-after-click.png
- click: {"found":true,"clicked":true,"selector":"button","pattern":"/일정/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor","changedUrl":false}

### availability nav-direct-route — route

- result: works
- route: /supervisor/availability
- url: http://localhost:3000/supervisor/availability
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/12-availability-nav-direct-route.png

### payouts nav — nav-click

- result: static
- expectedRoute: /supervisor/payouts
- note: No matching nav control found on dashboard.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/13-payouts-nav-after-click.png
- click: {"found":false,"clicked":false,"before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor"}

### payouts nav-direct-route — route

- result: works
- route: /supervisor/payouts
- url: http://localhost:3000/supervisor/payouts
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/14-payouts-nav-direct-route.png

### supervisor-requests — route

- result: works
- route: /supervisor/requests
- url: http://localhost:3000/supervisor/requests
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/15-supervisor-requests.png

### supervisor-requests — clickable-inventory

- result: works

### supervisor-requests — detail-click

- result: broken
- note: List did not expose a working detail navigation in this audit pass.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/16-request-detail-after-list-click.png
- click: {"found":true,"clicked":true,"selector":"button","pattern":"/검토/i","before":"http://localhost:3000/supervisor/requests","after":"http://localhost:3000/supervisor/requests","changedUrl":false}

### supervisor-requests — api-request-id-discovery

- result: works
- status: 200
- requestId: 227b935b-706a-46de-8ca4-815f7e2e0f19

### supervisor-request-detail — route

- result: works
- route: /supervisor/requests/227b935b-706a-46de-8ca4-815f7e2e0f19
- url: http://localhost:3000/supervisor/requests/227b935b-706a-46de-8ca4-815f7e2e0f19
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/17-supervisor-request-detail.png

### supervisor-request-detail — clickable-inventory

- result: works

### supervisor-request-detail — workflow-accept

- result: broken
- note: Accept was executed because it is the least destructive path for continuing the workflow.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/18-workflow-accept-after-click.png
- click: {"found":true,"clicked":false,"selector":"button","pattern":"/수락/i","before":"http://localhost:3000/supervisor/requests/227b935b-706a-46de-8ca4-815f7e2e0f19","after":"http://localhost:3000/supervisor/requests/227b935b-706a-46de-8ca4-815f7e2e0f19","error":"locator.click: Timeout 2500ms exceeded.\nCall log:\n\u001b[2m - waiting for locator('button').filter({ hasText: /수락/i }).first()\u001b[22m\n\u001b[2m - locator resolved to <button class=\"flex-[1.5] bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs\">…</button>\u001b[22m\n\u001b[2m - attempting click action\u001b[22m\n\u001b[2m 2 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 20ms\u001b[22m\n\u001b[2m 2 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 100ms\u001b[22m\n\u001b[2m 5 × waiting for element to be visible, enabled and stable\u001b[22m\n\u001b[2m - element is not visible\u001b[22m\n\u001b[2m - retrying click action\u001b[22m\n\u001b[2m - waiting 500ms\u001b[22m\n"}

### supervisor-request-detail — workflow-reject

- result: ambiguous
- note: Reject control was present but not executed to avoid conflicting with accept-path workflow in the same request.
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/19-workflow-reject-present-not-executed.png

### supervisor-request-detail — workflow-feedback

- result: static
- note: Control not visible in current request state.

### supervisor-request-detail — workflow-completion

- result: static
- note: Control not visible in current request state.

### supervisor-profile — route

- result: works
- route: /supervisor/profile
- url: http://localhost:3000/supervisor/profile
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/20-supervisor-profile.png

### /supervisor/profile — clickable-inventory

- result: works

### supervisor-qualifications — route

- result: works
- route: /supervisor/qualifications
- url: http://localhost:3000/supervisor/qualifications
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/21-supervisor-qualifications.png

### /supervisor/qualifications — clickable-inventory

- result: works

### supervisor-products — route

- result: works
- route: /supervisor/products
- url: http://localhost:3000/supervisor/products
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/22-supervisor-products.png

### /supervisor/products — clickable-inventory

- result: works

### supervisor-availability — route

- result: works
- route: /supervisor/availability
- url: http://localhost:3000/supervisor/availability
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/23-supervisor-availability.png

### /supervisor/availability — clickable-inventory

- result: works

### supervisor-payouts — route

- result: works
- route: /supervisor/payouts
- url: http://localhost:3000/supervisor/payouts
- status: 200
- screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/24-supervisor-payouts.png

### /supervisor/payouts — clickable-inventory

- result: works

## Visible Target Recheck

- [static] visible-requests-nav: No visible matching control found.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/25-visible-requests-nav.png
  - click: {"found":false,"clicked":false,"before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor"}
- [works] visible-profile-nav: Visible click reached expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/26-visible-profile-nav.png
  - click: {"found":true,"clicked":true,"selector":"a:visible","pattern":"/profile/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor/profile","changedUrl":true}
- [works] visible-products-nav: Visible click reached expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/27-visible-products-nav.png
  - click: {"found":true,"clicked":true,"selector":"a:visible","pattern":"/service/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor/products","changedUrl":true}
- [broken] visible-availability-nav: Visible click did not reach expected route.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/28-visible-availability-nav.png
  - click: {"found":true,"clicked":true,"selector":"button:visible","pattern":"/일정/i","before":"http://localhost:3000/supervisor","after":"http://localhost:3000/supervisor","changedUrl":false}
- [broken] visible-request-detail-click: Visible list control did not open detail.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/29-visible-request-detail-click.png
  - click: {"found":true,"clicked":true,"selector":"button:visible","pattern":"/검토/i","before":"http://localhost:3000/supervisor/requests","after":"http://localhost:3000/supervisor/requests","changedUrl":false}
- [static] visible-accept-click: Visible accept control could not be clicked.
  - screenshot: /Users/gunhwiair/Desktop/Agent/Projects/ClinicalSupervisionPlatform/demo-evidence/interaction-audit/agent-c-supervisor/30-visible-accept-click.png
  - click: {"found":false,"clicked":false,"before":"http://localhost:3000/supervisor/requests/227b935b-706a-46de-8ca4-815f7e2e0f19","after":"http://localhost:3000/supervisor/requests/227b935b-706a-46de-8ca4-815f7e2e0f19"}
