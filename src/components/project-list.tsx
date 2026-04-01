"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, ArrowUpDown, FolderOpen, Plus } from "lucide-react";

interface ProjectData {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  regionCounts: {
    total: number;
    complete: number;
    partial: number;
    pending: number;
  };
  localeCodes: string[];
}

type SortOption = "created-desc" | "created-asc" | "updated-desc" | "updated-asc" | "name-asc" | "name-desc";
type StatusFilter = "all" | "has-pending" | "has-partial" | "all-complete" | "no-regions";

interface ProjectListProps {
  projects: ProjectData[];
  allRegionCodes: string[];
}

export function ProjectList({ projects, allRegionCodes }: ProjectListProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("created-desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...projects];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => {
        switch (statusFilter) {
          case "has-pending":
            return p.regionCounts.pending > 0;
          case "has-partial":
            return p.regionCounts.partial > 0;
          case "all-complete":
            return p.regionCounts.total > 0 && p.regionCounts.complete === p.regionCounts.total;
          case "no-regions":
            return p.regionCounts.total === 0;
          default:
            return true;
        }
      });
    }

    // Region filter
    if (regionFilter !== "all") {
      result = result.filter((p) => p.localeCodes.includes(regionFilter));
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case "created-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "created-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "updated-desc":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "updated-asc":
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return result;
  }, [projects, search, sort, statusFilter, regionFilter]);

  const hasActiveFilters = search.trim() || statusFilter !== "all" || regionFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setRegionFilter("all");
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold uppercase">No projects yet</h3>
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
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created-desc">Newest first</SelectItem>
              <SelectItem value="created-asc">Oldest first</SelectItem>
              <SelectItem value="updated-desc">Recently updated</SelectItem>
              <SelectItem value="updated-asc">Least recent</SelectItem>
              <SelectItem value="name-asc">Name A–Z</SelectItem>
              <SelectItem value="name-desc">Name Z–A</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[155px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="has-pending">Has pending</SelectItem>
              <SelectItem value="has-partial">Has in progress</SelectItem>
              <SelectItem value="all-complete">All complete</SelectItem>
              <SelectItem value="no-regions">No regions</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={(v) => setRegionFilter(v ?? "all")}>
            <SelectTrigger className="w-[155px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All regions</SelectItem>
              {allRegionCodes.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {filtered.length} of {projects.length} projects
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            No projects match your filters.
          </p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-[#DB011C]/50 transition-colors cursor-pointer h-full">
                <CardHeader className="pb-3">
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    Created{" "}
                    {new Date(project.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {new Date(project.updatedAt).getTime() !== new Date(project.createdAt).getTime() && (
                      <>
                        {" "}&middot; Updated{" "}
                        {new Date(project.updatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </>
                    )}
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-900 bg-green-100 px-2 py-0.5">
                          {project.regionCounts.complete} complete
                        </span>
                      )}
                      {project.regionCounts.partial > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5">
                          {project.regionCounts.partial} in progress
                        </span>
                      )}
                      {project.regionCounts.pending > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#DB011C] bg-[#DB011C]/10 px-2 py-0.5">
                          {project.regionCounts.pending} pending
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {project.regionCounts.complete}/{project.regionCounts.total}
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
