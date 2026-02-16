import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, icon, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="py-14 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary/70 border border-border flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5 gold-gradient text-primary-foreground">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
