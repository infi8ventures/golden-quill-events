import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Save, Download, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import html2pdf from "html2pdf.js";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/KM_logo.png";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

interface ClientOption { id: string; name: string; }
interface EventOption { id: string; name: string; }

export default function QuotationBuilder() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isEdit = !!id && id !== "new";

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [eventId, setEventId] = useState("");
  const [cgstPercentage, setCgstPercentage] = useState(9);
  const [sgstPercentage, setSgstPercentage] = useState(9);
  const [igstPercentage, setIgstPercentage] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment within 30 days of invoice date.");
  const [clientName, setClientName] = useState("");
  const [eventName, setEventName] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit: "nos", rate: 0, amount: 0 }]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [quotationNumber, setQuotationNumber] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const cgstAmount = (subtotal - discount) * (cgstPercentage / 100);
  const sgstAmount = (subtotal - discount) * (sgstPercentage / 100);
  const igstAmount = (subtotal - discount) * (igstPercentage / 100);
  const totalGstAmount = cgstAmount + sgstAmount + igstAmount;
  const total = subtotal - discount + totalGstAmount;

  useEffect(() => {
    if (!user) return;
    supabase.from("clients").select("id, name").then(({ data }) => setClients(data || []));
    supabase.from("events").select("id, name").then(({ data }) => setEvents(data || []));

    if (isEdit) {
      supabase.from("quotations").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setTitle(data.title); setClientId(data.client_id || ""); setEventId(data.event_id || "");
          setClientName(data.client_name || ""); setEventName(data.event_name || "");
          setCgstPercentage(Number(data.cgst_percentage || 0));
          setSgstPercentage(Number(data.sgst_percentage || 0));
          setIgstPercentage(Number(data.igst_percentage || 0));
          setDiscount(Number(data.discount || 0));
          setNotes(data.notes || ""); setTerms(data.terms || "");
          setQuotationNumber(data.quotation_number || "");
          setCreatedAt(data.created_at || "");
        }
      });
      supabase.from("quotation_items").select("*").eq("quotation_id", id).order("sort_order").then(({ data }) => {
        if (data && data.length > 0) setItems(data.map((i) => ({ id: i.id, description: i.description, quantity: Number(i.quantity), unit: i.unit || "nos", rate: Number(i.rate), amount: Number(i.amount) })));
      });
    }
  }, [user, id]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === "quantity" || field === "rate") {
      updated[index].amount = Number(updated[index].quantity) * Number(updated[index].rate);
    }
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: "", quantity: 1, unit: "nos", rate: 0, amount: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleDownloadPDF = () => {
    if (!quotationNumber || items.length === 0 || !title) {
      toast({ title: "Error", description: "Please ensure quotation data is loaded", variant: "destructive" });
      return;
    }

    setIsGeneratingPdf(true);
    setShowPrintPreview(true);

    setTimeout(() => {
      const element = document.getElementById('quotation-print-content');
      if (!element) {
        toast({ title: "Error", description: "Could not find print content", variant: "destructive" });
        setShowPrintPreview(false);
        setIsGeneratingPdf(false);
        return;
      }

      const opt = {
        margin: 0,
        filename: `Quotation_${quotationNumber}.pdf`,
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
        setIsGeneratingPdf(false);
        toast({ title: "PDF downloaded successfully!" });
      }).catch((error: any) => {
        console.error('PDF generation error:', error);
        setShowPrintPreview(false);
        setIsGeneratingPdf(false);
        toast({ title: "Error generating PDF", description: error.message, variant: "destructive" });
      });
    }, 500);
  };

  const closePrintPreview = () => {
    if (!isGeneratingPdf) {
      setShowPrintPreview(false);
    }
  };

  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      toast({ title: "Title is required", description: "Please enter a quotation title.", variant: "destructive" });
      return;
    }

    const userId = (user as any)?.id;
    if (!userId) {
      toast({ title: "Not signed in", description: "Please sign in again and retry.", variant: "destructive" });
      return;
    }

    let finalClientId = clientId || null;

    // Auto-link or Create Client based on clientName
    if (!finalClientId && clientName.trim()) {
      const cleanName = clientName.trim();

      // Try to find existing client by exact name (case-insensitive)
      const { data: existingClients, error: searchError } = await supabase
        .from("clients")
        .select("id")
        .ilike("name", cleanName)
        .limit(1);

      if (!searchError && existingClients && existingClients.length > 0) {
        // Link to existing
        finalClientId = existingClients[0].id;
        setClientId(finalClientId); // Update state for future saves in this session
      } else {
        // Create new client
        const { data: newClient, error: createError } = await supabase
          .from("clients")
          .insert({ name: cleanName, user_id: userId })
          .select("id")
          .single();

        if (!createError && newClient) {
          finalClientId = newClient.id;
          setClientId(finalClientId); // Update state
        } else {
          console.error("Failed to auto-create client:", createError);
        }
      }
    }

    const quotationData = {
      user_id: userId,
      title: cleanTitle,
      client_id: finalClientId,
      event_id: eventId || null,
      client_name: clientName,
      event_name: eventName,
      subtotal,
      gst_percentage: cgstPercentage + sgstPercentage + igstPercentage,
      gst_amount: totalGstAmount,
      cgst_percentage: cgstPercentage,
      sgst_percentage: sgstPercentage,
      igst_percentage: igstPercentage,
      discount,
      total,
      notes,
      terms,
    };

    let quotationId = id;

    if (isEdit) {
      await supabase.from("quotations").update(quotationData).eq("id", id);
      await supabase.from("quotation_items").delete().eq("quotation_id", id);
    } else {
      const { count } = await supabase.from("quotations").select("id", { count: "exact", head: true });
      const quotation_number = `QT-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, "0")}`;
      const { data, error } = await supabase.from("quotations").insert({ ...quotationData, quotation_number, status: "new" }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      quotationId = data.id;
    }

    const itemsPayload = items.map((item, i) => ({
      quotation_id: quotationId!,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      rate: item.rate,
      amount: item.amount,
      sort_order: i,
    }));

    await supabase.from("quotation_items").insert(itemsPayload);
    toast({ title: "Quotation saved!" });
    navigate("/quotations");
  };

  return (
    <>
      {/* Print preview modal - optimized for mobile */}
      {showPrintPreview && isEdit && (
        <div
          className="fixed inset-0 bg-black/80 z-[9999] flex items-start justify-center overflow-auto p-2 sm:p-4"
          onClick={closePrintPreview}
          role="dialog"
          aria-modal="true"
          aria-label="Print Preview"
        >
          {/* Close button for mobile */}
          {!isGeneratingPdf && (
            <button
              onClick={closePrintPreview}
              className="fixed top-4 right-4 z-[10000] bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Loading indicator */}
          {isGeneratingPdf && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10000] bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating PDF...
            </div>
          )}

          <div
            className="bg-white max-w-[860px] w-full my-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="print-formal">
              <div id="quotation-print-content" className="print-formal-sheet">
                {/* Watermark Logo */}
                <img src={logoImg} className="print-formal-watermark" alt="Watermark" />

                <div className="print-formal-header">
                  <div className="print-formal-logo-container">
                    <img src={logoImg} className="print-formal-logo" alt="Logo" />
                  </div>
                  <div className="print-formal-company">
                    <div className="name">K M Enterprises</div>
                    <div className="addr">
                      #612, Nagendra Nilaya, 8th Main 1st Stage,<br />
                      Vijayanagar Mysuru
                    </div>
                  </div>
                </div>

                <div className="print-formal-title-container">
                  <div className="title">QUOTATION</div>
                </div>

                <div className="print-formal-divider" />

                <div className="print-formal-details-grid">
                  <div className="item">
                    <span className="k">Quotation No</span>
                    <span className="v">{quotationNumber}</span>
                  </div>
                  <div className="item">
                    <span className="k">Date</span>
                    <span className="v">{createdAt ? formatDate(createdAt) : "—"}</span>
                  </div>
                  <div className="item">
                    <span className="k">GSTIN</span>
                    <span className="v">29AAXFK3522C1Z6</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6 relative z-[1]">
                  <div>
                    <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Bill To</div>
                    <div className="text-sm font-bold text-black">{clientName || "—"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-black uppercase tracking-wider mb-1">Event</div>
                    <div className="text-sm font-bold text-black">{eventName || "—"}</div>
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
                        <th style={{ width: '80px' }}>Unit</th>
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
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="print-formal-total-row">
                      <span className="k">Discount</span>
                      <span>{formatCurrency(discount)}</span>
                    </div>
                    {cgstPercentage > 0 && (
                      <div className="print-formal-total-row">
                        <span className="k">CGST ({cgstPercentage}%)</span>
                        <span>{formatCurrency(cgstAmount)}</span>
                      </div>
                    )}
                    {sgstPercentage > 0 && (
                      <div className="print-formal-total-row">
                        <span className="k">SGST ({sgstPercentage}%)</span>
                        <span>{formatCurrency(sgstAmount)}</span>
                      </div>
                    )}
                    {igstPercentage > 0 && (
                      <div className="print-formal-total-row">
                        <span className="k">IGST ({igstPercentage}%)</span>
                        <span>{formatCurrency(igstAmount)}</span>
                      </div>
                    )}
                    <div className="print-formal-total-row grand">
                      <span>Total Amount</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  {notes && (
                    <div className="print-formal-section">
                      <div className="hd">Notes</div>
                      <div style={{ fontSize: '11px', color: '#000000', fontWeight: 500 }}>{notes}</div>
                    </div>
                  )}
                  <div className="print-formal-section">
                    <div className="hd">Terms & Conditions</div>
                    <div style={{ fontSize: '11px', color: '#000000', fontWeight: 500 }}>{terms}</div>
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
            title={isEdit ? "Edit Quotation" : "New Quotation"}
            subtitle="Build your quotation with line items"
            action={
              isEdit ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowPrintPreview(true)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                  <Button
                    onClick={handleDownloadPDF}
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-secondary"
                    disabled={isGeneratingPdf}
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Download PDF</span>
                  </Button>
                </div>
              ) : undefined
            }
          />

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Details Card */}
              <div className="glass-card rounded-xl p-4 sm:p-6">
                <h3 className="font-serif font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="title" className="text-muted-foreground text-sm">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 bg-secondary border-border h-11 sm:h-10"
                      placeholder="e.g. Wedding Decoration Package"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client" className="text-muted-foreground text-sm">Client Name</Label>
                    <Input
                      id="client"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="mt-1 bg-secondary border-border h-11 sm:h-10"
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event" className="text-muted-foreground text-sm">Event Name</Label>
                    <Input
                      id="event"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      className="mt-1 bg-secondary border-border h-11 sm:h-10"
                      placeholder="Enter event name"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Card */}
              <div className="glass-card rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-serif font-semibold text-foreground text-sm sm:text-base">Line Items</h3>
                  <Button
                    onClick={addItem}
                    variant="outline"
                    size="sm"
                    className="border-primary/30 text-primary hover:bg-primary/10 text-xs sm:text-sm h-9 px-3"
                  >
                    <Plus className="h-4 w-4 mr-1" />Add Item
                  </Button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {items.map((item, i) => (
                    <div key={i} className="p-3 sm:p-0 rounded-xl sm:rounded-none bg-secondary/40 sm:bg-transparent border border-border/50 sm:border-0">
                      {/* Mobile: Card-style stacked layout */}
                      <div className="sm:hidden space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Item {i + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(i)}
                              className="text-muted-foreground hover:text-destructive p-2 -mr-2 touch-manipulation"
                              aria-label={`Remove item ${i + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div>
                          <Label htmlFor={`desc-${i}`} className="text-xs text-muted-foreground">Description</Label>
                          <Input
                            id={`desc-${i}`}
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            className="bg-background border-border mt-1 h-11"
                            placeholder="Item description"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label htmlFor={`qty-${i}`} className="text-xs text-muted-foreground">Qty</Label>
                            <Input
                              id={`qty-${i}`}
                              type="number"
                              inputMode="decimal"
                              value={item.quantity}
                              onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                              className="bg-background border-border mt-1 h-11 text-center"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`unit-${i}`} className="text-xs text-muted-foreground">Unit</Label>
                            <Input
                              id={`unit-${i}`}
                              value={item.unit}
                              onChange={(e) => updateItem(i, "unit", e.target.value)}
                              className="bg-background border-border mt-1 h-11 text-center"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`rate-${i}`} className="text-xs text-muted-foreground">Rate (₹)</Label>
                            <Input
                              id={`rate-${i}`}
                              type="number"
                              inputMode="decimal"
                              value={item.rate}
                              onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                              className="bg-background border-border mt-1 h-11 text-right"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">Amount</span>
                          <span className="font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                        </div>
                      </div>

                      {/* Desktop: Row layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          {i === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            className="bg-secondary border-border"
                            placeholder="Description"
                          />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                            className="bg-secondary border-border"
                          />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs text-muted-foreground">Unit</Label>}
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(i, "unit", e.target.value)}
                            className="bg-secondary border-border"
                          />
                        </div>
                        <div className="col-span-2">
                          {i === 0 && <Label className="text-xs text-muted-foreground">Rate</Label>}
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(i, "rate", Number(e.target.value))}
                            className="bg-secondary border-border"
                          />
                        </div>
                        <div className="col-span-1 text-right text-sm text-foreground pt-1">
                          {i === 0 && <Label className="text-xs text-muted-foreground block">Amount</Label>}
                          {formatCurrency(item.amount)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(i)}
                              className="text-muted-foreground hover:text-destructive p-1"
                              aria-label={`Remove item ${i + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile: Add item button at bottom too */}
                <div className="sm:hidden mt-4 pt-3 border-t border-border/50">
                  <Button
                    onClick={addItem}
                    variant="outline"
                    className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5 h-11"
                  >
                    <Plus className="h-4 w-4 mr-2" />Add Another Item
                  </Button>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="glass-card rounded-xl p-4 sm:p-6">
                <h3 className="font-serif font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">Additional Info</h3>
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="notes" className="text-muted-foreground text-sm">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1 bg-secondary border-border min-h-[100px]"
                      rows={3}
                      placeholder="Additional notes for the client..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="terms" className="text-muted-foreground text-sm">Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                      className="mt-1 bg-secondary border-border min-h-[100px]"
                      rows={3}
                      placeholder="Payment terms, delivery conditions..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary - Desktop Sidebar */}
            <div className="hidden lg:block space-y-6">
              <div className="glass-card rounded-xl p-6 gold-border border sticky top-8">
                <h3 className="font-serif font-semibold text-foreground mb-4">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discount-desktop" className="text-muted-foreground">Discount</Label>
                    <Input
                      id="discount-desktop"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-8"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="cgst-desktop" className="text-muted-foreground">CGST (%)</Label>
                    <Input
                      id="cgst-desktop"
                      type="number"
                      value={cgstPercentage}
                      onChange={(e) => setCgstPercentage(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-8"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="sgst-desktop" className="text-muted-foreground">SGST (%)</Label>
                    <Input
                      id="sgst-desktop"
                      type="number"
                      value={sgstPercentage}
                      onChange={(e) => setSgstPercentage(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-8"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="igst-desktop" className="text-muted-foreground">IGST (%)</Label>
                    <Input
                      id="igst-desktop"
                      type="number"
                      value={igstPercentage}
                      onChange={(e) => setIgstPercentage(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-8"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Taxes</span>
                    <span className="text-foreground">{formatCurrency(totalGstAmount)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-serif font-bold text-lg">
                    <span className="text-foreground">Total</span>
                    <span className="gold-text">{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full mt-6 gold-gradient text-primary-foreground font-semibold h-11">
                  <Save className="h-4 w-4 mr-2" />Save Quotation
                </Button>
              </div>
            </div>

            {/* Summary - Mobile Inline Card */}
            <div className="lg:hidden">
              <div className="glass-card rounded-xl p-4 gold-border border">
                <h3 className="font-serif font-semibold text-foreground mb-3 text-sm">Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discount-mobile" className="text-muted-foreground">Discount</Label>
                    <Input
                      id="discount-mobile"
                      type="number"
                      inputMode="decimal"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-10 text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="cgst-mobile" className="text-muted-foreground">CGST (%)</Label>
                    <Input
                      id="cgst-mobile"
                      type="number"
                      inputMode="decimal"
                      value={cgstPercentage}
                      onChange={(e) => setCgstPercentage(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-10 text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="sgst-mobile" className="text-muted-foreground">SGST (%)</Label>
                    <Input
                      id="sgst-mobile"
                      type="number"
                      inputMode="decimal"
                      value={sgstPercentage}
                      onChange={(e) => setSgstPercentage(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-10 text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="igst-mobile" className="text-muted-foreground">IGST (%)</Label>
                    <Input
                      id="igst-mobile"
                      type="number"
                      inputMode="decimal"
                      value={igstPercentage}
                      onChange={(e) => setIgstPercentage(Number(e.target.value))}
                      className="w-28 bg-secondary border-border text-right h-10 text-sm"
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Taxes</span>
                    <span className="text-foreground">{formatCurrency(totalGstAmount)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-serif font-bold text-base">
                    <span className="text-foreground">Total</span>
                    <span className="gold-text">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Fixed Bottom Save Button */}
          <div className="lg:hidden mobile-bottom-bar">
            <div className="flex gap-2">
              {isEdit && (
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  className="flex-1 h-12 border-border"
                  disabled={isGeneratingPdf}
                >
                  <Download className="h-4 w-4 mr-2" />PDF
                </Button>
              )}
              <Button
                onClick={handleSave}
                className={`gold-gradient text-primary-foreground font-semibold h-12 ${isEdit ? 'flex-[2]' : 'w-full'}`}
              >
                <Save className="h-4 w-4 mr-2" />Save Quotation
              </Button>
            </div>
          </div>

          {/* Spacer for mobile bottom bar */}
          <div className="lg:hidden h-24" />
        </div>
      </AppLayout>
    </>
  );
}
