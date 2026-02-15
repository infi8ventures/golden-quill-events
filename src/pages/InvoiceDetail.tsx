import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface Invoice {
  id: string; invoice_number: string; title: string; subtotal: number; gst_percentage: number;
  gst_amount: number; discount: number; total: number; amount_paid: number; balance_due: number;
  status: string; created_at: string; notes: string; terms: string;
  clients?: { name: string; email: string; phone: string; company: string; gst_number: string } | null;
}

interface Payment {
  id: string; amount: number; payment_date: string; payment_method: string; reference_number: string; notes: string;
}

interface QuotationItem {
  description: string; quantity: number; unit: string; rate: number; amount: number;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payRef, setPayRef] = useState("");

  const fetchData = async () => {
    const { data: inv } = await supabase.from("invoices").select("*, clients(name, email, phone, company, gst_number)").eq("id", id).single();
    if (inv) {
      setInvoice(inv);
      setPayAmount(Number(inv.balance_due));

      if (inv.quotation_id) {
        const { data: qi } = await supabase.from("quotation_items").select("*").eq("quotation_id", inv.quotation_id).order("sort_order");
        setItems((qi || []).map((i) => ({ description: i.description, quantity: Number(i.quantity), unit: i.unit || "nos", rate: Number(i.rate), amount: Number(i.amount) })));
      }
    }
    const { data: pays } = await supabase.from("payments").select("*").eq("invoice_id", id).order("payment_date", { ascending: false });
    setPayments(pays || []);
  };

  useEffect(() => { if (user && id) fetchData(); }, [user, id]);

  const recordPayment = async () => {
    if (!user || !invoice) return;
    const { error } = await supabase.from("payments").insert({
      user_id: user.id,
      invoice_id: invoice.id,
      amount: payAmount,
      payment_method: payMethod,
      reference_number: payRef,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }

    const newPaid = Number(invoice.amount_paid) + payAmount;
    const newBalance = Number(invoice.total) - newPaid;
    const newStatus = newBalance <= 0 ? "paid" : "partial";

    await supabase.from("invoices").update({ amount_paid: newPaid, balance_due: Math.max(0, newBalance), status: newStatus }).eq("id", invoice.id);
    toast({ title: "Payment recorded!" });
    setPayOpen(false);
    fetchData();
  };

  const handlePrint = () => window.print();

  if (!invoice) return <AppLayout><div className="text-center text-muted-foreground py-20">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <PageHeader
        title={invoice.invoice_number}
        subtitle={invoice.title}
        action={
          <div className="flex gap-3">
            <Dialog open={payOpen} onOpenChange={setPayOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" disabled={invoice.status === "paid"}>
                  <Plus className="h-4 w-4 mr-2" />Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader><DialogTitle className="font-serif">Record Payment</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div><Label className="text-muted-foreground">Amount</Label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="mt-1 bg-secondary border-border" /></div>
                  <div><Label className="text-muted-foreground">Method</Label><Input value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="mt-1 bg-secondary border-border" placeholder="bank_transfer, upi, cash..." /></div>
                  <div><Label className="text-muted-foreground">Reference</Label><Input value={payRef} onChange={(e) => setPayRef(e.target.value)} className="mt-1 bg-secondary border-border" /></div>
                  <Button onClick={recordPayment} className="w-full gold-gradient text-primary-foreground">Save Payment</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handlePrint} variant="outline" className="border-border text-foreground hover:bg-secondary">
              <Download className="h-4 w-4 mr-2" />Print / PDF
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          {invoice.clients && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-serif font-semibold text-foreground mb-3">Bill To</h3>
              <p className="text-foreground font-medium">{invoice.clients.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.clients.company}</p>
              <p className="text-sm text-muted-foreground">{invoice.clients.email} · {invoice.clients.phone}</p>
              {invoice.clients.gst_number && <p className="text-sm text-muted-foreground">GST: {invoice.clients.gst_number}</p>}
            </div>
          )}

          {/* Items */}
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground text-right">Qty</TableHead>
                  <TableHead className="text-muted-foreground text-right">Rate</TableHead>
                  <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="text-foreground">{item.description}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{item.quantity} {item.unit}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(item.rate)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Payments */}
          {payments.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="font-serif font-semibold text-foreground mb-4">Payment History</h3>
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{formatDate(p.payment_date)}</p>
                      <p className="text-xs text-muted-foreground">{p.payment_method} {p.reference_number && `· ${p.reference_number}`}</p>
                    </div>
                    <p className="text-success font-medium">{formatCurrency(Number(p.amount))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="glass-card rounded-xl p-6 gold-border border h-fit sticky top-8">
          <h3 className="font-serif font-semibold text-foreground mb-4">Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(Number(invoice.subtotal))}</span></div>
            {Number(invoice.discount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-{formatCurrency(Number(invoice.discount))}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">GST ({invoice.gst_percentage}%)</span><span>{formatCurrency(Number(invoice.gst_amount))}</span></div>
            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg font-serif">
              <span>Total</span><span className="gold-text">{formatCurrency(Number(invoice.total))}</span>
            </div>
            <div className="flex justify-between text-success"><span>Paid</span><span>{formatCurrency(Number(invoice.amount_paid))}</span></div>
            <div className="flex justify-between font-semibold text-destructive"><span>Balance Due</span><span>{formatCurrency(Number(invoice.balance_due))}</span></div>
          </div>
          <div className="mt-4 text-center">
            <Badge variant="outline" className={`text-sm px-4 py-1 ${invoice.status === "paid" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}`}>
              {invoice.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
