import { NextResponse } from "next/server";
import { migrate } from "@/db/migrate";

export async function GET() {
  try {
    await migrate();
    return NextResponse.json({ success: true, message: "Migration complete" });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
