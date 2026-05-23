# 임시 보고서: 코드 리뷰 및 성능 최적화 방안 수립

작성일: 2026-05-23  
작성자: Antigravity (Lead Scientist & Technical Owner)  
프로젝트: ClinicFlow (Clinical Supervision Platform)  
목적: Codex와 장기적인 협업 과정에서 웹 프로그램이 점차 무겁고 느려지는 원인을 규명하고, 실현 가능한 최적화 설계를 수립합니다.

---

## 1. 배경 및 현황
ClinicFlow는 Next.js 15 Monorepo 구조 위에서 Better Auth, Drizzle ORM, PostgreSQL(RLS 정책 활성화) 등을 사용해 강력한 보안과 유연한 비즈니스 로직을 구축하고 있습니다. 

그러나 다양한 기능(예약, 결제, 파일 업로드, 주석 등)이 결합하고 코드베이스가 확장될수록 다음과 같은 증상이 심화되는 현상이 관찰되었습니다.
1. **로컬 개발 서버(`pnpm dev:web`) 구동 및 핫 리로딩 시 급격한 지연**: 코드를 조금만 수정해도 다음 화면 로딩에 수 초에서 수십 초가 소요됨.
2. **요청 처리 지연(High Latency)**: 개별 API 라우트 및 서버 렌더링 페이지 호출 시 점진적으로 응답 속도가 느려짐.
3. **데이터베이스 커넥션 고갈 경고**: 로컬 또는 클라우드 DB 연결 수가 비정상적으로 누적되는 현상 발생.

이에 대해 소스코드 수준의 정밀한 병목 탐색(Static Code Review)을 진행했으며, 그 결과 매우 치명적이고 전형적인 리소스 누수 및 성능 지하 요인을 규명했습니다.

---

## 2. 성능 저하의 핵심 원인 분석 (Core Bottlenecks)

### 2.1 [치명적] 매 요청마다 발생하는 데이터베이스 커넥션 풀 누수 (Connection Leak)

현재 프로젝트 전반에서 데이터베이스 클라이언트를 생성하고 소비하는 흐름을 보면, 매우 심각한 커넥션 인스턴스 남발이 일어나고 있습니다.

#### [문제 코드] `packages/db/src/client.ts`
```typescript
export function createDatabase(connectionString = process.env["DATABASE_URL"]) {
  if (process.env["DEV_DB"] === "pglite") {
    if (!pgliteDatabase) {
      // PGlite는 로컬 메모리/싱글톤 캐싱 처리됨
    }
    return pgliteDatabase;
  }

  const resolvedConnectionString = resolveConnectionString(connectionString);

  // 호출될 때마다 새로운 postgres 커넥션 풀(기본 max: 10)을 매번 새로 생성
  const client = postgres(resolvedConnectionString, {
    max: 10,
    prepare: false
  });

  return drizzlePostgres(client, { schema });
}
```

#### [문제 코드] `apps/web/src/lib/auth/database.ts`
```typescript
export function createAuthDatabase() {
  return createDatabase(process.env["SERVICE_DATABASE_URL"]);
}

export function createRuntimeDatabase() {
  return createDatabase(process.env["DATABASE_URL"]);
}
```

* **원인**: Next.js 15의 거의 모든 API Route와 Server Component 엔트리 포인트에서 데이터 조회가 필요할 때마다 `createRuntimeDatabase()` 혹은 `createAuthDatabase()`를 다이렉트로 호출하여 `db` 상수를 할당하고 있습니다.
* **영향**:
  * 단 한 번의 페이지 요청이 들어올 때, 해당 페이지가 여러 서버 컴포넌트로 분할되어 있거나 복수의 내부 API를 비동기 호출하는 경우, **매 요청마다 수십 개의 새로운 PostgreSQL 커넥션 풀(각각 max: 10)이 중복 생성**됩니다.
  * Node.js의 가비지 컬렉터(GC)가 실행되어 연결이 완전히 닫히기 전까지는 이 풀들이 DB 커넥션 한도를 계속 점유합니다.
  * 결과적으로 데이터베이스의 커넥션 제한(Connection Limit)에 부딪혀 새로운 요청들이 대기(Pending) 상태에 빠지고 지연 시간이 극대화됩니다.

### 2.2 Next.js 개발 모드(Hot Reloading)에서의 모듈 캐시 무효화 및 커넥션 누적

Next.js 개발 서버(`next dev`)는 코드가 바뀔 때마다 변경된 모듈을 무효화하고 메모리에 새로 로드합니다.
* **원인**: `createDatabase` 함수 내부에 실제 PostgreSQL 커넥션을 전역 컨텍스트(`globalThis`) 등에 저장하여 싱글톤을 유지하는 안전장치가 부재합니다.
* **영향**:
  * Codex나 사용자가 코드를 수정하여 저장할 때마다 기존 데이터베이스 커넥션은 끊어지지 않은 채 고아(Orphan) 커넥션으로 백그라운드에 방치됩니다.
  * 이와 동시에 새로 리로드된 모듈에서 또다시 커넥션 풀이 중복으로 결성됩니다.
  * 개발을 진행하면 진행할수록 로컬 개발 환경이 급속도로 느려지고 무거워지는 결정적인 원인입니다.

