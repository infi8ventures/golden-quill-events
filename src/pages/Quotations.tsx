import { useEffect, useState } from "react";
import { Plus, Eye, ArrowRightLeft, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Quotation {
  id: string;
  quotation_number: string;
  title: string;
  total: number;
  status: string;
  created_at: string;
  clients?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-primary/20 text-primary border-primary/30",
  accepted: "bg-success/20 text-success border-success/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  converted: "bg-accent/20 text-accent border-accent/30",
};

export default function Quotations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  const fetchQuotations = async () => {
    const { data } = await supabase
      .from("quotations")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    setQuotations(data || []);
  };

  useEffect(() => { if (user) fetchQuotations(); }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from("quotations").delete().eq("id", id);
    toast({ title: "Quotation deleted" });
    fetchQuotations();
  };

  const convertToInvoice = async (q: Quotation) => {
    if (!user) return;
    const { count } = await supabase.from("invoices").select("id", { count: "exact", head: true });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;

    // Get quotation details
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
      <PageHeader
        title="Quotations"
        subtitle="Create and manage quotations"
        action={
          <Button onClick={() => navigate("/quotations/new")} className="gold-gradient text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />New Quotation
          </Button>
        }
      />

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
            {quotations.map((q) => (
              <TableRow key={q.id} className="border-border hover:bg-secondary/50">
                <TableCell>
                  <p className="font-medium text-foreground">{q.quotation_number}</p>
                  <p className="text-xs text-muted-foreground">{q.title}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{q.clients?.name || "-"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(q.created_at)}</TableCell>
                <TableCell className="font-medium text-foreground">{formatCurrency(Number(q.total))}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[q.status]}>{q.status}</Badge></TableCell>
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
            {quotations.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-12">No quotations yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
