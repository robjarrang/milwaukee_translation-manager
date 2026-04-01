import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const fieldTypeEnum = pgEnum("field_type", ["text", "textarea", "url"]);

export const regionStatusEnum = pgEnum("region_status", [
  "pending",
  "partial",
  "complete",
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  notificationEmail: text("notification_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fields = pgTable("fields", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  fieldType: fieldTypeEnum("field_type").notNull().default("text"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const englishValues = pgTable("english_values", {
  id: uuid("id").defaultRandom().primaryKey(),
  fieldId: uuid("field_id")
    .references(() => fields.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  value: text("value").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const regions = pgTable("regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  localeCode: text("locale_code").notNull(),
  status: regionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const translations = pgTable("translations", {
  id: uuid("id").defaultRandom().primaryKey(),
  regionId: uuid("region_id")
    .references(() => regions.id, { onDelete: "cascade" })
    .notNull(),
  fieldId: uuid("field_id")
    .references(() => fields.id, { onDelete: "cascade" })
    .notNull(),
  value: text("value").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type Project = typeof projects.$inferSelect;
export type Field = typeof fields.$inferSelect;
export type EnglishValue = typeof englishValues.$inferSelect;
export type Region = typeof regions.$inferSelect;
export type Translation = typeof translations.$inferSelect;
