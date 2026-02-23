import { useEffect, useState } from "react";
import { IndianRupee, Users, Calendar, FileText, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/supabase-helpers";
import { AppLayout } from "@/components/AppLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";

interface DashboardStats {
  totalRevenue: number;
  totalClients: number;
  totalEvents: number;
  totalQuotations: number;
  totalInvoices: number;
  pendingPayments: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalClients: 0,
    totalEvents: 0,
    totalQuotations: 0,
    totalInvoices: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      const [clients, events, quotations, invoices, payments] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("quotations").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("id, total, amount_paid, status"),
        supabase.from("payments").select("amount"),
      ]);

      const invoiceData = invoices.data || [];
      const totalRevenue = (payments.data || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const pendingPayments = invoiceData
        .filter((i) => i.status !== "paid" && i.status !== "cancelled")
        .reduce((sum, i) => sum + ((Number(i.total) || 0) - (Number(i.amount_paid) || 0)), 0);

      setStats({
        totalRevenue,
        totalClients: clients.count || 0,
        totalEvents: events.count || 0,
        totalQuotations: quotations.count || 0,
        totalInvoices: invoiceData.length,
        pendingPayments,
      });
    }

    fetchStats();
  }, [user]);

  return (
    <AppLayout>
      <PageHeader title="Dashboard" subtitle="Your business at a glance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          title="Pending Payments"
          value={formatCurrency(stats.pendingPayments)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <StatCard
          title="Total Clients"
          value={String(stats.totalClients)}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Total Events"
          value={String(stats.totalEvents)}
          icon={<Calendar className="h-5 w-5" />}
        />
        <StatCard
          title="Quotations"
          value={String(stats.totalQuotations)}
          icon={<FileText className="h-5 w-5" />}
        />
        <StatCard
          title="Invoices"
          value={String(stats.totalInvoices)}
          icon={<Receipt className="h-5 w-5" />}
        />
      </div>
    </AppLayout>
  );
}
