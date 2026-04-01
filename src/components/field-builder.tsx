"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Copy, Layers, GripVertical } from "lucide-react";
import { groupFields, getNextStoryNumber } from "@/lib/field-groups";
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

export interface FieldDefinition {
  id: string;
  name: string;
  type: "text" | "textarea" | "url";
}

interface FieldBuilderProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
}

let nextId = 1;
function genId() {
  return `field-${nextId++}-${Date.now()}`;
}

function makeStoryFields(n: number): FieldDefinition[] {
  const p = `Story ${n}`;
  return [
    { id: genId(), name: `${p} Title`, type: "text" },
    { id: genId(), name: `${p} Description`, type: "textarea" },
    { id: genId(), name: `${p} CTA Text`, type: "text" },
    { id: genId(), name: `${p} CTA Link`, type: "url" },
  ];
}

export function makeDefaultPreset(): FieldDefinition[] {
  return [
    { id: genId(), name: "Subject Line", type: "text" },
    { id: genId(), name: "Preview Text", type: "text" },
    ...makeStoryFields(1),
  ];
}

export function FieldBuilder({ fields, onChange }: FieldBuilderProps) {
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
    onChange(updated);
  };

  const addField = () => {
    onChange([...fields, { id: genId(), name: "", type: "text" }]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, key: keyof FieldDefinition, value: string) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const addStory = () => {
    const n = getNextStoryNumber(fields);
    onChange([...fields, ...makeStoryFields(n)]);
  };

  const duplicateStory = (groupName: string) => {
    const n = getNextStoryNumber(fields);
    const newPrefix = `Story ${n}`;
    const storyFields = fields.filter((f) =>
      f.name.match(new RegExp(`^${groupName}\\s+`, "i"))
    );
    const duped = storyFields.map((f) => ({
      id: genId(),
      name: f.name.replace(new RegExp(`^${groupName}`, "i"), newPrefix),
      type: f.type,
    }));
    onChange([...fields, ...duped]);
  };

  const removeStory = (groupName: string) => {
    onChange(
      fields.filter(
        (f) => !f.name.match(new RegExp(`^${groupName}\\s+`, "i"))
      )
    );
  };

  const addFieldToStory = (groupName: string) => {
    // Insert after the last field in this group
    const lastIdx = fields.reduce(
      (acc, f, i) =>
        f.name.match(new RegExp(`^${groupName}\\s+`, "i")) ? i : acc,
      -1
    );
    const newFields = [...fields];
    newFields.splice(lastIdx + 1, 0, {
      id: genId(),
      name: `${groupName} `,
      type: "text",
    });
    onChange(newFields);
  };

  // Render a single field row
  const renderField = (
    field: FieldDefinition,
    showPrefix?: string
  ) => (
    <SortableFieldRow
      key={field.id}
      field={field}
      showPrefix={showPrefix}
      onUpdate={updateField}
      onRemove={removeField}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-medium">Fields</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4 mr-1" />
            Add Field
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addStory}>
            <Layers className="h-4 w-4 mr-1" />
            Add Story
          </Button>
        </div>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-6 border border-dashed">
          <p className="text-sm text-muted-foreground">
            No fields yet. Add fields manually or add a story.
          </p>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {grouped.map((item) => {
          if (item.type === "field" && item.field) {
            return renderField(item.field);
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
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => addFieldToStory(item.groupName!)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Field
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => duplicateStory(item.groupName!)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeStory(item.groupName!)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
                {item.fields.map((f) => renderField(f, item.groupName))}
              </div>
            );
          }
          return null;
        })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableFieldRow({
  field,
  showPrefix,
  onUpdate,
  onRemove,
}: {
  field: FieldDefinition;
  showPrefix?: string;
  onUpdate: (id: string, key: keyof FieldDefinition, value: string) => void;
  onRemove: (id: string) => void;
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
        placeholder={showPrefix ? `${showPrefix} field name...` : "Field name"}
        value={field.name}
        onChange={(e) => onUpdate(field.id, "name", e.target.value)}
        className="flex-1"
        name="fieldName"
      />
      <Select
        value={field.type}
        onValueChange={(v) => onUpdate(field.id, "type", v as string)}
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
      <input type="hidden" name="fieldType" value={field.type} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
        onClick={() => onRemove(field.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
