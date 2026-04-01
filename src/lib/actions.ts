"use server";

import { db } from "@/db";
import {
  projects,
  fields,
  englishValues,
  regions,
  translations,
} from "@/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendTranslationNotification } from "@/lib/email";
import { getRegionByCode } from "@/lib/regions";
import { headers } from "next/headers";

// ─── Projects ──────────────────────────────────────────────

export async function getProjects() {
  const result = await db
    .select({
      id: projects.id,
      name: projects.name,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .orderBy(projects.createdAt);

  // Get region counts per project
  const projectsWithCounts = await Promise.all(
    result.map(async (project) => {
      const regionRows = await db
        .select({
          status: regions.status,
          localeCode: regions.localeCode,
        })
        .from(regions)
        .where(eq(regions.projectId, project.id));

      const total = regionRows.length;
      const complete = regionRows.filter((r) => r.status === "complete").length;
      const partial = regionRows.filter((r) => r.status === "partial").length;
      const pending = regionRows.filter((r) => r.status === "pending").length;
      const localeCodes = regionRows.map((r) => r.localeCode);

      return { ...project, regionCounts: { total, complete, partial, pending }, localeCodes };
    })
  );

  return projectsWithCounts;
}

export async function getProject(id: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);
  return project ?? null;
}

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const notificationEmail = (formData.get("notificationEmail") as string) || null;
  const fieldNames = formData.getAll("fieldName") as string[];
  const fieldTypes = formData.getAll("fieldType") as string[];

  if (!name?.trim()) throw new Error("Project name is required");
  if (fieldNames.length === 0) throw new Error("At least one field is required");

  const [project] = await db
    .insert(projects)
    .values({ name: name.trim(), notificationEmail })
    .returning();

  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i]?.trim();
    const fieldType = fieldTypes[i] as "text" | "textarea" | "url";
    if (!fieldName) continue;

    const [field] = await db
      .insert(fields)
      .values({
        projectId: project.id,
        name: fieldName,
        fieldType: fieldType || "text",
        sortOrder: i,
      })
      .returning();

    // Create an empty english value row for each field
    await db.insert(englishValues).values({ fieldId: field.id, value: "" });
  }

  redirect(`/projects/${project.id}`);
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
  revalidatePath("/");
  redirect("/");
}

