const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_XP2QJpeRZH7a@ep-lively-hill-ab07wzse-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require";

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log("Running migration...\n");

  await sql`DO $$ BEGIN CREATE TYPE field_type AS ENUM ('text', 'textarea', 'url'); EXCEPTION WHEN duplicate_object THEN null; END $$`;
  console.log("✓ field_type enum");

  await sql`DO $$ BEGIN CREATE TYPE region_status AS ENUM ('pending', 'partial', 'complete'); EXCEPTION WHEN duplicate_object THEN null; END $$`;
  console.log("✓ region_status enum");

  await sql`CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    notification_email TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;
  console.log("✓ projects table");

  await sql`CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    field_type field_type NOT NULL DEFAULT 'text',
    sort_order INTEGER NOT NULL DEFAULT 0
  )`;
  console.log("✓ fields table");

  await sql`CREATE TABLE IF NOT EXISTS english_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL UNIQUE REFERENCES fields(id) ON DELETE CASCADE,
    value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;
  console.log("✓ english_values table");

  await sql`CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    locale_code TEXT NOT NULL,
    status region_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;
  console.log("✓ regions table");

  await sql`CREATE TABLE IF NOT EXISTS translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    value TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
  )`;
  console.log("✓ translations table");

  console.log("\n✅ Migration complete!");
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
