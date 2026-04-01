"use client";

import { useState } from "react";
import { createProject } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldBuilder, FieldDefinition } from "@/components/field-builder";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (fields.length === 0 || fields.some((f) => !f.name.trim())) return;
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    // The fieldName inputs are already in the form via FieldBuilder's Input elements.
    // But fieldType is a hidden input. Let's make sure they're in order.
    await createProject(formData);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground">
            Set up a new translation project with custom fields
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. April 2026 Newsletter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notificationEmail">
                  Notification Email{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="notificationEmail"
                  name="notificationEmail"
                  type="email"
                  placeholder="you@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Receive an email when a region submits their translations
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Translation Fields</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldBuilder fields={fields} onChange={setFields} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={
                submitting ||
                fields.length === 0 ||
                fields.some((f) => !f.name.trim())
              }
            >
              {submitting ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