export async function renameProject(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Project name is required");
  await db
    .update(projects)
    .set({ name: trimmed, updatedAt: new Date() })
    .where(eq(projects.id, id));
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

// ─── Fields ────────────────────────────────────────────────

export async function getFieldsForProject(projectId: string) {
  return db
    .select({
      id: fields.id,
      name: fields.name,
      fieldType: fields.fieldType,
      sortOrder: fields.sortOrder,
      englishValue: englishValues.value,
      englishValueId: englishValues.id,
      englishUpdatedAt: englishValues.updatedAt,
    })
    .from(fields)
    .leftJoin(englishValues, eq(fields.id, englishValues.fieldId))
    .where(eq(fields.projectId, projectId))
    .orderBy(asc(fields.sortOrder));
}

export async function addFieldToExistingProject(
  projectId: string,
  name: string,
  fieldType: "text" | "textarea" | "url",
  sortOrder: number
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Field name is required");

  const [field] = await db
    .insert(fields)
    .values({ projectId, name: trimmed, fieldType, sortOrder })
    .returning();

  await db.insert(englishValues).values({ fieldId: field.id, value: "" });

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
  return field;
}

export async function updateField(
  projectId: string,
  fieldId: string,
  name: string,
  fieldType: "text" | "textarea" | "url"
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Field name is required");

  await db
    .update(fields)
    .set({ name: trimmed, fieldType })
    .where(eq(fields.id, fieldId));

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
}

export async function removeField(projectId: string, fieldId: string) {
  // Cascade will delete english_values and translations
  await db.delete(fields).where(eq(fields.id, fieldId));

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
}

export async function reorderFields(
  projectId: string,
  fieldIds: string[]
) {
  for (let i = 0; i < fieldIds.length; i++) {
    await db
      .update(fields)
      .set({ sortOrder: i })
      .where(eq(fields.id, fieldIds[i]));
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function getFieldPopulationStatus(fieldId: string) {
  // Check if this field has any non-empty english value or translations
  const [ev] = await db
    .select({ value: englishValues.value })
    .from(englishValues)
    .where(eq(englishValues.fieldId, fieldId))
    .limit(1);

  const hasEnglish = ev && ev.value.trim().length > 0;

  const translationRows = await db
    .select({ value: translations.value })
    .from(translations)
    .where(eq(translations.fieldId, fieldId));

  const translationCount = translationRows.filter(
    (t) => t.value.trim().length > 0
  ).length;

  return { hasEnglish: !!hasEnglish, translationCount };
}

export async function saveEnglishValues(projectId: string, formData: FormData) {
  const fieldIds = formData.getAll("fieldId") as string[];
  const values = formData.getAll("value") as string[];

  for (let i = 0; i < fieldIds.length; i++) {
    const fieldId = fieldIds[i];
    const value = values[i] ?? "";

    await db
      .update(englishValues)
      .set({ value, updatedAt: new Date() })
      .where(eq(englishValues.fieldId, fieldId));
  }

  await db
    .update(projects)
    .set({ updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
}

// ─── Regions ───────────────────────────────────────────────

export async function getRegionsForProject(projectId: string) {
  return db
    .select()
    .from(regions)
    .where(eq(regions.projectId, projectId))
    .orderBy(asc(regions.localeCode));
}

export async function addRegions(projectId: string, localeCodes: string[]) {
  if (localeCodes.length === 0) return;

  const existing = await db
    .select({ localeCode: regions.localeCode })
    .from(regions)
    .where(eq(regions.projectId, projectId));

  const existingCodes = new Set(existing.map((r) => r.localeCode));
  const newCodes = localeCodes.filter((c) => !existingCodes.has(c));

  if (newCodes.length > 0) {
    await db.insert(regions).values(
      newCodes.map((code) => ({
        projectId,
        localeCode: code,
        status: "pending" as const,
      }))
    );
  }

  revalidatePath(`/projects/${projectId}`);
}

export async function removeRegion(projectId: string, regionId: string) {
  await db.delete(regions).where(eq(regions.id, regionId));
  revalidatePath(`/projects/${projectId}`);
}

// ─── Translations ──────────────────────────────────────────

export async function getTranslationsForRegion(regionId: string) {
  return db
    .select()
    .from(translations)
    .where(eq(translations.regionId, regionId));
}

export async function saveTranslations(
  projectId: string,
  regionId: string,
  localeCode: string,
  formData: FormData
) {
  const fieldIds = formData.getAll("fieldId") as string[];
  const values = formData.getAll("value") as string[];

  // Get total field count for status calculation
  const allFields = await db
    .select({ id: fields.id })
    .from(fields)
    .where(eq(fields.projectId, projectId));

  let filledCount = 0;

  for (let i = 0; i < fieldIds.length; i++) {
    const fieldId = fieldIds[i];
    const value = values[i] ?? "";
    if (value.trim()) filledCount++;

    // Upsert: check if translation exists for this region+field
    const existing = await db
      .select()
      .from(translations)
      .where(
        and(eq(translations.regionId, regionId), eq(translations.fieldId, fieldId))
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(translations)
        .set({ value, updatedAt: new Date() })
        .where(eq(translations.id, existing[0].id));
    } else {
      await db
        .insert(translations)
        .values({ regionId, fieldId, value });
    }
  }

  // Calculate and update region status
  const totalFields = allFields.length;
  let status: "pending" | "partial" | "complete" = "pending";
  if (filledCount >= totalFields) status = "complete";
  else if (filledCount > 0) status = "partial";

  await db
    .update(regions)
    .set({ status, updatedAt: new Date() })
    .where(eq(regions.id, regionId));

  // Send email notification if configured
  const project = await getProject(projectId);
  if (project?.notificationEmail) {
    const regionDef = getRegionByCode(localeCode);
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "http";
    const projectUrl = `${protocol}://${host}/projects/${projectId}`;

    try {
      await sendTranslationNotification({
        to: project.notificationEmail,
        projectName: project.name,
        regionLabel: regionDef?.label ?? localeCode,
        regionCode: localeCode,
        status,
        projectUrl,
      });
    } catch (err) {
      console.error("Failed to send notification email:", err);
    }
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/regions/${localeCode}`);
}

// ─── CSV Data ──────────────────────────────────────────────

export async function getProjectCsvData(projectId: string) {
  const project = await getProject(projectId);
  if (!project) return null;

  const allFields = await db
    .select()
    .from(fields)
    .where(eq(fields.projectId, projectId))
    .orderBy(asc(fields.sortOrder));

  const english = await db
    .select()
    .from(englishValues)
    .where(
      sql`${englishValues.fieldId} IN (SELECT id FROM fields WHERE project_id = ${projectId})`
    );

  const englishMap = new Map(english.map((e) => [e.fieldId, e.value]));

  const allRegions = await db
    .select()
    .from(regions)
    .where(eq(regions.projectId, projectId))
    .orderBy(asc(regions.localeCode));

  const regionTranslations = await Promise.all(
    allRegions.map(async (region) => {
      const trans = await db
        .select()
        .from(translations)
        .where(eq(translations.regionId, region.id));
      const transMap = new Map(trans.map((t) => [t.fieldId, t.value]));
      return { region, transMap };
    })
  );

  return { project, allFields, englishMap, allRegions, regionTranslations };
}
