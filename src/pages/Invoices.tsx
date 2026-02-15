import { useEffect, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string; invoice_number: string; title: string; total: number; amount_paid: number;
  balance_due: number; status: string; created_at: string; clients?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  unpaid: "bg-destructive/20 text-destructive border-destructive/30",
  partial: "bg-warning/20 text-warning border-warning/30",
  paid: "bg-success/20 text-success border-success/30",
  overdue: "bg-destructive/20 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Invoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchInvoices = async () => {
    const { data } = await supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false });
    setInvoices(data || []);
  };

  useEffect(() => { if (user) fetchInvoices(); }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    toast({ title: "Invoice deleted" });
    fetchInvoices();
  };

  return (
    <AppLayout>
      <PageHeader title="Invoices" subtitle="Track invoices and payments" />

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Invoice</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Client</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
              <TableHead className="text-muted-foreground">Total</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Paid</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} className="border-border hover:bg-secondary/50">
                <TableCell>
                  <p className="font-medium text-foreground">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.title}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{inv.clients?.name || "-"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                <TableCell className="font-medium text-foreground">{formatCurrency(Number(inv.total))}</TableCell>
                <TableCell className="hidden md:table-cell text-success">{formatCurrency(Number(inv.amount_paid))}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[inv.status]}>{inv.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/invoices/${inv.id}`)} className="text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(inv.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No invoices yet. Convert a quotation to create one.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
