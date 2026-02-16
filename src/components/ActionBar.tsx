import { ReactNode } from "react";

interface ActionBarProps {
  title: string;
  subtitle?: string;
  leftAddon?: ReactNode;
  right?: ReactNode;
}

/**
 * Consistent top action bar used across pages: title/subtitle left, actions right.
 */
export function ActionBar({ title, subtitle, leftAddon, right }: ActionBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground truncate">
              {title}
            </h1>
            {leftAddon}
          </div>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
          {right}
        </div>
      </div>
    </div>
  );
}
