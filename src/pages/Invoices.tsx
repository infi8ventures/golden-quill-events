import { useEffect, useState } from "react";
import { Eye, Trash2, Search, Receipt, Download, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { ActionBar } from "@/components/ActionBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { invoiceStatusClasses } from "@/lib/status-colors";
import { useTableSearch } from "@/lib/useTableSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 bg-secondary border-border text-sm"
            />
          </div>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <EmptyState
            title={invoices.length === 0 ? "No invoices yet" : "No results"}
            description={invoices.length === 0 ? "Convert a quotation to create your first invoice." : "Try a different search term."}
            icon={<Receipt className="h-5 w-5" />}
          />
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Invoice</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell text-xs sm:text-sm">Client</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell text-xs sm:text-sm">Date</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Total</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell text-xs sm:text-sm">Paid</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-muted-foreground w-16 sm:w-24 text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="py-3">
                    <p className="font-medium text-foreground text-sm">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">{inv.title}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{inv.clients?.name || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{formatDate(inv.created_at)}</TableCell>
                  <TableCell className="font-medium text-foreground text-sm whitespace-nowrap">{formatCurrency(Number(inv.total) || 0)}</TableCell>
                  <TableCell className="hidden md:table-cell text-success text-sm">{formatCurrency(Number(inv.amount_paid) || 0)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${invoiceStatusClasses[inv.status] || invoiceStatusClasses.unpaid}`}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* Desktop actions */}
                    <div className="hidden sm:flex gap-2">
                      <button onClick={() => navigate(`/invoices/${inv.id}`)} className="text-muted-foreground hover:text-primary p-1" title="View & Download"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(inv.id)} className="text-muted-foreground hover:text-destructive p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    {/* Mobile dropdown menu */}
                    <div className="sm:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => navigate(`/invoices/${inv.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View & Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
