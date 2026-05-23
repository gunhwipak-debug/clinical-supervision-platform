# Interim Report: Neon Database Role Separation and RLS Policy Enforcement

## 1. Executive Summary

This report documents the architectural design and implementation steps for enforcing Row Level Security (RLS) within our Neon Postgres database. In a production clinic platform handling sensitive case packets and Protected Health Information (PHI), RLS acts as a database-level defense-in-depth security layer. 

To prevent security policy bypasses, we separate database roles:
* **Database Owner Role (`neondb_owner` / default admin)**: Retains full bypass powers (`BYPASSRLS`) to execute schema migrations, Drizzle Kit operations, and dev seeds.
* **Application Service Role (`csp_app`)**: Operating under strict RLS policies to query availability, bookings, and case packets. Every query is scoped to the context of the active session user, preventing unauthorized data exposure.

---

## 2. RLS Security Model and Role Separation

### 2.1 The RLS Bypass Vulnerability

In PostgreSQL, RLS policies are **not enforced** for:
1. The table owner (typically the role that created the tables).
2. Superusers and roles explicitly granted the `BYPASSRLS` attribute.

If the main web application connects using the same owner account that executed migrations, all RLS policies are silently ignored, rendering table-level policies ineffective. Consequently, any application-level query bugs could lead to cross-tenant data leaks.

### 2.2 Dual-Role Architecture

We separate database connections using two environment variables:

| Connection String Var | Database User / Role | Privileges | RLS Enforcement | Primary Use Case |
| :--- | :--- | :--- | :--- | :--- |
| `SERVICE_DATABASE_URL` | `neondb_owner` (Owner) | Full Owner / DDL / DML | Bypassed | Schema migrations, seeding, CLI tools |
| `DATABASE_URL` | `csp_app` (Restricted) | `SELECT`, `INSERT`, `UPDATE`, `DELETE` | **Enforced** | Web application runtime, API endpoints |

---

## 3. Neon DB Console Execution Script

To bootstrap the RLS role separation, execute the following SQL script inside the Neon Console or via an administrative `psql` connection:

```sql
-- 1. Create the application role if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'csp_app') THEN
    CREATE ROLE csp_app WITH LOGIN PASSWORD 'YOUR_SECURE_APP_PASSWORD';
  END IF;
END
$$;

-- 2. Grant connection and schema usage
GRANT CONNECT ON DATABASE neondb TO csp_app;
GRANT USAGE ON SCHEMA public TO csp_app;

-- 3. Grant table permissions (DML operations only)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO csp_app;

-- 4. Grant sequence usage for auto-increment columns (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO csp_app;

-- 5. Configure default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO csp_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO csp_app;

-- 6. Ensure RLS is active on all protected tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE supervisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;

ALTER TABLE case_packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_packets FORCE ROW LEVEL SECURITY;

ALTER TABLE external_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_calendar_connections FORCE ROW LEVEL SECURITY;

-- Note: RLS policies utilize app.current_user_id() and app.current_user_role()
-- set within transaction context parameters via next/server to isolate query results.
```

---

## 4. Application Verification and Caching

Our database client `packages/db/src/client.ts` uses a global singleton cache mapping connection strings to active clients. This ensures:
1. Connecting with `DATABASE_URL` as `csp_app` reuses a single connection pool restricted by RLS.
2. Connecting with `SERVICE_DATABASE_URL` as `neondb_owner` reuses an administrative pool.
3. Next.js hot module reloading does not leak connections or exhaust Neon connection slots.

### Verification Queries

To verify RLS is operating correctly, connect as `csp_app` and execute:

```sql
-- 1. Switch to application role in your query tool
SET ROLE csp_app;

-- 2. Attempt to read case packets without setting session parameters (should return 0 rows)
SELECT count(*) FROM case_packets;

-- 3. Set the session parameters to simulate an active user session
SET LOCAL app.current_user_id = '30000000-0000-0000-0000-000000000001';
SET LOCAL app.current_user_role = 'supervisee';

-- 4. Query again (should only return rows matching the current supervisee user)
SELECT count(*) FROM case_packets;
```
