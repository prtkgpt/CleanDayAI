import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "warn" | "good";
}) {
  const tones = {
    default: "text-foreground",
    warn: "text-amber-400",
    good: "text-emerald-400",
  };
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className={cn("mt-2 text-2xl font-semibold", tones[tone])}>{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <div className="rounded-md bg-secondary p-2 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
