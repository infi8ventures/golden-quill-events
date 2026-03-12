import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, Printer, CircleDollarSign, Edit2, Share2, Plus, Check, X } from "lucide-react";
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
import logoImg from "@/assets/KM_Logo_Grey.png";
import { FormalTemplate } from "@/components/templates/FormalTemplate";
import { CreativeTemplate } from "@/components/templates/CreativeTemplate";
import { ModernTemplate } from "@/components/templates/ModernTemplate";
import type { TemplateData } from "@/components/templates/FormalTemplate";

interface Invoice {
  id: string; invoice_number: string; title: string; subtotal: number; gst_percentage: number;
  gst_amount: number; discount: number; total: number; amount_paid: number; balance_due: number;
  cgst_percentage: number; sgst_percentage: number; igst_percentage: number;
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
  const [selectedTemplate, setSelectedTemplate] = useState<"formal" | "creative" | "modern">("formal");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [editInvoiceNumber, setEditInvoiceNumber] = useState("");

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

  const handleSaveInvoiceNumber = async () => {
    if (!invoice || !editInvoiceNumber.trim()) return;

    const { error } = await supabase
      .from("invoices")
      .update({ invoice_number: editInvoiceNumber.trim() })
      .eq("id", invoice.id);

    if (error) {
      toast({ title: "Error updating invoice number", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Invoice number updated!" });
    setIsEditingNumber(false);
    fetchData();
  };

  const handleOpenPreview = () => {
    if (!invoice || !invoice.invoice_number) {
      toast({ title: "Error", description: "Invoice data has not loaded yet. Please wait.", variant: "destructive" });
      return;
    }
    setShowPrintPreview(true);
  };

  const generatePDF = (action: 'download' | 'share' = 'download') => {
    setIsGeneratingPdf(true);

    setTimeout(async () => {
      const element = document.getElementById('invoice-print-content');
      if (!element) {
        toast({ title: "Error", description: "Could not find print content", variant: "destructive" });
        setIsGeneratingPdf(false);
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

      try {
        if (action === 'share') {
          if (!navigator.share) {
            toast({ title: "Sharing not supported", description: "Your browser does not support the Web Share API.", variant: "destructive" });
            setIsGeneratingPdf(false);
            return;
          }
          const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob');
          const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });

          await navigator.share({
            title: `Invoice ${invoice.invoice_number}`,
            text: `Please find attached invoice ${invoice.invoice_number} from K M Enterprises.`,
            files: [file]
          });
          toast({ title: "Shared successfully!" });
        } else {
          await html2pdf().set(opt).from(element).save();
          toast({ title: "PDF downloaded successfully!" });
          setShowPrintPreview(false);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('PDF generation error:', error);
          toast({ title: "Error", description: error.message || "Something went wrong", variant: "destructive" });
        }
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 500);
  };

  if (!invoice) return <AppLayout><div className="text-center text-muted-foreground py-20">Loading...</div></AppLayout>;

  return (
    <>
      {/* Print preview modal */}
      {showPrintPreview && (
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-start justify-center overflow-auto p-2 sm:p-4"
          onClick={() => !isGeneratingPdf && setShowPrintPreview(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Invoice Preview"
        >
          {/* Loading indicator */}
          {isGeneratingPdf && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating PDF...
            </div>
          )}

          <div
            className="bg-white max-w-[860px] w-full my-8 shadow-2xl relative rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Control Bar */}
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30 no-print rounded-t-xl">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedTemplate("formal")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTemplate === "formal" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted border border-border"}`}
                >
                  Formal
                </button>
                <button
                  onClick={() => setSelectedTemplate("creative")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTemplate === "creative" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted border border-border"}`}
                >
                  Creative
                </button>
                <button
                  onClick={() => setSelectedTemplate("modern")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTemplate === "modern" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted border border-border"}`}
                >
                  Modern
                </button>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                  Close
                </Button>
                {navigator.share && (
                  <Button onClick={() => generatePDF('share')} disabled={isGeneratingPdf} variant="outline" className="text-foreground">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
                <Button onClick={() => generatePDF('download')} disabled={isGeneratingPdf} className="gold-gradient text-primary-foreground">
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                </Button>
              </div>
            </div>

            {/* Template content */}
            <div id="invoice-print-content">
              {selectedTemplate === "formal" && (
                <FormalTemplate
                  data={{
                    type: 'INVOICE',
                    documentNumber: invoice.invoice_number || 'DRAFT',
                    title: invoice.title || '',
                    date: invoice.created_at || new Date().toISOString(),
                    clientName: invoice.client_name || '',
                    eventName: invoice.event_name || '',
                    items: items.map((i) => ({ ...i, id: (i as any).id || crypto.randomUUID(), description: i.description || '', quantity: i.quantity || 1, rate: i.rate || 0, amount: i.amount || 0 })) || [],
                    subtotal: invoice.subtotal || 0,
                    discount: invoice.discount || 0,
                    tax: invoice.gst_amount || 0,
                    cgstPercentage: invoice.cgst_percentage || 0,
                    cgstAmount: (invoice.subtotal - invoice.discount) * ((invoice.cgst_percentage || 0) / 100),
                    sgstPercentage: invoice.sgst_percentage || 0,
                    sgstAmount: (invoice.subtotal - invoice.discount) * ((invoice.sgst_percentage || 0) / 100),
                    igstPercentage: invoice.igst_percentage || 0,
                    igstAmount: (invoice.subtotal - invoice.discount) * ((invoice.igst_percentage || 0) / 100),
                    total: invoice.total || 0,
                    notes: invoice.notes || '',
                    terms: invoice.terms || ''
                  }}
                />
              )}
              {selectedTemplate === "creative" && (
                <CreativeTemplate
                  data={{
                    type: 'INVOICE',
                    documentNumber: invoice.invoice_number || 'DRAFT',
                    title: invoice.title || '',
                    date: invoice.created_at || new Date().toISOString(),
                    clientName: invoice.client_name || '',
                    eventName: invoice.event_name || '',
                    items: items.map((i) => ({ ...i, id: (i as any).id || crypto.randomUUID(), description: i.description || '', quantity: i.quantity || 1, rate: i.rate || 0, amount: i.amount || 0 })) || [],
                    subtotal: invoice.subtotal || 0,
                    discount: invoice.discount || 0,
                    tax: invoice.gst_amount || 0,
                    cgstPercentage: invoice.cgst_percentage || 0,
                    cgstAmount: (invoice.subtotal - invoice.discount) * ((invoice.cgst_percentage || 0) / 100),
                    sgstPercentage: invoice.sgst_percentage || 0,
                    sgstAmount: (invoice.subtotal - invoice.discount) * ((invoice.sgst_percentage || 0) / 100),
                    igstPercentage: invoice.igst_percentage || 0,
                    igstAmount: (invoice.subtotal - invoice.discount) * ((invoice.igst_percentage || 0) / 100),
                    total: invoice.total || 0,
                    notes: invoice.notes || '',
                    terms: invoice.terms || ''
                  }}
                />
              )}
              {selectedTemplate === "modern" && (
                <ModernTemplate
                  data={{
                    type: 'INVOICE',
                    documentNumber: invoice.invoice_number || 'DRAFT',
                    title: invoice.title || '',
                    date: invoice.created_at || new Date().toISOString(),
                    clientName: invoice.client_name || '',
                    eventName: invoice.event_name || '',
                    items: items.map((i) => ({ ...i, id: (i as any).id || crypto.randomUUID(), description: i.description || '', quantity: i.quantity || 1, rate: i.rate || 0, amount: i.amount || 0 })) || [],
                    subtotal: invoice.subtotal || 0,
                    discount: invoice.discount || 0,
                    tax: invoice.gst_amount || 0,
                    cgstPercentage: invoice.cgst_percentage || 0,
                    cgstAmount: (invoice.subtotal - invoice.discount) * ((invoice.cgst_percentage || 0) / 100),
                    sgstPercentage: invoice.sgst_percentage || 0,
                    sgstAmount: (invoice.subtotal - invoice.discount) * ((invoice.sgst_percentage || 0) / 100),
                    igstPercentage: invoice.igst_percentage || 0,
                    igstAmount: (invoice.subtotal - invoice.discount) * ((invoice.igst_percentage || 0) / 100),
                    total: invoice.total || 0,
                    notes: invoice.notes || '',
                    terms: invoice.terms || ''
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screen view */}
      <AppLayout>
        <div className="no-print">
          <PageHeader
            title={
              isEditingNumber ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editInvoiceNumber}
                    onChange={(e) => setEditInvoiceNumber(e.target.value)}
                    className="h-9 w-48 text-lg font-serif"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveInvoiceNumber} className="h-8 w-8 text-success"><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingNumber(false)} className="h-8 w-8 text-destructive"><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <span>{invoice.invoice_number}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditInvoiceNumber(invoice.invoice_number);
                      setIsEditingNumber(true);
                    }}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              )
            }
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
                <Button onClick={handleOpenPreview} variant="outline" className="border-border text-foreground hover:bg-secondary">
                  <Download className="h-4 w-4 mr-2" />Preview & Download
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
                {Number(invoice.cgst_percentage) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">CGST ({invoice.cgst_percentage}%)</span><span>{formatCurrency((Number(invoice.subtotal) - Number(invoice.discount)) * (Number(invoice.cgst_percentage) / 100))}</span></div>}
                {Number(invoice.sgst_percentage) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">SGST ({invoice.sgst_percentage}%)</span><span>{formatCurrency((Number(invoice.subtotal) - Number(invoice.discount)) * (Number(invoice.sgst_percentage) / 100))}</span></div>}
                {Number(invoice.igst_percentage) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">IGST ({invoice.igst_percentage}%)</span><span>{formatCurrency((Number(invoice.subtotal) - Number(invoice.discount)) * (Number(invoice.igst_percentage) / 100))}</span></div>}
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

