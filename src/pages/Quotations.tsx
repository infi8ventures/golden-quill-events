import { useEffect, useState } from "react";
import { Plus, Eye, ArrowRightLeft, Trash2, Search, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { quotationStatusClasses } from "@/lib/status-colors";
import { useTableSearch } from "@/lib/useTableSearch";

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  total: number;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
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
    return [q.quotation_number, q.title, q.status, q.clients?.name || ""].join(" ");
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

    const { error } = await supabase.from("invoices").insert({
      user_id: user.id,
      quotation_id: q.id,
      client_id: fullQ.client_id,
      event_id: fullQ.event_id,
      invoice_number: invoiceNumber,
      title: fullQ.title,
      subtotal: fullQ.subtotal,
      gst_percentage: fullQ.gst_percentage,
      gst_amount: fullQ.gst_amount,
      discount: fullQ.discount,
      total: fullQ.total,
      balance_due: fullQ.total,
    });

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
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search quotations..."
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Button onClick={() => navigate("/quotations/new")} className="gold-gradient text-primary-foreground">
              <Plus className="h-4 w-4 mr-2" />New Quotation
            </Button>
          </>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
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
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Number</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Client</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
                <TableHead className="text-muted-foreground">Total</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <p className="font-medium text-foreground">{q.quotation_number}</p>
                    <p className="text-xs text-muted-foreground">{q.title}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{q.clients?.name || "-"}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(q.created_at)}</TableCell>
                  <TableCell className="font-medium text-foreground">{formatCurrency(Number(q.total))}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={quotationStatusClasses[q.status] || quotationStatusClasses.draft}>
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/quotations/${q.id}`)} className="text-muted-foreground hover:text-primary" title="View"><Eye className="h-4 w-4" /></button>
                      {q.status !== "converted" && (
                        <button onClick={() => convertToInvoice(q)} className="text-muted-foreground hover:text-success" title="Convert to Invoice"><ArrowRightLeft className="h-4 w-4" /></button>
                      )}
                      <button onClick={() => handleDelete(q.id)} className="text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
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
