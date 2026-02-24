import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, subtitle, icon, trend, onClick }: StatCardProps) {
  return (
    <div
      className={`glass-card rounded-xl p-6 gold-glow animate-fade-in ${onClick ? "cursor-pointer hover:bg-white/5 transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-serif font-bold mt-1 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && <p className="text-xs text-success mt-1">{trend}</p>}
        </div>
        <div className="p-3 rounded-lg bg-primary/10 text-primary">{icon}</div>
      </div>
    </div>
  );
}
