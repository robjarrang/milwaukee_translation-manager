import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendTranslationNotification({
  to,
  projectName,
  regionLabel,
  regionCode,
  status,
  projectUrl,
}: {
  to: string;
  projectName: string;
  regionLabel: string;
  regionCode: string;
  status: "pending" | "partial" | "complete";
  projectUrl: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email notification");
    return;
  }

  const statusText =
    status === "complete"
      ? "All translations complete ✅"
      : status === "partial"
        ? "Translations partially complete 🟡"
        : "Translations pending ⏳";

  await resend.emails.send({
    from: "Milwaukee Translation Manager <noreply@resend.dev>",
    to,
    subject: `[${regionCode}] ${statusText} — ${projectName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <h2 style="color: #DB021D;">Milwaukee Translation Manager</h2>
        <p>A translation update has been submitted.</p>
        <table style="border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Project</td><td>${escapeHtml(projectName)}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Region</td><td>${escapeHtml(regionLabel)} (${escapeHtml(regionCode)})</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Status</td><td>${statusText}</td></tr>
        </table>
        <p><a href="${escapeHtml(projectUrl)}" style="display: inline-block; padding: 10px 20px; background: #DB021D; color: #fff; text-decoration: none; border-radius: 6px;">View Project</a></p>
      </div>
    `,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
