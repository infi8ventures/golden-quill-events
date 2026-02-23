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
    <div className="flex flex-col gap-3 mb-4 sm:mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-foreground truncate">
              {title}
            </h1>
            {leftAddon}
          </div>
          {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">{subtitle}</p>}
        </div>
        {right && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {right}
          </div>
        )}
      </div>
    </div>
  );
}
