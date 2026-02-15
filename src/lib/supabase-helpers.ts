import { supabase } from "@/integrations/supabase/client";

export async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function generateNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
}