### 2.3 RLS(Row-Level Security) 세션 변수 설정의 오버헤드

* **원인**: `packages/db/src/context.ts`의 `withUserContext` 헬퍼는 강력한 보안을 위해 매 쿼리마다 PostgreSQL 트랜잭션을 수립한 뒤 `set_config('app.current_user_id', ...)` 등의 GUC(Grand Unified Configuration) 변수 설정 쿼리를 3~4번 순차 실행합니다.
* **영향**: RLS 보안은 절대 타협할 수 없는 필수 요소이지만, 커넥션 풀 생성 오버헤드 및 네트워크 레이턴시가 맞물리면서 개별 트랜잭션 수립에 가해지는 DB 라운드트립(Round-trip) 지연 오버헤드가 극대화되어 체감 속도가 한층 더 저하됩니다.

---

## 3. 리팩토링 및 최적화 아키텍처 방안 (Optimization Architecture)

이 문제를 근본적으로 해결하기 위해, 다음과 같은 세 가지 핵심 개선 방안을 수립합니다.

### 3.1 방안 A: Global Singleton 패턴 도입을 통한 커넥션 단일화 및 재사용

Node.js 환경과 Next.js 개발 핫 리로딩 프로세스에서 안전하게 DB 연결 인스턴스를 하나만 생성하고 재사용하도록 `packages/db/src/client.ts`를 전역 싱글톤으로 개편합니다.

#### [개선 설계안 (Conceptual)]
```typescript
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Next.js hot-reloading 환경에서 보존될 전역 객체 참조 선언
const globalForDb = globalThis as unknown as {
  postgresClient?: postgres.Sql;
  drizzleDb?: any;
};

export function createDatabase(connectionString = process.env["DATABASE_URL"]) {
  if (process.env["DEV_DB"] === "pglite") {
    // PGlite 싱글톤 기존 로직 유지
    return pgliteDatabase;
  }

  const resolvedConnectionString = resolveConnectionString(connectionString);

  // 전역에 이미 인스턴스가 존재한다면 새로 만들지 않고 재사용
  if (!globalForDb.postgresClient) {
    globalForDb.postgresClient = postgres(resolvedConnectionString, {
      max: process.env["DB_POOL_MAX"] ? parseInt(process.env["DB_POOL_MAX"]) : 10,
      prepare: false,
      idle_timeout: 15,    // 15초 동안 사용되지 않는 커넥션은 풀에서 자동 해제
      connect_timeout: 5   // DB 연결 타임아웃 제한을 두어 먹통 상태 방지
    });
    globalForDb.drizzleDb = drizzlePostgres(globalForDb.postgresClient, { schema });
  }

  return globalForDb.drizzleDb;
}
```

* **기대 효과**: 
  * 매 요청 및 핫 리로딩마다 발생하는 데이터베이스 연결 오버헤드를 0에 수렴하게 제어합니다.
  * 이미 맺어진 안정적인 TCP 세션을 고스란히 재사용하므로, 쿼리 수행 지연 시간이 극적으로 단축됩니다.

### 3.2 방안 B: 데이터베이스 커넥션 풀 크기 최적화 및 유휴 시간 제어

Netlify Serverless Functions 등 분산 런타임에서는 수많은 서버리스 컨테이너 인스턴스가 생성됩니다.
* **최적화**: 개별 컨테이너마다 `max: 10` 풀을 할당하는 것은 서버리스 환경에 부적합합니다.
  * 환경변수 `DB_POOL_MAX`를 운영 서버리스 환경에서는 `2` 또는 `3` 수준으로 엄격하게 격하합니다.
  * 유휴 커넥션을 빠르게 반환하도록 `idle_timeout`을 10~15초 수준으로 설정합니다.

### 3.3 방안 C: Next.js 의존성 다이어트 및 빌드 가속화

* **최적화**: 모노레포 구조 상 배포 대상인 `apps/web`에 불필요한 번들이 포함되지 않도록 빌드 프로세스를 타이트하게 잡습니다.
  * `.next` 내 파일 번들 사이즈를 줄이기 위해 사용하지 않는 의존성을 점검합니다.
  * 런타임 시 동적으로 불려오는 라이브러리(예: `lucide-react`, `@csp/design-tokens`) 등의 트리쉐이킹(Tree Shaking) 상태를 확인하여 클라이언트 사이드 로딩 속도를 올립니다.

---

## 4. 향후 조치 및 검증 로드맵 (Verification Roadmap)

1. **로컬 성능 테스트 프로파일링**: 
   * 위 전역 싱글톤 캐싱 리팩토링을 적용한 후, 실제로 지연 시간이 줄어드는지 수동 및 통합 테스트로 지표 비교.
2. **커넥션 누수 검증**:
   * 로컬 PostgreSQL에 `SELECT count(*) FROM pg_stat_activity;`를 수행하여 코드 수정 전후의 활성 커넥션 유지 상태 분석.
3. **Netlify 배포 검증**:
   * Netlify 배포 본에서 콜드 스타트 및 런타임 지연(API 응답 소요 시간)이 150ms 이내로 단축되는지 확인.
