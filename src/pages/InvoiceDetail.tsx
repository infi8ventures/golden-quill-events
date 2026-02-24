import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import html2pdf from "html2pdf.js";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/KM_logo.png";

interface Invoice {
  id: string; invoice_number: string; title: string; subtotal: number; gst_percentage: number;
  gst_amount: number; discount: number; total: number; amount_paid: number; balance_due: number;
  status: string; created_at: string; notes: string; terms: string;
  client_name?: string;
  event_name?: string;
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

  const [showPrintPreview, setShowPrintPreview] = useState(false);

  const fetchData = async () => {
    const { data: inv } = await supabase.from("invoices").select("*, clients(name, email, phone, company, gst_number)").eq("id", id).single();
    if (inv) {
      setInvoice(inv);
      setPayAmount(Number(inv.balance_due) || 0);

      // First try to get invoice_items directly
      const { data: invItems } = await supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort_order");

      if (invItems && invItems.length > 0) {
        setItems(invItems.map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit: i.unit || "nos",
          rate: Number(i.rate),
          amount: Number(i.amount)
        })));
      } else if (inv.quotation_id) {
        // Fallback to quotation_items
        const { data: qi } = await supabase.from("quotation_items").select("*").eq("quotation_id", inv.quotation_id).order("sort_order");
        setItems((qi || []).map((i: any) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit: i.unit || "nos",
          rate: Number(i.rate),
          amount: Number(i.amount)
        })));
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

  const handleDownloadPDF = () => {
    if (!invoice || !invoice.invoice_number || items.length === 0) {
      toast({ title: "Error", description: "Please ensure invoice data is loaded", variant: "destructive" });
      return;
    }

    // Show preview first
    setShowPrintPreview(true);

    // Generate PDF after a short delay to ensure rendering
    setTimeout(() => {
      const element = document.getElementById('invoice-print-content');
      if (!element) {
        toast({ title: "Error", description: "Could not find print content", variant: "destructive" });
        setShowPrintPreview(false);
        return;
      }

      const opt = {
        margin: 0,
        filename: `Invoice_${invoice.invoice_number}.pdf`,
        image: { type: 'png' as const },
        html2canvas: {
          scale: 3,
          logging: false,
          backgroundColor: '#ffffff',
          useCORS: true
        },
        jsPDF: {
          unit: 'in' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setShowPrintPreview(false);
        toast({ title: "PDF downloaded successfully!" });
      }).catch((error: any) => {
        console.error('PDF generation error:', error);
        setShowPrintPreview(false);
        toast({ title: "Error generating PDF", description: error.message, variant: "destructive" });
      });
    }, 500);
  };

  if (!invoice) return <AppLayout><div className="text-center text-muted-foreground py-20">Loading...</div></AppLayout>;

  return (
    <>
      {/* Print-only view - shown in dialog during PDF generation */}
      {showPrintPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto'
        }}>
          <div className="bg-white max-w-[860px] m-4 shadow-2xl">
            <div className="print-formal">
              <div id="invoice-print-content" className="print-formal-sheet">
                {/* Watermark Logo */}
                <img src={logoImg} className="print-formal-watermark" alt="Watermark" />

                <div className="print-formal-header">
                  <div className="print-formal-logo-container">
                    <img src={logoImg} className="print-formal-logo" alt="Logo" />
                  </div>
                  <div className="print-formal-company">
                    <div className="name">K M Enterprises</div>
                    <div className="addr">#612, Nagendra Nilaya, 8th Main 1st Stage,<br />Vijayanagar Mysuru</div>
                  </div>
                </div>

                <div className="print-formal-title-container">
                  <div className="title">INVOICE</div>
                </div>

                <div className="print-formal-divider" />

                <div className="print-formal-details-grid">
                  <div className="item">
                    <span className="k">Invoice No</span>
                    <span className="v">{invoice.invoice_number}</span>
                  </div>
                  <div className="item">
                    <span className="k">Date</span>
                    <span className="v">{formatDate(invoice.created_at)}</span>
                  </div>
                  <div className="item">
                    <span className="k">GSTIN</span>
                    <span className="v">29AAXFK3522C1Z6</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6 relative z-[1]">
                  <div>
                    <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Bill To</div>
                    <div className="text-sm font-bold text-black">{invoice.client_name || invoice.clients?.name || "—"}</div>
                    {(invoice.clients?.company && !invoice.client_name) && <div className="text-xs text-black">{invoice.clients.company}</div>}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Event</div>
                    <div className="text-sm font-bold text-black">{invoice.event_name || "—"}</div>
                  </div>
                </div>


                <div className="print-formal-section">
                  <div className="hd">Description of Services</div>
                  <table className="print-formal-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Description</th>
                        <th className="num" style={{ width: '60px' }}>Qty</th>
                        <th style={{ width: '60px' }}>Unit</th>
                        <th className="num" style={{ width: '100px' }}>Rate</th>
                        <th className="num" style={{ width: '120px' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{item.description}</td>
                          <td className="num">{item.quantity}</td>
                          <td>{item.unit}</td>
                          <td className="num">{formatCurrency(item.rate)}</td>
                          <td className="num">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="print-formal-summary">
                  <div />
                  <div className="print-formal-totals">
                    <div className="print-formal-total-row">
                      <span className="k">Subtotal</span>
                      <span>{formatCurrency(Number(invoice.subtotal))}</span>
                    </div>
                    {Number(invoice.discount) > 0 && (
                      <div className="print-formal-total-row">
                        <span className="k">Discount</span>
                        <span>-{formatCurrency(Number(invoice.discount))}</span>
                      </div>
                    )}
                    <div className="print-formal-total-row">
                      <span className="k">GST ({invoice.gst_percentage}%)</span>
                      <span>{formatCurrency(Number(invoice.gst_amount))}</span>
                    </div>
                    <div className="print-formal-total-row grand">
                      <span>Total Amount</span>
                      <span>{formatCurrency(Number(invoice.total))}</span>
                    </div>
                    <div className="print-formal-total-row" style={{ marginTop: '4px', fontWeight: 600 }}>
                      <span className="k">Amount Paid</span>
                      <span>{formatCurrency(Number(invoice.amount_paid) || 0)}</span>
                    </div>
                    <div className="print-formal-total-row" style={{ fontWeight: 700 }}>
                      <span className="k">Balance Due</span>
                      <span>{formatCurrency(Number(invoice.balance_due))}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  {invoice.notes && (
                    <div className="print-formal-section">
                      <div className="hd">Notes</div>
                      <div style={{ fontSize: '11px', color: '#000000', fontWeight: 500 }}>{invoice.notes}</div>
                    </div>
                  )}
                  <div className="print-formal-section">
                    <div className="hd">Terms & Conditions</div>
                    <div style={{ fontSize: '11px', color: '#000000', lineHeight: '1.5', fontWeight: 500 }}>
                      {invoice.terms || "Payment within 30 days of invoice date."}
                    </div>
                  </div>
                </div>

                <div className="print-formal-thanks-container">
                  <div className="print-formal-thanks">
                    Thank you for your business.
                  </div>
                </div>

                <div className="print-formal-footer">
                  <div className="print-formal-left-col">
                    <div className="print-formal-bank">
                      <div className="hd-sub">Bank Details</div>
                      <div className="row"><span className="k">Account Name:</span> K M Enterprises</div>
                      <div className="row"><span className="k">Account No:</span> 50200064343340</div>
                      <div className="row"><span className="k">IFSC:</span> HDFC0000065</div>
                      <div className="row"><span className="k">Branch:</span> HDFC Bank, Saraswathipuram</div>
                    </div>
                  </div>
                  <div className="print-formal-sign">
                    <div className="line" />
                    <div className="role">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screen view */}
      <AppLayout>
        <div className="no-print">
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
                <Button onClick={handleDownloadPDF} variant="outline" className="border-border text-foreground hover:bg-secondary">
                  <Download className="h-4 w-4 mr-2" />Download PDF
                </Button>
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Client Info */}
              {(invoice.client_name || invoice.clients) && (
                <div className="glass-card rounded-xl p-6">
                  <h3 className="font-serif font-semibold text-foreground mb-3">Bill To</h3>
                  <p className="text-foreground font-medium">{invoice.client_name || invoice.clients?.name}</p>
                  {invoice.event_name && <p className="text-sm text-primary font-medium mt-1">Event: {invoice.event_name}</p>}
                  {invoice.clients && (
                    <>
                      <p className="text-sm text-muted-foreground">{invoice.clients.company}</p>
                      <p className="text-sm text-muted-foreground">{invoice.clients.email} · {invoice.clients.phone}</p>
                      {invoice.clients.gst_number && <p className="text-sm text-muted-foreground">GST: {invoice.clients.gst_number}</p>}
                    </>
                  )}
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
                <div className="flex justify-between text-success"><span>Paid</span><span>{formatCurrency(Number(invoice.amount_paid) || 0)}</span></div>
                <div className="flex justify-between font-semibold text-destructive"><span>Balance Due</span><span>{formatCurrency(Number(invoice.balance_due))}</span></div>
              </div>
              <div className="mt-4 text-center">
                <Badge variant="outline" className={`text-sm px-4 py-1 ${invoice.status === "paid" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}`}>
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
