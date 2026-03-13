import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, Download, Eye, Save, X, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/supabase-helpers";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import logoImg from "@/assets/KM_Logo_Grey.png";
import { FormalTemplate } from "@/components/templates/FormalTemplate";
import { CreativeTemplate } from "@/components/templates/CreativeTemplate";
import { ModernTemplate } from "@/components/templates/ModernTemplate";
import type { TemplateData } from "@/components/templates/FormalTemplate";

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
  const [selectedTemplate, setSelectedTemplate] = useState<"formal" | "creative" | "modern">("formal");

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

  const handleOpenPreview = () => {
    if (!quotationNumber || items.length === 0 || !title) {
      toast({ title: "Error", description: "Please ensure quotation data is loaded", variant: "destructive" });
      return;
    }
    setShowPrintPreview(true);
  };

  const generatePDF = (action: 'download' | 'share' = 'download') => {
    setIsGeneratingPdf(true);

    setTimeout(async () => {
      const element = document.getElementById('quotation-print-content');
      if (!element) {
        toast({ title: "Error", description: "Could not find print content", variant: "destructive" });
        setIsGeneratingPdf(false);
        return;
      }

      try {
        const targetElement = (element.firstElementChild || element) as HTMLElement;
        const canvas = await html2canvas(targetElement, {
          scale: 3,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const filename = `Quotation_${quotationNumber}.pdf`;

        if (action === 'share') {
          if (!navigator.share) {
            toast({ title: "Sharing not supported", description: "Your browser does not support the Web Share API.", variant: "destructive" });
            setIsGeneratingPdf(false);
            return;
          }
          
          const pdfBlob = pdf.output('blob');
          const file = new File([pdfBlob], filename, { type: 'application/pdf' });

          await navigator.share({
            title: `Quotation ${quotationNumber}`,
            text: `Please find attached quotation ${quotationNumber} from K M Enterprises.`,
            files: [file]
          });
          toast({ title: "Shared successfully!" });
        } else {
          pdf.save(filename);
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

  const templateData: TemplateData = {
    type: 'QUOTATION',
    documentNumber: quotationNumber || 'DRAFT',
    title: title,
    date: createdAt || new Date().toISOString(),
    clientName: clientName,
    eventName: eventName,
    items: items.map((i) => ({ ...i, id: i.id || crypto.randomUUID() })),
    subtotal,
    discount,
    tax: totalGstAmount,
    cgstPercentage,
    cgstAmount,
    sgstPercentage,
    sgstAmount,
    igstPercentage,
    igstAmount,
    total,
    notes,
    terms
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
            className="bg-white max-w-[860px] w-full my-8 shadow-2xl relative rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Template Selector UI */}
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30 no-print">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTemplate("formal")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTemplate === "formal" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}
                >
                  Formal
                </button>
                <button
                  onClick={() => setSelectedTemplate("creative")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTemplate === "creative" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}
                >
                  Creative
                </button>
                <button
                  onClick={() => setSelectedTemplate("modern")}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTemplate === "modern" ? "bg-primary text-primary-foreground" : "bg-white hover:bg-muted"}`}
                >
                  Modern
                </button>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                  Close
                </Button>
                {navigator.share && (
                  <Button onClick={() => generatePDF('share')} disabled={isGeneratingPdf} variant="outline" className="text-foreground border-border hover:bg-muted/50 hidden sm:flex">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                )}
                <Button onClick={() => generatePDF('download')} disabled={isGeneratingPdf} className="gold-gradient text-primary-foreground hidden sm:flex">
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
                </Button>

                {/* Mobile Icon Buttons */}
                {navigator.share && (
                  <Button onClick={() => generatePDF('share')} disabled={isGeneratingPdf} variant="outline" size="icon" className="sm:hidden text-foreground">
                    <Share2 className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={() => generatePDF('download')} disabled={isGeneratingPdf} size="icon" className="gold-gradient text-primary-foreground sm:hidden">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div id="quotation-print-content">
              {selectedTemplate === "formal" && <FormalTemplate data={templateData} />}
              {selectedTemplate === "creative" && <CreativeTemplate data={templateData} />}
              {selectedTemplate === "modern" && <ModernTemplate data={templateData} />}
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
                    onClick={handleOpenPreview}
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-secondary"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Preview & Download</span>
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
                  onClick={handleOpenPreview}
                  variant="outline"
                  className="flex-1 h-12 border-border"
                >
                  <Download className="h-4 w-4 mr-2" />Preview & Download
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
