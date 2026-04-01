import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProject,
  getFieldsForProject,
  getRegionsForProject,
} from "@/lib/actions";
import { getRegionByCode } from "@/lib/regions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { EnglishValuesForm } from "@/components/english-values-form";
import { AddRegionDialog } from "@/components/add-region-dialog";
import { ShareLink } from "@/components/share-link";
import { EditableProjectName } from "@/components/editable-project-name";
import {
  DeleteProjectButton,
  RemoveRegionButton,
} from "@/components/delete-buttons";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [project, fieldsData, regionsData] = await Promise.all([
    getProject(id),
    getFieldsForProject(id),
    getRegionsForProject(id),
  ]);

  if (!project) notFound();

  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const projectUrl = `${protocol}://${host}/projects/${project.id}`;

  const existingCodes = regionsData.map((r) => r.localeCode);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <EditableProjectName
              projectId={project.id}
              initialName={project.name}
            />
            <p className="text-sm text-muted-foreground">
              Created{" "}
              {new Date(project.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {project.notificationEmail && (
                <>
                  {" "}
                  &middot; Notifications to {project.notificationEmail}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/projects/${project.id}/csv`}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download CSV
            </Button>
          </a>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>

      {/* Share link */}
      <ShareLink url={projectUrl} />

      {/* Tabs */}
      <Tabs defaultValue="english" className="space-y-4">
        <TabsList>
          <TabsTrigger value="english">
            English Values ({fieldsData.length})
          </TabsTrigger>
          <TabsTrigger value="regions">
            Regions ({regionsData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="english">
          <Card>
            <CardHeader>
              <CardTitle>English Source Copy</CardTitle>
              <CardDescription>
                Enter the English values for each field. These will be shown as
                reference to regional translators.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fieldsData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No fields configured.
                </p>
              ) : (
                <EnglishValuesForm
                  projectId={project.id}
                  fields={fieldsData.map((f) => ({
                    id: f.id,
                    name: f.name,
                    fieldType: f.fieldType as "text" | "textarea" | "url",
                    englishValue: f.englishValue,
                    englishUpdatedAt: f.englishUpdatedAt,
                  }))}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Regions</CardTitle>
                <CardDescription>
                  Add regions and track translation progress
                </CardDescription>
              </div>
              <AddRegionDialog
                projectId={project.id}
                existingCodes={existingCodes}
              />
            </CardHeader>
            <CardContent>
              {regionsData.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  No regions added yet. Click &ldquo;Add Region&rdquo; to assign
                  regions for translation.
                </p>
              ) : (
                <div className="space-y-2">
                  {regionsData.map((region) => {
                    const regionDef = getRegionByCode(region.localeCode);
                    return (
                      <div
                        key={region.id}
                        className="flex items-center justify-between border p-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <StatusBadge
                            status={
                              region.status as
                                | "pending"
                                | "partial"
                                | "complete"
                            }
                          />
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {region.localeCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {regionDef?.label ?? region.localeCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(region.updatedAt)}
                          </span>
                          <Link
                            href={`/projects/${project.id}/regions/${region.localeCode}`}
                          >
                            <Button variant="outline" size="sm">
                              <ExternalLink className="h-3.5 w-3.5 mr-1" />
                              {region.status === "pending"
                                ? "Add Translations"
                                : "Edit"}
                            </Button>
                          </Link>
                          <RemoveRegionButton
                            projectId={project.id}
                            regionId={region.id}
                            localeCode={region.localeCode}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
