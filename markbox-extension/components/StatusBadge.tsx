import { cn } from "@/lib/utils";
import { Clock, BookOpen, CheckCircle2, Archive } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Clock; dotColor: string }
> = {
  unread: { label: "待读", icon: Clock, dotColor: "bg-amber-400" },
  reading: {
    label: "在读",
    icon: BookOpen,
    dotColor: "bg-[#b76e4b]",
  },
  read: {
    label: "已读",
    icon: CheckCircle2,
    dotColor: "bg-emerald-400",
  },
  archived: {
    label: "归档",
    icon: Archive,
    dotColor: "bg-zinc-300 dark:bg-zinc-500",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const conf = STATUS_CONFIG[status] || STATUS_CONFIG.unread;
  const Icon = conf.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-medium font-sans",
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", conf.dotColor)} />
      <Icon className="h-3 w-3 opacity-50" />
      {conf.label}
    </span>
  );
}

export { STATUS_CONFIG };
