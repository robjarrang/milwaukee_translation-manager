import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "pending" | "partial" | "complete";
}

const config = {
  pending: {
    label: "Pending",
    className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  },
  partial: {
    label: "Partial",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  },
  complete: {
    label: "Complete",
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = config[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
