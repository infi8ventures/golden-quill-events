import { useEffect, useState } from "react";
import { Eye, Trash2, Search, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { ActionBar } from "@/components/ActionBar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { invoiceStatusClasses } from "@/lib/status-colors";
import { useTableSearch } from "@/lib/useTableSearch";

interface Invoice {
  id: string; invoice_number: string; title: string; total: number; amount_paid: number;
  balance_due: number; status: string; created_at: string; clients?: { name: string } | null;
}

export default function Invoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase.from("invoices").select("*, clients(name)").order("created_at", { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchInvoices(); }, [user]);

  const { query, setQuery, filtered } = useTableSearch(invoices, (inv) => {
    return [inv.invoice_number, inv.title, inv.status, inv.clients?.name || ""].join(" ");
  });

  const handleDelete = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    toast({ title: "Invoice deleted" });
    fetchInvoices();
  };

  return (
    <AppLayout>
      <ActionBar
        title="Invoices"
        subtitle="Track invoices and payments"
        right={
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoices..."
              className="pl-9 bg-secondary border-border"
            />
          </div>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <EmptyState
            title={invoices.length === 0 ? "No invoices yet" : "No results"}
            description={invoices.length === 0 ? "Convert a quotation to create your first invoice." : "Try a different search term."}
            icon={<Receipt className="h-5 w-5" />}
          />
        </div>
      ) : (
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
              {filtered.map((inv) => (
                <TableRow key={inv.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <p className="font-medium text-foreground">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.title}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{inv.clients?.name || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(inv.created_at)}</TableCell>
                  <TableCell className="font-medium text-foreground">{formatCurrency(Number(inv.total))}</TableCell>
                  <TableCell className="hidden md:table-cell text-success">{formatCurrency(Number(inv.amount_paid))}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={invoiceStatusClasses[inv.status] || invoiceStatusClasses.unpaid}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/invoices/${inv.id}`)} className="text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppLayout>
  );
}
