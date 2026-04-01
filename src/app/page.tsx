import Link from "next/link";
import { getProjects } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { ProjectList } from "@/components/project-list";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await getProjects();

  // Collect all unique region codes across all projects for the filter dropdown
  const allRegionCodes = Array.from(
    new Set(projects.flatMap((p) => p.localeCodes))
  ).sort();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage email translation projects
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            New Project
          </Button>
        </Link>
      </div>

      <ProjectList projects={projects} allRegionCodes={allRegionCodes} />
    </div>
  );
}
