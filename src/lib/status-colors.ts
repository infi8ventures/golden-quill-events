export const quotationStatusClasses: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-primary/15 text-primary border-primary/30",
  accepted: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  converted: "bg-accent/15 text-accent border-accent/30",
};

export const invoiceStatusClasses: Record<string, string> = {
  unpaid: "bg-destructive/15 text-destructive border-destructive/30",
  partial: "bg-warning/15 text-warning border-warning/30",
  paid: "bg-success/15 text-success border-success/30",
  overdue: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};
