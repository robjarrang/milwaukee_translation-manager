"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Plus, Copy, Layers, Save, AlertTriangle, GripVertical } from "lucide-react";
import { groupFields, getNextStoryNumber } from "@/lib/field-groups";
import {
  addFieldToExistingProject,
  updateField,
  removeField,
  reorderFields,
  getFieldPopulationStatus,
} from "@/lib/actions";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ExistingField {
  id: string;
  name: string;
  fieldType: "text" | "textarea" | "url";
  sortOrder: number;
}

interface FieldEditorProps {
  projectId: string;
  fields: ExistingField[];
}

interface PendingDelete {
  fieldId: string;
  fieldName: string;
  hasEnglish: boolean;
  translationCount: number;
}

export function FieldEditor({ projectId, fields: initialFields }: FieldEditorProps) {
  const [fields, setFields] = useState(initialFields);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [checkingDelete, setCheckingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const grouped = groupFields(fields);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const updated = [...fields];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);
    setFields(updated);
    // Persist the new order
    startTransition(async () => {
      try {
        await reorderFields(projectId, updated.map((f) => f.id));
      } catch {
        toast.error("Failed to save field order");
      }
    });
  };

  const markDirty = (id: string) => {
    setDirty((prev) => new Set(prev).add(id));
  };

  const updateLocal = (
    id: string,
    key: "name" | "fieldType",
    value: string
  ) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
    markDirty(id);
  };

  const handleSaveField = async (field: ExistingField) => {
    startTransition(async () => {
      try {
        await updateField(
          projectId,
          field.id,
          field.name,
          field.fieldType
        );
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(field.id);
          return next;
        });
        toast.success(`Saved "${field.name}"`);
      } catch {
        toast.error("Failed to save field");
      }
    });
  };

  const handleRequestDelete = async (field: ExistingField) => {
    setCheckingDelete(true);
    try {
      const status = await getFieldPopulationStatus(field.id);
      if (status.hasEnglish || status.translationCount > 0) {
        setPendingDelete({
          fieldId: field.id,
          fieldName: field.name,
          hasEnglish: status.hasEnglish,
          translationCount: status.translationCount,
        });
      } else {
        // No data, delete immediately
        await removeField(projectId, field.id);
        setFields((prev) => prev.filter((f) => f.id !== field.id));
        toast.success(`Removed "${field.name}"`);
      }
    } catch {
      toast.error("Failed to check field status");
    } finally {
      setCheckingDelete(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await removeField(projectId, pendingDelete.fieldId);
      setFields((prev) => prev.filter((f) => f.id !== pendingDelete.fieldId));
      toast.success(`Removed "${pendingDelete.fieldName}"`);
      setPendingDelete(null);
    } catch {
      toast.error("Failed to remove field");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddField = async () => {
    const sortOrder = fields.length;
    startTransition(async () => {
      try {
        const field = await addFieldToExistingProject(
          projectId,
          "New Field",
          "text",
          sortOrder
        );
        setFields((prev) => [
          ...prev,
          { id: field.id, name: field.name, fieldType: "text", sortOrder },
        ]);
        markDirty(field.id);
      } catch {
        toast.error("Failed to add field");
      }
    });
  };

  const handleAddStory = async () => {
    const n = getNextStoryNumber(fields);
    const prefix = `Story ${n}`;
    const storyDefs = [
      { name: `${prefix} Title`, type: "text" as const },
      { name: `${prefix} Description`, type: "textarea" as const },
      { name: `${prefix} CTA Text`, type: "text" as const },
      { name: `${prefix} CTA Link`, type: "url" as const },
    ];

    startTransition(async () => {
      try {
        const newFields: ExistingField[] = [];
        for (let i = 0; i < storyDefs.length; i++) {
          const def = storyDefs[i];
          const sortOrder = fields.length + newFields.length;
          const field = await addFieldToExistingProject(
            projectId,
            def.name,
            def.type,
            sortOrder
          );
          newFields.push({
            id: field.id,
            name: field.name,
            fieldType: def.type,
            sortOrder,
          });
        }
        setFields((prev) => [...prev, ...newFields]);
        toast.success(`Added ${prefix}`);
      } catch {
        toast.error("Failed to add story");
      }
    });
  };

  const handleDuplicateStory = async (groupName: string) => {
    const n = getNextStoryNumber(fields);
    const newPrefix = `Story ${n}`;
    const storyFields = fields.filter((f) =>
      f.name.match(new RegExp(`^${groupName}\\s+`, "i"))
    );

    startTransition(async () => {
      try {
        const newFields: ExistingField[] = [];
        for (const sf of storyFields) {
          const newName = sf.name.replace(
            new RegExp(`^${groupName}`, "i"),
            newPrefix
          );
          const sortOrder = fields.length + newFields.length;
          const field = await addFieldToExistingProject(
            projectId,
            newName,
            sf.fieldType,
            sortOrder
          );
          newFields.push({
            id: field.id,
            name: field.name,
            fieldType: sf.fieldType,
            sortOrder,
          });
        }
        setFields((prev) => [...prev, ...newFields]);
        toast.success(`Duplicated as ${newPrefix}`);
      } catch {
        toast.error("Failed to duplicate story");
      }
    });
  };

  const handleRemoveStory = async (groupName: string) => {
    const storyFields = fields.filter((f) =>
      f.name.match(new RegExp(`^${groupName}\\s+`, "i"))
    );

    // Check if any fields have data
    setCheckingDelete(true);
    try {
      let totalTranslations = 0;
      let anyEnglish = false;
      for (const sf of storyFields) {
        const status = await getFieldPopulationStatus(sf.id);
        if (status.hasEnglish) anyEnglish = true;
        totalTranslations += status.translationCount;
      }

      if (anyEnglish || totalTranslations > 0) {
        setPendingDelete({
          fieldId: storyFields.map((f) => f.id).join(","),
          fieldName: groupName,
          hasEnglish: anyEnglish,
          translationCount: totalTranslations,
        });
      } else {
        for (const sf of storyFields) {
          await removeField(projectId, sf.id);
        }
        setFields((prev) =>
          prev.filter(
            (f) => !f.name.match(new RegExp(`^${groupName}\\s+`, "i"))
          )
        );
        toast.success(`Removed ${groupName}`);
      }
    } catch {
      toast.error("Failed to check story status");
    } finally {
      setCheckingDelete(false);
    }
  };

  const handleConfirmDeleteStory = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const ids = pendingDelete.fieldId.split(",");
      for (const id of ids) {
        await removeField(projectId, id);
      }
      setFields((prev) => prev.filter((f) => !ids.includes(f.id)));
      toast.success(`Removed "${pendingDelete.fieldName}"`);
      setPendingDelete(null);
    } catch {
      toast.error("Failed to remove");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddFieldToStory = async (groupName: string) => {
    const storyFields = fields.filter((f) =>
      f.name.match(new RegExp(`^${groupName}\\s+`, "i"))
    );
    const sortOrder =
      storyFields.length > 0
        ? Math.max(...storyFields.map((f) => f.sortOrder)) + 1
        : fields.length;

    startTransition(async () => {
      try {
        const field = await addFieldToExistingProject(
          projectId,
          `${groupName} New Field`,
          "text",
          sortOrder
        );
        // Insert after last field in this group
        const lastStoryIndex = fields.reduce(
          (acc, f, i) =>
            f.name.match(new RegExp(`^${groupName}\\s+`, "i")) ? i : acc,
          -1
        );
        setFields((prev) => {
          const newArr = [...prev];
          newArr.splice(lastStoryIndex + 1, 0, {
            id: field.id,
            name: field.name,
            fieldType: "text",
            sortOrder,
          });
          return newArr;
        });
        markDirty(field.id);
      } catch {
        toast.error("Failed to add field");
      }
    });
  };

  const renderField = (field: ExistingField) => {
    const isDirty = dirty.has(field.id);
    return (
      <SortableEditorRow
        key={field.id}
        field={field}
        isDirty={isDirty}
        isPending={isPending}
        checkingDelete={checkingDelete}
        onUpdate={updateLocal}
        onSave={handleSaveField}
        onDelete={handleRequestDelete}
      />
    );
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? "s" : ""}
            {dirty.size > 0 && (
              <span className="text-amber-600 ml-2">
                ({dirty.size} unsaved)
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddField}
              disabled={isPending}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddStory}
              disabled={isPending}
            >
              <Layers className="h-4 w-4 mr-1" />
              Add Story
            </Button>
          </div>
        </div>

        {fields.length === 0 && (
          <div className="text-center py-6 border border-dashed">
            <p className="text-sm text-muted-foreground">
              No fields configured yet.
            </p>
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {grouped.map((item) => {
                if (item.type === "field" && item.field) {
                  return renderField(item.field as ExistingField);
                }
                if (item.type === "group" && item.groupName && item.fields) {
                  return (
                    <div
                      key={item.groupName}
                      className="border-l-4 border-l-[#DB011C] bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#DB011C]">
                          {item.groupName}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAddFieldToStory(item.groupName!)}
                            disabled={isPending}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Field
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDuplicateStory(item.groupName!)}
                            disabled={isPending}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Duplicate
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveStory(item.groupName!)}
                            disabled={isPending || checkingDelete}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                      {(item.fields as ExistingField[]).map((f) => renderField(f))}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#DB011C]" />
              Delete {pendingDelete?.fieldName}?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <span className="block">
                This field has existing data that will be permanently deleted:
              </span>
              <span className="block">
                {pendingDelete?.hasEnglish && (
                  <span className="block text-foreground">
                    &bull; English source value will be removed
                  </span>
                )}
                {(pendingDelete?.translationCount ?? 0) > 0 && (
                  <span className="block text-foreground">
                    &bull; {pendingDelete?.translationCount} translation
                    {pendingDelete?.translationCount !== 1 ? "s" : ""} across
                    all regions will be deleted
                  </span>
                )}
              </span>
              <span className="block font-medium text-foreground">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={
                pendingDelete?.fieldId.includes(",")
                  ? handleConfirmDeleteStory
                  : handleConfirmDelete
              }
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SortableEditorRow({
  field,
  isDirty,
  isPending,
  checkingDelete,
  onUpdate,
  onSave,
  onDelete,
}: {
  field: ExistingField;
  isDirty: boolean;
  isPending: boolean;
  checkingDelete: boolean;
  onUpdate: (id: string, key: "name" | "fieldType", value: string) => void;
  onSave: (field: ExistingField) => void;
  onDelete: (field: ExistingField) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border bg-card p-2.5"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={field.name}
        onChange={(e) => onUpdate(field.id, "name", e.target.value)}
        className="flex-1"
      />
      <Select
        value={field.fieldType}
        onValueChange={(v) => onUpdate(field.id, "fieldType", v as string)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="textarea">Textarea</SelectItem>
          <SelectItem value="url">URL</SelectItem>
        </SelectContent>
      </Select>
      {isDirty && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 shrink-0"
          onClick={() => onSave(field)}
          disabled={isPending}
        >
          <Save className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onDelete(field)}
        disabled={isPending || checkingDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
