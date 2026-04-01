import { NextRequest, NextResponse } from "next/server";
import { getProjectCsvData } from "@/lib/actions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await getProjectCsvData(id);

  if (!data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { project, allFields, englishMap, regionTranslations } = data;

  // Build CSV rows
  const rows: string[][] = [];

  // Header row
  const header = ["Region", ...allFields.map((f) => f.name)];
  rows.push(header);

  // English row
  const englishRow = [
    "English (Source)",
    ...allFields.map((f) => englishMap.get(f.id) ?? ""),
  ];
  rows.push(englishRow);

  // Region rows
  for (const { region, transMap } of regionTranslations) {
    const row = [
      region.localeCode,
      ...allFields.map((f) => transMap.get(f.id) ?? ""),
    ];
    rows.push(row);
  }

  // Convert to CSV string
  const csvContent = rows
    .map((row) =>
      row.map((cell) => {
        // Escape cells that contain commas, quotes, or newlines
        if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(",")
    )
    .join("\r\n");

  // UTF-8 BOM for Excel compatibility
  const BOM = "\uFEFF";
  const csvWithBom = BOM + csvContent;

  const filename = `${project.name.replace(/[^a-zA-Z0-9-_ ]/g, "").replace(/\s+/g, "-")}-translations.csv`;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
