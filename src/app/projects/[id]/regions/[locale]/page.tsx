import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProject,
  getFieldsForProject,
  getRegionsForProject,
  getTranslationsForRegion,
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
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { TranslationForm } from "@/components/translation-form";

export const dynamic = "force-dynamic";

export default async function RegionTranslationPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const [project, fieldsData, regionsData] = await Promise.all([
    getProject(id),
    getFieldsForProject(id),
    getRegionsForProject(id),
  ]);

  if (!project) notFound();

  const region = regionsData.find((r) => r.localeCode === locale);
  if (!region) notFound();

  const translationsData = await getTranslationsForRegion(region.id);
  const translationMap = new Map(
    translationsData.map((t) => [t.fieldId, t])
  );

  const regionDef = getRegionByCode(locale);

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/projects/${project.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl">
              {regionDef?.label ?? locale}
            </h1>
            <StatusBadge
              status={region.status as "pending" | "partial" | "complete"}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{locale}</span> &middot;{" "}
            {project.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Translations</CardTitle>
          <CardDescription>
            Enter the translated copy for each field. The English source is shown
            as reference — click the copy icon to copy any value to your
            clipboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TranslationForm
            projectId={project.id}
            regionId={region.id}
            localeCode={locale}
            fields={fieldsData.map((f) => {
              const trans = translationMap.get(f.id);
              return {
                id: f.id,
                name: f.name,
                fieldType: f.fieldType as "text" | "textarea" | "url",
                englishValue: f.englishValue ?? "",
                translatedValue: trans?.value ?? "",
                translatedUpdatedAt: trans?.updatedAt ?? null,
              };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
