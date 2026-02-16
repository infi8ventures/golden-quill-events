import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import { ActionBar } from "@/components/ActionBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { useTableSearch } from "@/lib/useTableSearch";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  gst_number: string;
  city: string;
  state: string;
}

const emptyClient = { name: "", email: "", phone: "", company: "", gst_number: "", city: "", state: "", address: "" };

export default function Clients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyClient);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchClients(); }, [user]);

  const { query, setQuery, filtered } = useTableSearch(clients, (c) => {
    return [c.name, c.email, c.phone, c.company, c.gst_number, c.city, c.state].join(" ");
  });

  const handleSave = async () => {
    if (!user) return;
    if (editing) {
      const { error } = await supabase.from("clients").update(form).eq("id", editing);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Client updated" });
    } else {
      const { error } = await supabase.from("clients").insert({ ...form, user_id: user.id });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Client added" });
    }
    setOpen(false); setEditing(null); setForm(emptyClient); fetchClients();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("clients").delete().eq("id", id);
    toast({ title: "Client deleted" });
    fetchClients();
  };

  const startEdit = (client: Client) => {
    setEditing(client.id);
    setForm({ name: client.name, email: client.email, phone: client.phone, company: client.company, gst_number: client.gst_number, city: client.city, state: client.state, address: "" });
    setOpen(true);
  };

  return (
    <AppLayout>
      <ActionBar
        title="Clients"
        subtitle="Manage your client directory"
        right={
          <>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients..."
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm(emptyClient); } }}>
              <DialogTrigger asChild>
                <Button className="gold-gradient text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Client</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="font-serif">{editing ? "Edit Client" : "New Client"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {[
                    { key: "name", label: "Name", required: true },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "company", label: "Company" },
                    { key: "gst_number", label: "GST Number" },
                    { key: "city", label: "City" },
                    { key: "state", label: "State" },
                  ].map(({ key, label, required }) => (
                    <div key={key} className={key === "name" ? "col-span-2" : ""}>
                      <Label className="text-muted-foreground">{label}</Label>
                      <Input
                        value={(form as any)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="mt-1 bg-secondary border-border"
                        required={required}
                      />
                    </div>
                  ))}
                </div>
                <Button onClick={handleSave} className="w-full mt-4 gold-gradient text-primary-foreground">
                  {editing ? "Update" : "Save"}
                </Button>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl overflow-hidden">
          <EmptyState
            title={clients.length === 0 ? "No clients yet" : "No results"}
            description={clients.length === 0 ? "Add your first client to start creating quotations and invoices." : "Try a different search term."}
            icon={<Users className="h-5 w-5" />}
            actionLabel={clients.length === 0 ? "Add Client" : undefined}
            onAction={clients.length === 0 ? () => setOpen(true) : undefined}
          />
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Company</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Phone</TableHead>
                <TableHead className="text-muted-foreground hidden lg:table-cell">GST</TableHead>
                <TableHead className="text-muted-foreground w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.company}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground">{c.gst_number}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
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
