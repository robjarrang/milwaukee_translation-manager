import { db } from "./index";
import { sql } from "drizzle-orm";

export async function migrate() {
  // Create enums
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE field_type AS ENUM ('text', 'textarea', 'url');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE region_status AS ENUM ('pending', 'partial', 'complete');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      notification_email TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS fields (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      field_type field_type NOT NULL DEFAULT 'text',
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS english_values (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      field_id UUID NOT NULL UNIQUE REFERENCES fields(id) ON DELETE CASCADE,
      value TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS regions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      locale_code TEXT NOT NULL,
      status region_status NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS translations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
      field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
      value TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
}
