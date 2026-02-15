import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Event {
  id: string; name: string; event_type: string; venue: string; event_date: string | null;
  guest_count: number; status: string; client_id: string | null; clients?: { name: string } | null;
}
interface ClientOption { id: string; name: string; }

const emptyForm = { name: "", event_type: "", venue: "", event_date: "", guest_count: 0, status: "upcoming", client_id: "", notes: "" };

const statusColors: Record<string, string> = {
  upcoming: "bg-primary/20 text-primary border-primary/30",
  ongoing: "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetch = async () => {
    const { data } = await supabase.from("events").select("*, clients(name)").order("event_date", { ascending: false });
    setEvents(data || []);
    const { data: cl } = await supabase.from("clients").select("id, name");
    setClientOptions(cl || []);
  };

  useEffect(() => { if (user) fetch(); }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const payload = { ...form, guest_count: Number(form.guest_count), client_id: form.client_id || null, event_date: form.event_date || null };
    if (editing) {
      const { error } = await supabase.from("events").update(payload).eq("id", editing);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("events").insert({ ...payload, user_id: user.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    setOpen(false); setEditing(null); setForm(emptyForm); fetch();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    fetch();
  };

  return (
    <AppLayout>
      <PageHeader
        title="Events"
        subtitle="Manage events and bookings"
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button className="gold-gradient text-primary-foreground"><Plus className="h-4 w-4 mr-2" />New Event</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle className="font-serif">{editing ? "Edit Event" : "New Event"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Event Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 bg-secondary border-border" required />
                </div>
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {clientOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Event Type</Label>
                  <Input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="mt-1 bg-secondary border-border" placeholder="Wedding, Corporate..." />
                </div>
                <div>
                  <Label className="text-muted-foreground">Date</Label>
                  <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Venue</Label>
                  <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Guest Count</Label>
                  <Input type="number" value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: Number(e.target.value) })} className="mt-1 bg-secondary border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {["upcoming", "ongoing", "completed", "cancelled"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full mt-4 gold-gradient text-primary-foreground">{editing ? "Update" : "Save"}</Button>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Event</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Client</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev) => (
              <TableRow key={ev.id} className="border-border hover:bg-secondary/50">
                <TableCell>
                  <p className="font-medium text-foreground">{ev.name}</p>
                  <p className="text-xs text-muted-foreground">{ev.event_type} · {ev.venue}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{ev.clients?.name || "-"}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{formatDate(ev.event_date)}</TableCell>
                <TableCell><Badge variant="outline" className={statusColors[ev.status]}>{ev.status}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(ev.id); setForm({ name: ev.name, event_type: ev.event_type, venue: ev.venue, event_date: ev.event_date || "", guest_count: ev.guest_count, status: ev.status, client_id: ev.client_id || "", notes: "" }); setOpen(true); }} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(ev.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No events yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
