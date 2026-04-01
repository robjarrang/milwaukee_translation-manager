import Link from "next/link";
import { getProjects } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Plus, FolderOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
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

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No projects yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first translation project to get started.
            </p>
            <Link href="/projects/new">
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                New Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  <CardDescription>
                    Created{" "}
                    {new Date(project.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.regionCounts.total === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No regions added yet
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {project.regionCounts.complete > 0 && (
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          {project.regionCounts.complete} complete
                        </span>
                      )}
                      {project.regionCounts.partial > 0 && (
                        <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {project.regionCounts.partial} partial
                        </span>
                      )}
                      {project.regionCounts.pending > 0 && (
                        <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                          {project.regionCounts.pending} pending
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {project.regionCounts.complete}/{project.regionCounts.total} complete
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
