import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

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
  const [gstPercentage, setGstPercentage] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment within 30 days of invoice date.");
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unit: "nos", rate: 0, amount: 0 }]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);

  const subtotal = items.reduce((s, i) => s + i.amount, 0);
  const gstAmount = (subtotal - discount) * (gstPercentage / 100);
  const total = subtotal - discount + gstAmount;

  useEffect(() => {
    if (!user) return;
    supabase.from("clients").select("id, name").then(({ data }) => setClients(data || []));
    supabase.from("events").select("id, name").then(({ data }) => setEvents(data || []));

    if (isEdit) {
      supabase.from("quotations").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          setTitle(data.title); setClientId(data.client_id || ""); setEventId(data.event_id || "");
          setGstPercentage(Number(data.gst_percentage)); setDiscount(Number(data.discount));
          setNotes(data.notes || ""); setTerms(data.terms || "");
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

  const handleSave = async () => {
    if (!user || !title) { toast({ title: "Please fill required fields", variant: "destructive" }); return; }

    const quotationData = {
      user_id: user.id,
      title,
      client_id: clientId || null,
      event_id: eventId || null,
      subtotal,
      gst_percentage: gstPercentage,
      gst_amount: gstAmount,
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
      const { data, error } = await supabase.from("quotations").insert({ ...quotationData, quotation_number }).select("id").single();
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
    <AppLayout>
      <PageHeader title={isEdit ? "Edit Quotation" : "New Quotation"} subtitle="Build your quotation with line items" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-serif font-semibold text-foreground mb-4">Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 bg-secondary border-border" placeholder="e.g. Wedding Decoration Package" required />
              </div>
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Event</Label>
                <Select value={eventId} onValueChange={setEventId}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-semibold text-foreground">Line Items</h3>
              <Button onClick={addItem} variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
                <Plus className="h-4 w-4 mr-1" />Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-12 md:col-span-4">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                    <Input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} className="bg-secondary border-border" placeholder="Description" />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                    <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Unit</Label>}
                    <Input value={item.unit} onChange={(e) => updateItem(i, "unit", e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Rate</Label>}
                    <Input type="number" value={item.rate} onChange={(e) => updateItem(i, "rate", Number(e.target.value))} className="bg-secondary border-border" />
                  </div>
                  <div className="col-span-2 md:col-span-1 text-right text-sm text-foreground pt-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground block">Amount</Label>}
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="glass-card rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-secondary border-border" rows={3} />
              </div>
              <div>
                <Label className="text-muted-foreground">Terms & Conditions</Label>
                <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} className="mt-1 bg-secondary border-border" rows={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 gold-border border sticky top-8">
            <h3 className="font-serif font-semibold text-foreground mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Discount</span>
                <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-28 bg-secondary border-border text-right h-8" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">GST (%)</span>
                <Input type="number" value={gstPercentage} onChange={(e) => setGstPercentage(Number(e.target.value))} className="w-28 bg-secondary border-border text-right h-8" />
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST Amount</span><span className="text-foreground">{formatCurrency(gstAmount)}</span></div>
              <div className="border-t border-border pt-3 flex justify-between font-serif font-bold text-lg">
                <span className="text-foreground">Total</span>
                <span className="gold-text">{formatCurrency(total)}</span>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full mt-6 gold-gradient text-primary-foreground font-semibold">
              <Save className="h-4 w-4 mr-2" />Save Quotation
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
