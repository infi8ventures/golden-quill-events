import { useEffect, useState } from "react";
import { Plus, Eye, Trash2, Search, FileText, ArrowRightLeft, MoreVertical } from "lucide-react";
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
import { quotationStatusClasses } from "@/lib/status-colors";
import { useTableSearch } from "@/lib/useTableSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  total: number;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
  client_name?: string;
  event_name?: string;
}

export default function Quotations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("quotations")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    setQuotations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchQuotations();
  }, [user]);

  const { query, setQuery, filtered } = useTableSearch(quotations, (q) => {
    return [q.quotation_number, q.title, q.status, q.clients?.name || "", q.client_name || "", q.event_name || ""].join(" ");
  });

  const handleDelete = async (id: string) => {
    await supabase.from("quotations").delete().eq("id", id);
    toast({ title: "Quotation deleted" });
    fetchQuotations();
  };

  const convertToInvoice = async (q: Quotation) => {
    if (!user) return;
    const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;

    const { data: fullQ } = await supabase.from("quotations").select("*").eq("id", q.id).single();
    if (!fullQ) return;

    // Get quotation items
    const { data: qItems } = await supabase.from("quotation_items").select("*").eq("quotation_id", q.id).order("sort_order");

    const { data: newInvoice, error } = await supabase.from("invoices").insert({
      user_id: user.id,
      quotation_id: q.id,
      client_id: fullQ.client_id,
      event_id: fullQ.event_id,
      client_name: fullQ.client_name,
      event_name: fullQ.event_name,
      invoice_number: invoiceNumber,
      title: fullQ.title,
      subtotal: fullQ.subtotal,
      gst_percentage: fullQ.gst_percentage,
      gst_amount: fullQ.gst_amount,
      discount: fullQ.discount,
      total: fullQ.total,
      amount_paid: 0,
      balance_due: fullQ.total,
      status: "unpaid",
      notes: fullQ.notes,
      terms: fullQ.terms,
    }).select("id").single();

    if (!error && newInvoice && qItems && qItems.length > 0) {
      // Copy quotation items to invoice items
      const invoiceItems = qItems.map((item: any, i: number) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || "nos",
        rate: item.rate,
        amount: item.amount,
        sort_order: i,
      }));
      await supabase.from("invoice_items").insert(invoiceItems);
    }

    if (!error) {
      await supabase.from("quotations").update({ status: "converted" }).eq("id", q.id);
      toast({ title: "Converted to invoice!" });
      fetchQuotations();
    }
  };

  return (
    <AppLayout>
      <ActionBar
        title="Quotations"
        subtitle="Create and manage quotations"
        right={
          <>
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 bg-secondary border-border text-sm"
              />
            </div>
            <Button onClick={() => navigate("/quotations/new")} className="gold-gradient text-primary-foreground w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" /><span className="sm:inline">New Quotation</span>
            </Button>
          </>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <EmptyState
            title={quotations.length === 0 ? "No quotations yet" : "No results"}
            description={quotations.length === 0 ? "Create your first quotation to get started." : "Try a different search term."}
            icon={<FileText className="h-5 w-5" />}
            actionLabel={quotations.length === 0 ? "New Quotation" : undefined}
            onAction={quotations.length === 0 ? () => navigate("/quotations/new") : undefined}
          />
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Number</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell text-xs sm:text-sm">Client</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell text-xs sm:text-sm">Date</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Total</TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm">Status</TableHead>
                <TableHead className="text-muted-foreground w-20 sm:w-32 text-xs sm:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="py-3">
                    <p className="font-medium text-foreground text-sm">{q.quotation_number}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">{q.title}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{q.client_name || q.clients?.name || "-"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">{formatDate(q.created_at)}</TableCell>
                  <TableCell className="font-medium text-foreground text-sm whitespace-nowrap">{formatCurrency(Number(q.total))}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${quotationStatusClasses[q.status] || quotationStatusClasses.draft}`}>
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {/* Desktop actions */}
                    <div className="hidden sm:flex gap-2">
                      <button onClick={() => navigate(`/quotations/${q.id}`)} className="text-muted-foreground hover:text-primary p-1" title="View"><Eye className="h-4 w-4" /></button>
                      {q.status !== "converted" && (
                        <button onClick={() => convertToInvoice(q)} className="text-muted-foreground hover:text-success p-1" title="Convert to Invoice"><ArrowRightLeft className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => handleDelete(q.id)} className="text-muted-foreground hover:text-destructive p-1" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
                          <DropdownMenuItem onClick={() => navigate(`/quotations/${q.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {q.status !== "converted" && (
                            <DropdownMenuItem onClick={() => convertToInvoice(q)}>
                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                              Convert to Invoice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(q.id)} className="text-destructive focus:text-destructive">
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
