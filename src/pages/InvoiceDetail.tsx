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
import logoImg from "@/assets/logo.jpeg";

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

  const [showPrintPreview, setShowPrintPreview] = useState(false);

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
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename: `Invoice_${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'in' as const,
          format: 'letter' as const,
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
          <div id="invoice-print-content" style={{
            backgroundColor: 'white',
            maxWidth: '860px',
            margin: '16px',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)'
          }}>
            <div className="print-inv">
              <div className="print-inv-sheet">
                <div className="print-inv-frame">
                  <div className="print-inv-rail" />

                  <div className="print-inv-main">
                    <div className="print-inv-top">
                      <div className="print-inv-brand">
                        <img className="print-inv-logo" src={logoImg} alt="Logo" />
                        <div className="print-inv-company">
                          <div className="name">K M Enterprises</div>
                          <div className="addr">#612, Nagendra Nilaya, 8th Main 1st Stage, Vijayanagar Mysuru</div>
                        </div>
                      </div>

                      <div className="print-inv-badge">
                        <div className="title">INVOICE</div>
                        <div className="kv">
                          <div className="k">Invoice No</div>
                          <div style={{ fontWeight: 800 }}>{invoice.invoice_number}</div>
                          <div className="k">Date</div>
                          <div>{formatDate(invoice.created_at)}</div>
                          <div className="k">GSTIN</div>
                          <div>29AAXFK3522C1Z6</div>
                        </div>
                      </div>
                    </div>

                    <div className="print-inv-section" style={{ marginTop: 10 }}>
                      <div className="hd">Bill to</div>
                      <div className="bd">
                        <div style={{ fontWeight: 900, fontSize: 12 }}>{invoice.clients?.name || "—"}</div>
                        <div style={{ marginTop: 6 }}>
                          {invoice.clients?.company ? <div><span style={{ color: '#64748b' }}>Company:</span> {invoice.clients.company}</div> : null}
                          {invoice.clients?.email ? <div><span style={{ color: '#64748b' }}>Email:</span> {invoice.clients.email}</div> : null}
                          {invoice.clients?.phone ? <div><span style={{ color: '#64748b' }}>Phone:</span> {invoice.clients.phone}</div> : null}
                          {invoice.clients?.gst_number ? <div><span style={{ color: '#64748b' }}>GST:</span> {invoice.clients.gst_number}</div> : null}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 11 }}>
                          <div><span style={{ color: '#64748b' }}>Status:</span> <span style={{ fontWeight: 900 }}>{String(invoice.status || "").toUpperCase()}</span></div>
                          <div><span style={{ color: '#64748b' }}>Paid:</span> <span style={{ fontWeight: 900 }}>{formatCurrency(Number(invoice.amount_paid))}</span></div>
                          <div><span style={{ color: '#64748b' }}>Balance:</span> <span style={{ fontWeight: 900 }}>{formatCurrency(Number(invoice.balance_due))}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="print-inv-section" style={{ marginTop: 10 }}>
                      <div className="hd">Items</div>
                      <div className="bd" style={{ padding: 0 }}>
                        <table className="print-inv-table">
                          <thead>
                            <tr>
                              <th style={{ width: 32 }}>#</th>
                              <th>Description</th>
                              <th className="num" style={{ width: 110 }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td style={{ paddingRight: 14 }}>{item.description}</td>
                                <td className="num">{formatCurrency(item.amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="print-inv-section" style={{ marginTop: 10 }}>
                      <div className="hd">Summary</div>
                      <div className="bd">
                        <div className="print-inv-split">
                          <div>
                            <div className="print-inv-kv" style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '5px 10px', fontSize: 11 }}>
                              <div style={{ color: '#64748b' }}>Account Name</div>
                              <div>K M Enterprises</div>
                              <div style={{ color: '#64748b' }}>Account No</div>
                              <div>50200064343340</div>
                              <div style={{ color: '#64748b' }}>IFSC</div>
                              <div>HDFC0000065</div>
                              <div style={{ color: '#64748b' }}>Branch</div>
                              <div>HDFC Bank, Saraswathipuram</div>
                            </div>
                          </div>

                          <div className="print-inv-totals">
                            <div className="print-inv-row"><span className="k">Subtotal</span><span>{formatCurrency(Number(invoice.subtotal))}</span></div>
                            <div className="print-inv-row"><span className="k">GST ({invoice.gst_percentage}%)</span><span>{formatCurrency(Number(invoice.gst_amount))}</span></div>
                            <div className="print-inv-row"><span className="k">Discount</span><span>{formatCurrency(Number(invoice.discount || 0))}</span></div>
                            <div className="print-inv-row grand"><span>Grand total</span><span>{formatCurrency(Number(invoice.total))}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="print-inv-footer">
                      <div className="print-inv-section" style={{ marginTop: 10 }}>
                        <div className="hd">Notes</div>
                        <div className="bd">{invoice.notes || "—"}</div>
                      </div>
                      <div className="print-inv-section" style={{ marginTop: 10 }}>
                        <div className="hd">Terms</div>
                        <div className="bd">{invoice.terms || "—"}</div>
                      </div>
                    </div>

                    <div className="print-inv-sign">
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11 }}>
                        <div style={{ color: '#64748b' }}>Please make payment on time.</div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800 }}>Authorized Signatory</div>
                          <div className="line" />
                        </div>
                      </div>
                    </div>

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
      </div>
    </AppLayout>
    </>
  );
}
