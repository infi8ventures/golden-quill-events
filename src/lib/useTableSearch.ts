import { useMemo, useState } from "react";

/**
 * Small helper for client-side search filtering.
 */
export function useTableSearch<T>(rows: T[], getHaystack: (row: T) => string) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => getHaystack(r).toLowerCase().includes(q));
  }, [rows, query, getHaystack]);

  return { query, setQuery, filtered };
}
