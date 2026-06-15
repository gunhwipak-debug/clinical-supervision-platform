# ClinicFlow Vercel Release

ClinicFlow는 Vercel에 두 개의 프로젝트로 분리되어 있다.

| App   | Vercel project     | Stable URL                                | Build command                    |
| ----- | ------------------ | ----------------------------------------- | -------------------------------- |
| Web   | `clinicflow-web`   | `https://clinicflow-web-beta.vercel.app`  | `pnpm --filter @csp/web build`   |
| Admin | `clinicflow-admin` | `https://clinicflow-admin-six.vercel.app` | `pnpm --filter @csp/admin build` |

## URL rule

Vercel 배포 출력에는 매번 새로 생성되는 불변 배포 URL이 먼저 나온다.
예: `https://clinicflow-xxxx-gunhwipak-debugs-projects.vercel.app`

사용자가 확인해야 하는 URL은 stable URL이다.
프로덕션 배포가 성공하면 stable URL이 새 배포를 가리킨다.

## Commands

```sh
pnpm release:web:ui-prod
pnpm release:admin:prod
```

확인만 할 때:

```sh
pnpm release:web:ui-check
pnpm release:admin:check
```

## Why the release wrapper exists

- raw `vercel deploy`를 직접 실행하지 않는다. root `.vercel/project.json`은 기본적으로 `clinicflow-web`을 가리키므로, release wrapper가 배포 중에만 선택한 프로젝트 링크를 임시로 쓰고 종료 시 원복한다.
- 배포 중 Vercel 출력을 실시간으로 보여준다.
- Vercel CLI가 조용한 구간에도 30초마다 진행 heartbeat를 출력한다.
- `git status`나 `git diff`처럼 로컬 파일 수가 많을 때 멈춰 보이는 검사를 기본 경로에서 제외한다.
- 결과 요약에는 불변 배포 URL과 stable URL을 같이 남긴다.

기본 배포 제한 시간은 15분이다. 오래 걸리는 배포가 확실할 때만 늘린다.

```sh
VERCEL_DEPLOY_TIMEOUT_MS=1800000 pnpm release:web:ui-prod
```

## Optional slower checks

빠른 배포 경로에서는 Git 검사와 Origin-14 디자인 guard를 기본으로 건너뛴다.
필요할 때만 아래처럼 명시적으로 켠다.

```sh
FAST_RELEASE_USE_GIT=1 pnpm release:web:ui-check
FAST_RELEASE_RUN_ORIGIN14_GUARD=1 pnpm release:web:ui-check
FAST_RELEASE_CHANGED_FILES="scripts/clinicflow-fast-release.mjs,package.json" pnpm release:web:ui-check
```

## Known admin failure from 2026-06-15

최근 `clinicflow-admin` preview 실패 메일의 원인은 admin 빌드 타입 오류였다.

```text
apps/admin/src/components/admin-home-page.tsx:127
Type error: Type 'HomeQueueItem | undefined' is not assignable to type 'HomeQueueItem'.
```

현재 코드에서는 `prioritizedAction(items: [HomeQueueItem, ...HomeQueueItem[]])`로 보정되어 있다.
새 admin 배포 전에는 `pnpm release:admin:check`를 먼저 실행한다.

반복 실패 메일을 막기 위해 admin 배포는 raw CLI 대신 `pnpm release:admin:prod`만 사용한다.
배포 객체가 생성되기 전 `Retrieving project...`에서 멈춘 경우에는 새 Vercel 실패 메일이 만들어진 상태가 아니다.
그때는 재시도 전에 Vercel 대시보드에서 최신 admin deployment가 READY인지 먼저 확인한다.
