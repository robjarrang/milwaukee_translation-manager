import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: "pending" | "partial" | "complete";
}

const config = {
  pending: {
    label: "Pending",
    className: "bg-[#DB011C]/10 text-[#DB011C] border-[#DB011C]/20",
  },
  partial: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-900 border-amber-300",
  },
  complete: {
    label: "Complete",
    className: "bg-green-100 text-green-900 border-green-300",
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
