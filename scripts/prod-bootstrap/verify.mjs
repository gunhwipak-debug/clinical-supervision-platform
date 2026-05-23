import postgres from "../../node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js";

const sql = postgres(process.env.NEON_URL, { max: 1, prepare: false, onnotice: () => {} });

const [row] = await sql`
  SELECT
    (SELECT count(*) FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users' AND column_name='password_changed_at') AS password_changed_at_col,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users' AND column_name='failed_login_count') AS failed_login_count_col,
    (SELECT count(*) FROM information_schema.columns
      WHERE table_schema='public' AND table_name='users' AND column_name='locked_until') AS locked_until_col,
    (SELECT count(*) FROM information_schema.tables
      WHERE table_schema='public' AND table_name='auth_tokens') AS auth_tokens_table,
    (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND policyname='users_context_insert') AS users_insert_policy,
    (SELECT count(*) FROM terms_versions WHERE is_active = true) AS active_terms,
    (SELECT count(*) FROM specialty_catalog) AS specialties
`;
console.log(row);
await sql.end();
