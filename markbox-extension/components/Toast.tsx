import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onDone?: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = "success",
  onDone,
  duration = 2000,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl",
        "text-[13px] font-medium shadow-lg transition-all duration-300",
        "glass-card",
        type === "success"
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-red-700 dark:text-red-400",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      {message}
    </div>
  );
}
